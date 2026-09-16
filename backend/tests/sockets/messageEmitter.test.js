import { jest } from '@jest/globals';
import { messageEmitter } from '../../src/sockets/emitters/messageEmitter.js';
import { chatService } from '../../src/services/chatService.js';
import { mockIO } from '../setup.js'; // Adjust relative path to your setup.js

describe('messageEmitter.newMessage', () => {
  beforeEach(() => {
    jest.spyOn(chatService, 'markChatAsReadForUsers').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('broadcasts the message to the chat room immediately', async () => {
    mockIO.fetchSockets.mockResolvedValue([]);

    messageEmitter.newMessage('chat-1', { id: 'msg-1', senderId: 'user-1' });

    expect(mockIO.to).toHaveBeenCalledWith('chat:chat-1');
    expect(mockIO.emit).toHaveBeenCalledWith('chat_message', {
      id: 'msg-1',
      senderId: 'user-1',
    });
  });
});