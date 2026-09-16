import { mockIO } from "../setup.js";

export async function resetMockIO() {
  mockIO.to.mockClear();
  mockIO.emit.mockClear();
  mockIO.in.mockClear();
  mockIO.fetchSockets.mockClear();
  mockIO.fetchSockets.mockResolvedValue([]);
};