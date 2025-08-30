import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { Like } from '@/types';

const Likes = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedLikes, setReceivedLikes] = useState<Like[]>([]);
  const [sentLikes, setSentLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Helper function to fetch user names
  const fetchUserName = async (userId: string): Promise<string> => {
    try {
      console.log('Fetching user name for:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      
      console.log('Profile fetch result:', { profile, error });
      return profile?.display_name || 'Unknown User';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Unknown User';
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadLikes = async () => {
      try {
        console.log('Loading likes for user:', user.id);

        // Load received likes (simplified query first)
        const { data: received, error: receivedError } = await supabase
          .from('likes')
          .select('*')
          .eq('to_user_id', user.id);

        if (receivedError) {
          console.error('Error loading received likes:', receivedError);
        } else {
          console.log('Received likes raw:', received);
          // Map database fields and fetch user names
          const mappedReceived = await Promise.all(
            (received || []).map(async (like) => {
              const fromUserName = await fetchUserName(like.from_user_id);
              return {
                id: like.id,
                fromUserId: like.from_user_id,
                toUserId: like.to_user_id,
                targetType: like.target_type as 'prompt' | 'profile',
                targetId: like.target_id,
                message: like.message,
                createdAt: like.created_at,
                fromUser: { id: like.from_user_id, name: fromUserName },
                toUser: { id: like.to_user_id, name: 'You' },
                prompt: null // We'll add this later
              };
            })
          );
          console.log('Mapped received likes:', mappedReceived);
          setReceivedLikes(mappedReceived);
        }

        // Load sent likes (simplified query first)
        const { data: sent, error: sentError } = await supabase
          .from('likes')
          .select('*')
          .eq('from_user_id', user.id);

        if (sentError) {
          console.error('Error loading sent likes:', sentError);
        } else {
          console.log('Sent likes raw:', sent);
          // Map database fields and fetch user names
          const mappedSent = await Promise.all(
            (sent || []).map(async (like) => {
              const toUserName = await fetchUserName(like.to_user_id);
              return {
                id: like.id,
                fromUserId: like.from_user_id,
                toUserId: like.to_user_id,
                targetType: like.target_type as 'prompt' | 'profile',
                targetId: like.target_id,
                message: like.message,
                createdAt: like.created_at,
                fromUser: { id: like.from_user_id, name: 'You' },
                toUser: { id: like.to_user_id, name: toUserName },
                prompt: null // We'll add this later
              };
            })
          );
          console.log('Mapped sent likes:', mappedSent);
          setSentLikes(mappedSent);
        }
      } catch (error) {
        console.error('Error loading likes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLikes();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <TopNav title="Likes" />
        <div className="p-4 text-center">Loading likes...</div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopNav title="Likes" />
      
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>People who liked you ({receivedLikes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {receivedLikes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No likes yet. Keep swiping to find matches!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {receivedLikes.map((like) => (
                      <div key={like.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {like.fromUser?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{like.fromUser?.name || 'Someone'} liked your {like.targetType}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(like.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {like.targetType === 'prompt' && like.prompt && (
                          <div className="bg-muted p-3 rounded-md mb-2">
                            <p className="text-sm"><strong>Prompt:</strong> "{like.prompt.text}"</p>
                          </div>
                        )}
                        
                        {like.message && (
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-sm"><strong>Their message:</strong> "{like.message}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your likes ({sentLikes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sentLikes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    You haven't liked anyone yet. Start discovering profiles!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sentLikes.map((like) => (
                      <div key={like.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {like.toUser?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium">You liked {like.toUser?.name || 'Someone'}'s {like.targetType}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(like.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {like.targetType === 'prompt' && like.prompt && (
                          <div className="bg-muted p-3 rounded-md mb-2">
                            <p className="text-sm"><strong>Prompt:</strong> "{like.prompt.text}"</p>
                          </div>
                        )}
                        
                        {like.message && (
                          <div className="bg-green-50 p-3 rounded-md">
                            <p className="text-sm"><strong>Your message:</strong> "{like.message}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Likes;