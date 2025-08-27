import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <TopNav title="Profile" />
      
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
                <p className="text-muted-foreground">Complete your profile to start matching</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Pet</h3>
                <p className="text-muted-foreground">Add your pet's profile as your wingman</p>
              </div>

              <Button>Edit Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Profile;