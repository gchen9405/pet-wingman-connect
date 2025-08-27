import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';

const Likes = () => {
  const [activeTab, setActiveTab] = useState('received');

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
                <CardTitle>People who liked you</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  No likes yet. Keep swiping to find matches!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your likes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  You haven't liked anyone yet. Start discovering profiles!
                </p>
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