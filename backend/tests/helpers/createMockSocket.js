import { jest } from "@jest/globals";

export const createMockSocket = (userOrId) => {
  const events = {};

  return {
    id: `socket_${crypto.randomUUID()}`,
    user: typeof userOrId === "string" ? { id: userOrId } : userOrId,
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn((event, handler) => {
      events[event] = handler;
    }),
    emitClientEvent: async (event, ...args) => {
      if (events[event]) {
        await events[event](...args);
      }
    },
  };
};