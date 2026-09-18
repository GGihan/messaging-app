import { describe, jest } from '@jest/globals';
import { messageEmitter } from '../../src/sockets/emitters/messageEmitter.js';
import { mockIO } from '../setup.js';
import { chatService } from '../../src/services/chatService.js';

describe('messageEmitter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('messageEmitter.newMessage', () => {
    it('fetches receiver member IDs and broadcasts chat_message to their personal user rooms', async () => {
      jest
        .spyOn(chatService, 'getReceiverMemberIds')
        .mockResolvedValue(['user-2', 'user-3']);

      const message = { id: 'msg-1', text: 'Hello world' };

      await messageEmitter.newMessage('chat-1', 'user-1', message);

      expect(chatService.getReceiverMemberIds).toHaveBeenCalledWith('chat-1', 'user-1');
      expect(mockIO.to).toHaveBeenCalledWith(['user:user-2', 'user:user-3']);
      expect(mockIO.emit).toHaveBeenCalledWith('chat_message', message);
    });

    it('does not emit if there are no active receivers in the chat', async () => {
      jest
        .spyOn(chatService, 'getReceiverMemberIds')
        .mockResolvedValue([]);

      const message = { id: 'msg-1', text: 'Hello world' };

      await messageEmitter.newMessage('chat-1', 'user-1', message );

      expect(chatService.getReceiverMemberIds).toHaveBeenCalledWith('chat-1', 'user-1');
      expect(mockIO.to).not.toHaveBeenCalled();
      expect(mockIO.emit).not.toHaveBeenCalled();
    });
  });
});