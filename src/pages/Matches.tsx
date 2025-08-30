import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { Match } from '@/types';

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
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

    const loadMatches = async () => {
      try {
        console.log('Loading matches for user:', user.id);

        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

        if (error) {
          console.error('Error loading matches:', error);
        } else {
          console.log('Matches found raw:', data);
          // Map database fields to TypeScript interface
          const mappedMatches = await Promise.all(
            (data || []).map(async (match) => {
              // Determine which user is the "other" user (not the current user)
              const isUserA = match.user_a === user.id;
              const otherUserId = isUserA ? match.user_b : match.user_a;
              
              // Fetch the other user's name
              const otherUserName = await fetchUserName(otherUserId);
              
              return {
                id: match.id,
                userId1: match.user_a,
                userId2: match.user_b,
                createdAt: match.created_at,
                user1: { id: match.user_a, name: isUserA ? 'You' : otherUserName },
                user2: { id: match.user_b, name: isUserA ? otherUserName : 'You' },
                otherUser: { id: otherUserId, name: otherUserName }
              };
            })
          );
          console.log('Mapped matches:', mappedMatches);
          setMatches(mappedMatches);
        }
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <TopNav title="Matches" />
        <div className="p-4 text-center">Loading matches...</div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopNav title="Matches" />
      
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Your Matches ({matches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💕</div>
                <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground">
                  When you and someone else like each other, you'll see them here!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {match.otherUser?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">💕</span>
                          <h3 className="font-semibold text-lg">You matched with {match.otherUser?.name || 'Someone'}!</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Matched on {new Date(match.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Start Conversation
                      </button>
                    </div>
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

export default Matches;