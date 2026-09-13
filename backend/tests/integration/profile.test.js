import { jest } from '@jest/globals';
import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { cloudinaryService } from '../../src/services/cloudinaryService.js';
import request from 'supertest';
import app from '../../src/app.js';
import { BadGatewayError } from '../../src/errors/AppError.js';

describe("Profile Routes Integration Tests", () => {
  let agent;
  let currentUser;

  beforeEach(async () => {
    const setup = await createAuthenticatedAgent({},
      {
        displayName: 'Old Name',
        bio: 'Old Bio',
        avatarUrl: 'https://res.cloudinary.com/demo/image/upload/v1/old-avatar.jpg',
      });
    agent = setup.agent;
    currentUser = setup.user;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("PATCH /api/profile", () => {

    it('should update displayName and bio without wiping the existing avatarUrl', async () => {
      const res = await agent
        .patch('/api/profile')
        .field('displayName', 'New Name')
        .field('bio', 'New Bio');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.displayName).toBe('New Name');
      expect(res.body.data.profile.bio).toBe('New Bio');
      
      expect(res.body.data.profile.avatarUrl).toBe(
        currentUser.profile.avatarUrl
      );
    });
    
    it('should upload a new avatar and update avatarUrl in database', async () => {
      const fakeSecureUrl = 'https://res.cloudinary.com/demo/image/upload/v2/new-avatar.jpg';

      const uploadSpy = jest
        .spyOn(cloudinaryService, 'uploadUserAvatar')
        .mockResolvedValueOnce({ secure_url: fakeSecureUrl });

      const dummyImageBuffer = Buffer.from('fake-image-bytes');

      const res = await agent
        .patch('/api/profile')
        .field('displayName', 'Updated Name')
        .attach('avatar', dummyImageBuffer, 'avatar.png');

      expect(res.status).toBe(200);
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(uploadSpy).toHaveBeenCalledWith(expect.any(Buffer), currentUser.id);
      expect(res.body.data.profile.avatarUrl).toBe(fakeSecureUrl);
      expect(res.body.data.profile.displayName).toBe('Updated Name');

      const dbProfile = await prisma.profile.findUnique({
        where: { userId: currentUser.id },
      });
      expect(dbProfile.avatarUrl).toBe(fakeSecureUrl);
    });

    it('should return 502 if Cloudinary upload fails and not alter database', async () => {
      jest
        .spyOn(cloudinaryService, 'uploadUserAvatar')
        .mockRejectedValueOnce(new BadGatewayError('Image upload failed'));

      const dummyImageBuffer = Buffer.from('fake-image-bytes');

      const res = await agent
        .patch('/api/profile')
        .field('displayName', 'Should Not Persist')
        .attach('avatar', dummyImageBuffer, 'avatar.png');

      expect(res.status).toBe(502);
      expect(res.body.message).toMatch(/upload failed/i);

      const dbProfile = await prisma.profile.findUnique({
        where: { userId: currentUser.id },
      });
      expect(dbProfile.displayName).toBe(currentUser.profile.displayName);
    });
  });

  describe('DELETE /api/profile/avatar', () => {

    it('should delete avatar from Cloudinary and reset avatarUrl to null in DB', async () => {
      const deleteSpy = jest
        .spyOn(cloudinaryService, 'deleteFromCloud')
        .mockResolvedValueOnce({ result: 'ok' });

      const initialProfile = await prisma.profile.findUnique({
        where: { userId: currentUser.id },
      });
      const publicId = cloudinaryService.getPublicIdFromUrl(initialProfile.avatarUrl);

      const res = await agent.delete('/api/profile/avatar');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.avatarUrl).toBeNull();
      expect(res.body.data.profile.displayName).toBe(currentUser.profile.displayName);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(publicId);

      const dbProfile = await prisma.profile.findUnique({
        where: { userId: currentUser.id },
      });
      expect(dbProfile.avatarUrl).toBeNull();
    });

    it('should clear avatarUrl in DB even if Cloudinary deletion throws an error', async () => {
      const deleteSpy = jest
        .spyOn(cloudinaryService, 'deleteFromCloud')
        .mockRejectedValueOnce(new Error('Cloudinary API unreachable'));

      const res = await agent.delete('/api/profile/avatar');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.avatarUrl).toBeNull();

      const dbProfile = await prisma.profile.findUnique({
        where: { userId: currentUser.id },
      });
      expect(dbProfile.avatarUrl).toBeNull();

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });

    it('should return 401 if request is unauthenticated', async () => {
      const deleteSpy = jest.spyOn(cloudinaryService, 'deleteFromCloud');

      const res = await request(app).delete('/api/profile/avatar');

      expect(res.status).toBe(401);
      expect(deleteSpy).not.toHaveBeenCalled();

      const dbProfile = await prisma.profile.findUnique({
        where: { userId: currentUser.id },
      });
      expect(dbProfile.avatarUrl).not.toBeNull();
    });
  });
});