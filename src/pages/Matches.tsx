import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';
import { MessageCircle } from 'lucide-react';

const Matches = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <TopNav title="Matches" />
      
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Your Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💕</div>
              <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground">
                When you and someone else like each other, you'll see them here!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Matches;