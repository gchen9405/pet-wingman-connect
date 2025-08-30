import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';
import { MessageCircle, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getConversations, type Conversation } from '@/services/messages';
import { useAuthStore } from '@/stores/useAuthStore';

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        const result = await getConversations();
        if (result.error) {
          console.error('Error loading conversations:', result.error);
        } else {
          setConversations(result.conversations || []);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <TopNav title="Messages" />
        <div className="p-4 text-center">Loading conversations...</div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopNav title="Messages" />
      
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversations ({conversations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  Start a conversation with your matches!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.conversationId}
                    onClick={() => navigate(`/messages/${conversation.conversationId}`)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {conversation.otherUser?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{conversation.otherUser?.name || 'Unknown User'}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatLastActivity(conversation.lastActivity)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessageContent ? (
                          conversation.lastSenderId === user?.id ? (
                            `You: ${conversation.lastMessageContent}`
                          ) : (
                            conversation.lastMessageContent
                          )
                        ) : (
                          'Start a conversation...'
                        )}
                      </p>
                    </div>
                    
                    {/* Unread badge */}
                    {conversation.unreadCount > 0 && (
                      <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Messages;