import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { chatService } from '../../src/services';
import { useAuth } from '../../src/contexts/AuthContext';

interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesTab() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
      }
    } catch {
      // Keep empty
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'pharmacy_admin':
        return 'Pharmacy';
      case 'delivery_admin':
        return 'Delivery';
      case 'customer':
        return 'Customer';
      default:
        return role;
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/chat', params: { conversationId: item.id } })}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.participantName?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.name} numberOfLines={1}>
            {item.participantName}
          </Text>
          <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.roleTag}>{getRoleLabel(item.participantRole)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No conversations</Text>
              <Text style={styles.emptySubtext}>
                Messages will appear here when you start chatting with pharmacies or delivery providers
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  time: { fontSize: 12, color: '#9CA3AF' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  preview: { fontSize: 14, color: '#6B7280', flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: '#059669',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  roleTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
