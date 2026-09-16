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

    await messageEmitter.newMessage('chat-1', { id: 'msg-1', senderId: 'user-1' });

    expect(mockIO.to).toHaveBeenCalledWith('chat:chat-1');
    expect(mockIO.emit).toHaveBeenCalledWith('chat_message', {
      id: 'msg-1',
      senderId: 'user-1',
    });
  });

  it('marks messages as read and emits chat_read_bulk for active recipients in the room', async () => {
    mockIO.fetchSockets.mockResolvedValue([
      { user: { id: 'user-1' } },
      { user: { id: 'user-2' } },
      { user: { id: 'user-3' } },
    ]);

    const createdAt = new Date('2026-09-16T10:00:00Z');
    await messageEmitter.newMessage('chat-1', {
      id: 'msg-1',
      senderId: 'user-1',
      createdAt,
    });

    expect(mockIO.in).toHaveBeenCalledWith('chat:chat-1');
    expect(chatService.markChatAsReadForUsers).toHaveBeenCalledWith(
      'chat-1',
      ['user-2', 'user-3'],
      createdAt
    );

    expect(mockIO.to).toHaveBeenCalledWith('chat:chat-1');
    expect(mockIO.emit).toHaveBeenCalledWith('chat_read_bulk', {
      chatId: 'chat-1',
      userIds: ['user-2', 'user-3'],
      lastReadAt: createdAt.toISOString(),
    });
  });

  it('does nothing if no active sockets or only the sender is in the room', async () => {
    mockIO.fetchSockets.mockResolvedValue([
      { user: { id: 'user-1' } },
    ]);

    await messageEmitter.newMessage('chat-1', { id: 'msg-1', senderId: 'user-1' });

    expect(chatService.markChatAsReadForUsers).not.toHaveBeenCalled();
    expect(mockIO.emit).not.toHaveBeenCalledWith('chat_read_bulk', expect.anything());
  });
});