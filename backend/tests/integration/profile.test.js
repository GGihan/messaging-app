import { jest } from '@jest/globals';
import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { cloudinaryService } from '../../lib/cloudinary.js';

describe("User Routes Integration Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("PATCH /api/profile", () => {
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

      // Mock the Cloudinary helper
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
        .mockRejectedValueOnce(new Error('Cloudinary network timeout'));

      const dummyImageBuffer = Buffer.from('fake-image-bytes');

      const res = await agent
        .patch('/api/profile')
        .field('displayName', 'Should Not Persist')
        .attach('avatar', dummyImageBuffer, 'avatar.png');

      expect(res.status).toBe(502);
      expect(res.body.message).toMatch(/upload failed/i);

      // Verify DB was untouched
      const dbProfile = await prisma.profile.findUnique({
        where: { userId: currentUser.id },
      });
      expect(dbProfile.displayName).toBe(currentUser.profile.displayName);
    });
  });
});