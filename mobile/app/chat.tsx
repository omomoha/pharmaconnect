import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { chatService } from '../src/services';
import { apiClient } from '../src/lib/api';

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: any;
  isRead?: boolean;
}

interface Conversation {
  id: string;
  participants: Array<{ userId: string; name: string; role: string }>;
  lastMessage?: string;
}

export default function ChatScreen() {
  const { conversationId, pharmacyId, pharmacyName, riderId, riderName } =
    useLocalSearchParams<{
      conversationId?: string;
      pharmacyId?: string;
      pharmacyName?: string;
      riderId?: string;
      riderName?: string;
    }>();

  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeConvoId, setActiveConvoId] = useState(conversationId || '');
  const flatListRef = useRef<FlatList>(null);

  const recipientName = pharmacyName || riderName || 'Chat';

  useEffect(() => {
    initChat();
  }, []);

  const initChat = async () => {
    setLoading(true);
    try {
      let convoId = conversationId;

      // If we don't have a conversation ID, try to find or create one
      if (!convoId && (pharmacyId || riderId)) {
        const participantId = pharmacyId || riderId || '';
        const participantRole = pharmacyId ? 'pharmacy' : 'delivery_provider';

        // Try to find existing conversation
        const convosRes = await chatService.getConversations();
        if (convosRes.success && convosRes.data) {
          const existing = (convosRes.data as Conversation[]).find((c) =>
            c.participants.some((p) => p.userId === participantId)
          );
          if (existing) {
            convoId = existing.id;
          }
        }

        // Create new conversation if not found
        if (!convoId) {
          const createRes = await chatService.startConversation({
            participantId,
            participantRole,
          });
          if (createRes.success && createRes.data) {
            convoId = (createRes.data as Conversation).id;
          }
        }
      }

      if (convoId) {
        setActiveConvoId(convoId);
        await loadMessages(convoId);
      }
    } catch (error) {
      console.warn('Chat init failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convoId: string) => {
    try {
      const res = await chatService.getConversation(convoId);
      if (res.success && res.data) {
        const convo = res.data as any;
        setMessages(convo.messages || []);
      }
    } catch (error) {
      console.warn('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvoId) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.uid || '',
      senderName: 'You',
      content: text,
      createdAt: { _seconds: Date.now() / 1000 },
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await apiClient.post(
        `/chat/conversations/${activeConvoId}/messages`,
        { content: text }
      );
      if (res.success) {
        // Replace temp message with real one
        await loadMessages(activeConvoId);
      }
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateSeparator = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.uid;
    const prevMsg = index > 0 ? messages[index - 1] : null;

    // Date separator
    const showDate =
      !prevMsg ||
      formatDateSeparator(item.createdAt) !== formatDateSeparator(prevMsg.createdAt);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDateSeparator(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageBubbleRow, isMe && styles.messageBubbleRowMe]}>
          <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            {!isMe && item.senderName && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.content}
            </Text>
            <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
              {formatTime(item.createdAt)}
              {isMe && item.isRead && ' ✓✓'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarText}>
            {recipientName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.recipientName}>{recipientName}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>💬</Text>
            <Text style={styles.emptyChatText}>
              Start a conversation with {recipientName}
            </Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!newMessage.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  recipientName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  messagesList: { padding: 16, flexGrow: 1 },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateText: { fontSize: 12, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  messageBubbleRow: { flexDirection: 'row', marginBottom: 8, justifyContent: 'flex-start' },
  messageBubbleRowMe: { justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleOther: { backgroundColor: '#fff', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleMe: { backgroundColor: '#059669', borderTopRightRadius: 4 },
  senderName: { fontSize: 12, fontWeight: '600', color: '#059669', marginBottom: 2 },
  messageText: { fontSize: 15, color: '#111827', lineHeight: 20 },
  messageTextMe: { color: '#fff' },
  timeText: { fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  timeTextMe: { color: '#D1FAE5' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
