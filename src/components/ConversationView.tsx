import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';
import { ArrowLeft, Send } from 'lucide-react';
import { getMessages, sendMessage, markMessagesAsRead, subscribeToMessages, type Message } from '@/services/messages';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ConversationView = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ id: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const loadConversationData = async () => {
      try {
        console.log('🔍 Loading conversation data for:', conversationId);
        
        // First, get the match/conversation info to determine the other user
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('user_a, user_b')
          .eq('id', conversationId)
          .single();

        console.log('🤝 Match data:', { matchData, matchError });

        if (matchError) {
          console.error('❌ Error loading match:', matchError);
          toast({
            title: 'Error',
            description: 'Failed to load conversation',
            variant: 'destructive',
          });
          return;
        }

        // Determine other user from match data
        const otherUserId = matchData.user_a === user.id ? matchData.user_b : matchData.user_a;
        console.log('👤 Other user ID:', otherUserId);
        
        // Fetch other user's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', otherUserId)
          .single();

        console.log('👤 Other user profile:', profile);

        setOtherUser({
          id: otherUserId,
          name: profile?.display_name || 'Unknown User'
        });

        // Now load messages
        const result = await getMessages(conversationId);
        if (result.error) {
          console.error('Error loading messages:', result.error);
          toast({
            title: 'Error',
            description: 'Failed to load messages',
            variant: 'destructive',
          });
        } else {
          setMessages(result.messages || []);
          
          // Mark messages as read
          await markMessagesAsRead(conversationId);
        }
      } catch (error) {
        console.error('💥 Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversationData();

    // Subscribe to new messages
    const subscription = subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      if (newMessage.senderId !== user.id) {
        markMessagesAsRead(conversationId);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [conversationId, user, toast]);

  const handleSendMessage = async () => {
    console.log('🔥 Send button clicked!', { 
      newMessage: newMessage.trim(), 
      conversationId, 
      otherUser, 
      sending 
    });
    
    if (!newMessage.trim() || !conversationId || !otherUser || sending) {
      console.log('❌ Send message blocked:', {
        hasMessage: !!newMessage.trim(),
        hasConversationId: !!conversationId,
        hasOtherUser: !!otherUser,
        notSending: !sending
      });
      return;
    }

    setSending(true);
    try {
      console.log('📤 Sending message:', {
        conversationId,
        recipientId: otherUser.id,
        content: newMessage.trim()
      });
      
      const result = await sendMessage(conversationId, otherUser.id, newMessage.trim());
      
      console.log('📤 Send result:', result);
      
      if (result.error) {
        console.error('❌ Send message error:', result.error);
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.message) {
        console.log('✅ Message sent successfully:', result.message);
        setMessages(prev => [...prev, result.message!]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('💥 Unexpected error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav 
          title="Loading..." 
          leftButton={
            <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
        <div className="p-4 text-center">Loading conversation...</div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav 
        title={otherUser?.name || 'Conversation'}
        leftButton={
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold mb-2">Start the conversation!</h3>
            <p className="text-muted-foreground">
              Send your first message to {otherUser?.name || 'your match'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              console.log('💬 Message styling:', {
                messageId: message.id,
                senderId: message.senderId,
                currentUserId: user?.id,
                isOwn,
                content: message.content
              });
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn 
                        ? 'text-blue-100' 
                        : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default ConversationView;
