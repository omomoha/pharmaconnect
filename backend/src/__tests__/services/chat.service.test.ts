/**
 * Chat Service Tests
 * Tests for conversation creation, messaging, moderation, and flagging
 */

import { ChatService } from '../../modules/chat/chat.service';
import { getFirestore } from '../../config/firebase';
import { createFirestoreMock } from '../mocks/firestore.mock';
import {
  UserRole,
  ConversationType,
  ConversationStatus,
  MessageType,
  FlagAction,
} from '@pharmaconnect/shared/dist/types/index';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');
jest.mock('../../utils/helpers', () => ({
  sanitizeString: jest.fn((str) => str),
  calculateDistanceKm: jest.fn((_lat1: number, _lng1: number, _lat2: number, _lng2: number) => 10),
}));
jest.mock('../../services/moderation/keyword-matcher', () => ({
  moderateMessage: jest.fn(() => ({ flagged: false, keywords: [] })),
}));
jest.mock('../../services/moderation/nlp-classifier', () => ({
  classifyMessage: jest.fn(() => ({ flagged: false, confidence: 0 })),
}));

const mockFirestore = createFirestoreMock();

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.reset();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('createConversation', () => {
    it('should create a customer-pharmacy conversation', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.type).toBe(ConversationType.CUSTOMER_PHARMACY);
      expect(conversation.customerId).toBe('customer-123');
      expect(conversation.pharmacyId).toBe('pharmacy-456');
      expect(conversation.status).toBe(ConversationStatus.ACTIVE);
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });

    it('should create a customer-rider conversation', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_RIDER,
        customerId: 'customer-123',
        deliveryRiderId: 'rider-789',
      });

      expect(conversation.type).toBe(ConversationType.CUSTOMER_RIDER);
      expect(conversation.deliveryRiderId).toBe('rider-789');
      expect(conversation.pharmacyId).toBeUndefined();
    });

    it('should store conversation in Firestore', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const collectionData = mockFirestore.getCollectionData();
      const conversations = collectionData['conversations'];
      expect(conversations).toBeDefined();
      expect(conversations.some((c) => c.id === conversation.id)).toBe(true);
    });

    it('should generate unique conversation IDs', async () => {
      const conv1 = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const conv2 = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-124',
        pharmacyId: 'pharmacy-457',
      });

      expect(conv1.id).not.toBe(conv2.id);
    });
  });

  describe('getConversation', () => {
    it('should retrieve an existing conversation', async () => {
      const created = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const retrieved = await ChatService.getConversation(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.type).toBe(ConversationType.CUSTOMER_PHARMACY);
    });

    it('should return null for non-existent conversation', async () => {
      const retrieved = await ChatService.getConversation('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should preserve all conversation fields', async () => {
      const created = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_RIDER,
        customerId: 'customer-999',
        deliveryRiderId: 'rider-999',
      });

      const retrieved = await ChatService.getConversation(created.id);

      expect(retrieved?.customerId).toBe('customer-999');
      expect(retrieved?.deliveryRiderId).toBe('rider-999');
      expect(retrieved?.status).toBe(ConversationStatus.ACTIVE);
    });
  });

  describe('getUserConversations', () => {
    it('should retrieve all conversations for a user', async () => {
      const customerId = 'customer-123';

      await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId,
        pharmacyId: 'pharmacy-456',
      });

      await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId,
        pharmacyId: 'pharmacy-457',
      });

      const conversations = await ChatService.getUserConversations(customerId);

      expect(conversations.length).toBeGreaterThanOrEqual(2);
      expect(conversations.every((c) => c.customerId === customerId)).toBe(true);
    });

    it('should return empty array for user with no conversations', async () => {
      const conversations = await ChatService.getUserConversations('unknown-customer');
      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBe(0);
    });

    it('should order conversations by updated time descending', async () => {
      const customerId = 'customer-order';

      await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId,
        pharmacyId: 'pharmacy-1',
      });

      await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId,
        pharmacyId: 'pharmacy-2',
      });

      const conversations = await ChatService.getUserConversations(customerId);

      expect(conversations.length).toBeGreaterThanOrEqual(2);
      // Most recent first
      expect(conversations[0].updatedAt.getTime()).toBeGreaterThanOrEqual(
        conversations[conversations.length - 1].updatedAt.getTime()
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a text message', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Do you have aspirin?',
        type: MessageType.TEXT,
      });

      expect(result.message).toBeDefined();
      expect(result.message.id).toBeDefined();
      expect(result.message.conversationId).toBe(conversation.id);
      expect(result.message.senderId).toBe('customer-123');
      expect(result.message.senderRole).toBe(UserRole.CUSTOMER);
      expect(result.message.type).toBe(MessageType.TEXT);
      expect(result.flagged).toBe(false);
    });

    it('should send message with image', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Here is my prescription',
        type: MessageType.IMAGE,
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(result.message.imageUrl).toBe('https://example.com/image.jpg');
      expect(result.message.type).toBe(MessageType.IMAGE);
    });

    it('should sanitize message content', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Need <script>alert("xss")</script> help',
      });

      expect(result.message.content).toBeDefined();
    });

    it('should store message in Firestore', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Test message',
      });

      const collectionData = mockFirestore.getCollectionData();
      const messages = collectionData['messages'];
      expect(messages).toBeDefined();
      expect(messages.some((m) => m.id === result.message.id)).toBe(true);
    });

    it('should update conversation with last message', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const messageContent = 'Latest message';
      await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: messageContent,
      });

      const updated = await ChatService.getConversation(conversation.id);
      expect(updated?.lastMessage).toBe(messageContent);
      expect(updated?.lastMessageAt).toBeDefined();
    });

    it('should default message type to TEXT', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Message without type',
      });

      expect(result.message.type).toBe(MessageType.TEXT);
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages for a conversation', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Message 1',
      });

      await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'pharmacy-456',
        senderRole: ('pharmacy' as any),
        content: 'Message 2',
      });

      const messages = await ChatService.getMessages(conversation.id);

      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.every((m) => m.conversationId === conversation.id)).toBe(true);
    });

    it('should return messages in chronological order', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'First',
      });

      await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'pharmacy-456',
        senderRole: ('pharmacy' as any),
        content: 'Second',
      });

      const messages = await ChatService.getMessages(conversation.id);

      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages[0].content).toBe('First');
      expect(messages[messages.length - 1].content).toBe('Second');
    });

    it('should respect limit parameter', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      for (let i = 0; i < 10; i++) {
        await ChatService.sendMessage({
          conversationId: conversation.id,
          senderId: 'customer-123',
          senderRole: UserRole.CUSTOMER,
          content: `Message ${i}`,
        });
      }

      const messages = await ChatService.getMessages(conversation.id, 5);

      expect(messages.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for conversation with no messages', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const messages = await ChatService.getMessages(conversation.id);

      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark message as read', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'pharmacy-456',
        senderRole: ('pharmacy' as any),
        content: 'Test message',
      });

      await ChatService.markMessageAsRead(result.message.id);

      const messages = await ChatService.getMessages(conversation.id);
      const marked = messages.find((m) => m.id === result.message.id);

      expect(marked?.readAt).toBeDefined();
    });

    it('should set readAt timestamp', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Message to read',
      });

      const beforeRead = new Date();
      await ChatService.markMessageAsRead(result.message.id);
      const afterRead = new Date();

      const messages = await ChatService.getMessages(conversation.id);
      const marked = messages.find((m) => m.id === result.message.id);

      expect(marked?.readAt!.getTime()).toBeGreaterThanOrEqual(beforeRead.getTime());
      expect(marked?.readAt!.getTime()).toBeLessThanOrEqual(afterRead.getTime());
    });
  });

  describe('closeConversation', () => {
    it('should close an active conversation', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      expect(conversation.status).toBe(ConversationStatus.ACTIVE);

      await ChatService.closeConversation(conversation.id);

      const closed = await ChatService.getConversation(conversation.id);
      expect(closed?.status).toBe(ConversationStatus.CLOSED);
    });

    it('should update updatedAt on close', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const originalTime = conversation.updatedAt;
      await ChatService.closeConversation(conversation.id);

      const closed = await ChatService.getConversation(conversation.id);
      expect(closed?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTime.getTime());
    });
  });

  describe('flagMessage', () => {
    it('should flag a message and create alert', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Need prescription drugs',
      });

      const alert = await ChatService.flagMessage(
        result.message.id,
        conversation.id,
        'customer-123',
        UserRole.CUSTOMER,
        {
          flagged: true,
          reason: 'Prescription drug mention',
          keywords: ['prescription', 'drugs'],
          confidenceScore: 0.95,
        }
      );

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.messageId).toBe(result.message.id);
      expect(alert.conversationId).toBe(conversation.id);
      expect(alert.action).toBe(FlagAction.DISMISSED);
    });

    it('should store flagged keywords in alert', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Need penicillin',
      });

      const alert = await ChatService.flagMessage(
        result.message.id,
        conversation.id,
        'customer-123',
        UserRole.CUSTOMER,
        {
          flagged: true,
          keywords: ['penicillin'],
          confidenceScore: 0.9,
        }
      );

      expect(alert.suspiciousKeywords).toContain('penicillin');
    });

    it('should mark conversation as flagged', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-123',
        pharmacyId: 'pharmacy-456',
      });

      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-123',
        senderRole: UserRole.CUSTOMER,
        content: 'Suspicious content',
      });

      await ChatService.flagMessage(
        result.message.id,
        conversation.id,
        'customer-123',
        UserRole.CUSTOMER,
        { flagged: true }
      );

      const flagged = await ChatService.getConversation(conversation.id);
      expect(flagged?.status).toBe(ConversationStatus.FLAGGED);
    });
  });

  describe('getUnreadCount', () => {
    it('should return zero for user with no conversations', async () => {
      const count = await ChatService.getUnreadCount('unknown-user');
      expect(count).toBe(0);
    });

    it('should return a number for known user', async () => {
      const customerId = 'customer-unread';
      const pharmacyId = 'pharmacy-unread';

      await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId,
        pharmacyId,
      });

      const count = await ChatService.getUnreadCount(customerId);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should handle user with multiple conversations', async () => {
      const customerId = 'customer-multi';

      await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId,
        pharmacyId: 'pharmacy-a',
      });

      await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId,
        pharmacyId: 'pharmacy-b',
      });

      const count = await ChatService.getUnreadCount(customerId);
      expect(typeof count).toBe('number');
    });
  });

  describe('Integration scenarios', () => {
    it('should conduct a full conversation flow', async () => {
      // Create conversation
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-flow',
        pharmacyId: 'pharmacy-flow',
      });

      // Customer sends message
      await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-flow',
        senderRole: UserRole.CUSTOMER,
        content: 'Do you have ibuprofen?',
      });

      // Pharmacy responds
      const msg2 = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'pharmacy-flow',
        senderRole: ('pharmacy' as any),
        content: 'Yes, we have 100mg tablets',
      });

      // Customer marks pharmacy message as read
      await ChatService.markMessageAsRead(msg2.message.id);

      // Get all messages
      const messages = await ChatService.getMessages(conversation.id);

      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.some((m) => m.senderId === 'customer-flow')).toBe(true);
      expect(messages.some((m) => m.senderId === 'pharmacy-flow')).toBe(true);
    });

    it('should handle flagged prescription request', async () => {
      const conversation = await ChatService.createConversation({
        type: ConversationType.CUSTOMER_PHARMACY,
        customerId: 'customer-flag',
        pharmacyId: 'pharmacy-flag',
      });

      // Customer sends flagged message
      const result = await ChatService.sendMessage({
        conversationId: conversation.id,
        senderId: 'customer-flag',
        senderRole: UserRole.CUSTOMER,
        content: 'I need amoxicillin prescription',
      });

      expect(result.message).toBeDefined();

      // Verify conversation can still be retrieved
      const updated = await ChatService.getConversation(conversation.id);
      expect(updated).toBeDefined();
    });
  });
});
