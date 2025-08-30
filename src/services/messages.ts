import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  conversationId: string;
  userA: string;
  userB: string;
  matchCreatedAt: string;
  lastActivity: string;
  lastMessageContent?: string;
  lastSenderId?: string;
  unreadCount?: number;
  otherUser?: {
    id: string;
    name: string;
  };
}

// Get all conversations for the current user
export const getConversations = async (): Promise<{ conversations?: Conversation[]; error?: string }> => {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
      .order('last_activity', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    // Fetch names for other users
    const conversationsWithNames = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.user_a === currentUser.id ? conv.user_b : conv.user_a;
        
        // Fetch other user's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', otherUserId)
          .single();

        return {
          conversationId: conv.conversation_id,
          userA: conv.user_a,
          userB: conv.user_b,
          matchCreatedAt: conv.match_created_at,
          lastActivity: conv.last_activity,
          lastMessageContent: conv.last_message_content,
          lastSenderId: conv.last_sender_id,
          unreadCount: conv.unread_count || 0,
          otherUser: {
            id: otherUserId,
            name: profile?.display_name || 'Unknown User'
          }
        };
      })
    );

    return { conversations: conversationsWithNames };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to fetch conversations' };
  }
};

// Get messages in a conversation
export const getMessages = async (conversationId: string): Promise<{ messages?: Message[]; error?: string }> => {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return { error: error.message };
    }

    const messages: Message[] = (data || []).map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      recipientId: msg.recipient_id,
      content: msg.content,
      isRead: msg.is_read,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at
    }));

    return { messages };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to fetch messages' };
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  recipientId: string,
  content: string
): Promise<{ message?: Message; error?: string }> => {
  try {
    console.log('🔥 sendMessage called with:', { conversationId, recipientId, content });
    
    const currentUser = useAuthStore.getState().user;
    console.log('👤 Current user:', currentUser);
    
    if (!currentUser) {
      console.log('❌ No current user');
      return { error: 'User not authenticated' };
    }

    if (!content.trim()) {
      console.log('❌ Empty content');
      return { error: 'Message content cannot be empty' };
    }

    const insertData = {
      conversation_id: conversationId,
      sender_id: currentUser.id,
      recipient_id: recipientId,
      content: content.trim()
    };
    
    console.log('📤 Inserting message data:', insertData);

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    console.log('💾 Database response:', { data, error });

    if (error) {
      console.error('❌ Database error:', error);
      return { error: error.message };
    }

    if (!data) {
      console.error('❌ No data returned from insert');
      return { error: 'No data returned from database' };
    }

    const message: Message = {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      recipientId: data.recipient_id,
      content: data.content,
      isRead: data.is_read,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    console.log('✅ Message created successfully:', message);
    return { message };
  } catch (error) {
    console.error('💥 Unexpected error in sendMessage:', error);
    return { error: error instanceof Error ? error.message : 'Failed to send message' };
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string): Promise<{ error?: string }> => {
  try {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      return { error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false);

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to mark messages as read' };
  }
};

// Subscribe to new messages in a conversation
export const subscribeToMessages = (
  conversationId: string,
  onMessage: (message: Message) => void
) => {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) return null;

  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const newMessage: Message = {
          id: payload.new.id,
          conversationId: payload.new.conversation_id,
          senderId: payload.new.sender_id,
          recipientId: payload.new.recipient_id,
          content: payload.new.content,
          isRead: payload.new.is_read,
          createdAt: payload.new.created_at,
          updatedAt: payload.new.updated_at
        };
        onMessage(newMessage);
      }
    )
    .subscribe();

  return subscription;
};
