import { jest } from "@jest/globals";
import { createServer } from "node:http";
import { prisma } from "../../lib/prisma.js";
import { presenceService } from "../../src/services/presenceService.js";
import { initSocketServer } from "../../src/sockets/socket.js";
import { registerPresenceHandlers } from "../../src/sockets/handlers/presenceHandler.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { createMockSocket } from "../helpers/createMockSocket.js";

describe("Presence Socket Handler Integration Tests", () => {
  let server;
  let io;
  let userAlice;
  let userBob;
  let userCharlie;
  let ioToSpy;
  let ioEmitSpy;

  beforeAll(async () => {
    server = createServer();
    io = initSocketServer(server);
  });

  afterAll(async () => {
    io.close();
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const setupAlice = await createAuthenticatedAgent({}, { displayName: "Alice Test" });
    const setupBob = await createAuthenticatedAgent({}, { displayName: "Bob Test" });
    const setupCharlie = await createAuthenticatedAgent({}, { displayName: "Charlie Stranger" });

    userAlice = setupAlice.user;
    userBob = setupBob.user;
    userCharlie = setupCharlie.user;

    // Alice and Bob are friends
    await prisma.friendship.create({
      data: {
        senderId: userAlice.id,
        receiverId: userBob.id,
        status: "ACCEPTED",
      },
    });

    // Reset in-memory presence tracking for clean test state
    if (presenceService.activeUsers) {
      presenceService.activeUsers.clear();
    }

    // Spy on the IO broadcast pipeline
    ioEmitSpy = jest.fn();
    ioToSpy = jest.spyOn(io, "to").mockReturnValue({ emit: ioEmitSpy });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("joins personal mailbox room and broadcasts 'online' only to accepted friends", async () => {
    const socketAlice = createMockSocket(userAlice);

    registerPresenceHandlers(io, socketAlice);

    expect(socketAlice.join).toHaveBeenCalledWith(`user:${userAlice.id}`);
    expect(presenceService.isUserOnline(userAlice.id)).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Target Bob's mailbox room, never Charlie's
    expect(ioToSpy).toHaveBeenCalledWith(expect.arrayContaining([`user:${userBob.id}`]));
    expect(ioToSpy).not.toHaveBeenCalledWith(expect.arrayContaining([`user:${userCharlie.id}`]));

    // Match received payload with lastActiveAt: null
    expect(ioEmitSpy).toHaveBeenCalledWith("friend_status_change", {
      userId: userAlice.id,
      status: "online",
      lastActiveAt: null,
    });
  });

  it("does not broadcast 'online' again when opening a second tab", async () => {
    const tab1 = createMockSocket(userAlice);
    const tab2 = createMockSocket(userAlice);

    registerPresenceHandlers(io, tab1);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(ioToSpy).toHaveBeenCalledTimes(1);

    ioToSpy.mockClear();
    ioEmitSpy.mockClear();

    registerPresenceHandlers(io, tab2);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ioToSpy).not.toHaveBeenCalled();
    expect(ioEmitSpy).not.toHaveBeenCalled();
  });

  it("keeps user online when closing 1 of 2 active tabs without updating DB or broadcasting offline", async () => {
    const tab1 = createMockSocket(userAlice);
    const tab2 = createMockSocket(userAlice);

    registerPresenceHandlers(io, tab1);
    registerPresenceHandlers(io, tab2);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Capture the initial timestamp (whether null or pre-set)
    const initialUser = await prisma.user.findUnique({
      where: { id: userAlice.id },
      select: { lastActiveAt: true },
    });

    ioToSpy.mockClear();
    ioEmitSpy.mockClear();

    // Close only the first tab
    tab1.emitClientEvent("disconnect");
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Alice must still be online via tab2
    expect(presenceService.isUserOnline(userAlice.id)).toBe(true);

    // Should not broadcast offline
    expect(ioToSpy).not.toHaveBeenCalled();
    expect(ioEmitSpy).not.toHaveBeenCalled();

    // DB lastActiveAt should NOT have been modified
    const userInDb = await prisma.user.findUnique({
      where: { id: userAlice.id },
      select: { lastActiveAt: true },
    });
    
    expect(userInDb.lastActiveAt).toEqual(initialUser.lastActiveAt);

    // Teardown remaining tab
    tab2.emitClientEvent("disconnect");
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("marks user offline, updates lastActiveAt, and broadcasts 'offline' when the final tab closes", async () => {
    const socketAlice = createMockSocket(userAlice);
    registerPresenceHandlers(io, socketAlice);
    await new Promise((resolve) => setTimeout(resolve, 50));

    ioToSpy.mockClear();
    ioEmitSpy.mockClear();

    socketAlice.emitClientEvent("disconnect");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(presenceService.isUserOnline(userAlice.id)).toBe(false);

    const updated = await prisma.user.findUnique({
      where: { id: userAlice.id },
      select: { lastActiveAt: true },
    });
    expect(updated.lastActiveAt).not.toBeNull();

    expect(ioToSpy).toHaveBeenCalledWith(expect.arrayContaining([`user:${userBob.id}`]));
    expect(ioEmitSpy).toHaveBeenCalledWith("friend_status_change", {
      userId: userAlice.id,
      status: "offline",
      lastActiveAt: updated.lastActiveAt.toISOString(),
    });
  });

  it("broadcasts presence when the user is the receiver of the friendship request", async () => {
    ioToSpy.mockClear();
    ioEmitSpy.mockClear();

    const socketBob = createMockSocket(userBob);
    registerPresenceHandlers(io, socketBob);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ioToSpy).toHaveBeenCalledWith(expect.arrayContaining([`user:${userAlice.id}`]));
    expect(ioEmitSpy).toHaveBeenCalledWith("friend_status_change", {
      userId: userBob.id,
      status: "online",
      lastActiveAt: null,
    });

    socketBob.emitClientEvent("disconnect");
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});