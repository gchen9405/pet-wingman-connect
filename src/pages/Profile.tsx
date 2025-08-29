import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TopNav } from '@/components/TopNav';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useAuthStore } from '@/stores/useAuthStore';
import { getSimpleProfile, updateSimpleProfile, SimpleUser } from '@/services/simpleProfile';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user: authUser, isLoading: authLoading } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<SimpleUser | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    height: '',
    sexuality: '',
    bio: ''
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      // Don't try to load profile if auth is still loading
      if (authLoading) {
        console.log('Auth still loading, waiting...');
        return;
      }
      
      if (!authUser?.id) {
        console.log('No auth user ID after auth loaded');
        setLoading(false);
        return;
      }
      
      console.log('Loading profile for user:', authUser.id);
      setLoading(true);
      
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('Profile loading timeout - forcing stop');
        setLoading(false);
        toast({
          title: 'Timeout',
          description: 'Profile loading took too long. Please try again.',
          variant: 'destructive',
        });
      }, 10000); // 10 second timeout
      
      try {
        console.log('About to call getProfile...');
        
        // Use a short timeout to handle Supabase hanging issue
        console.log('Attempting database load with quick fallback...');
        const profilePromise = getSimpleProfile(authUser.id);
        const quickFallback = new Promise<{ user?: SimpleUser; error?: string }>((resolve) => {
          setTimeout(() => {
            console.log('Quick fallback - Supabase seems to be hanging, using empty profile');
            resolve({ 
              user: null,
              error: 'Supabase query timeout - creating new profile'
            });
          }, 2000); // 2 second quick fallback
        });
        
        const result = await Promise.race([profilePromise, quickFallback]);
        console.log('getProfile returned:', result);
        
        clearTimeout(timeoutId); // Clear timeout since we got a response
        
        const { user, error } = result;
        
        if (error) {
          console.error('Profile error:', error);
          
          // If profile doesn't exist or we hit timeout, show empty form
          if (error.includes('Profile not found') || 
              error.includes('PGRST116') || 
              error.includes('timeout') ||
              error.includes('fallback')) {
            console.log('Profile not found or timeout, creating empty form');
            setProfile(null);
            const newFormData = {
              displayName: authUser.email?.split('@')[0] || '',
              age: '',
              height: '',
              sexuality: '',
              bio: ''
            };
            console.log('Setting form data to:', newFormData);
            setFormData(newFormData);
            
            if (error.includes('timeout') || error.includes('fallback') || error.includes('Supabase')) {
              // Don't show a toast for timeout - just silently use the empty form
              console.log('Using empty profile form due to database issues');
            }
          } else {
            toast({
              title: 'Error',
              description: error,
              variant: 'destructive',
            });
          }
        } else if (user) {
          console.log('Profile loaded successfully:', user);
          setProfile(user);
          setFormData({
            displayName: user.displayName || '',
            age: user.age?.toString() || '',
            height: user.height || '',
            sexuality: user.sexuality || '',
            bio: user.bio || ''
          });
        } else {
          // No profile exists yet - this is normal for new users
          console.log('No profile found, showing empty form');
          setProfile(null);
          setFormData({
            displayName: authUser.email?.split('@')[0] || '',
            age: '',
            height: '',
            sexuality: '',
            bio: ''
          });
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Unexpected error loading profile:', err);
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        });
      }
      
      setLoading(false);
      console.log('Profile loading complete');
    };

    loadProfile();
  }, [authLoading, authUser?.id, authUser?.email, toast]);

  const handleSave = async () => {
    if (!authUser?.id) return;

    setSaving(true);
    const updateData: Partial<SimpleUser> = {
      displayName: formData.displayName,
      age: formData.age ? parseInt(formData.age) : undefined,
      height: formData.height,
      sexuality: formData.sexuality,
      bio: formData.bio
    };

    const { user: updatedUser, error } = await updateSimpleProfile(authUser.id, updateData);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } else {
      setProfile(updatedUser || null);
      setEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        age: profile.age?.toString() || '',
        height: profile.height || '',
        sexuality: profile.sexuality || '',
        bio: profile.bio || ''
      });
    }
    setEditing(false);
  };

  // Show auth loading first
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <TopNav title="Profile" />
        <div className="p-4 flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  // Then show profile loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <TopNav title="Profile" />
        <div className="p-4 flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Loading profile...</p>
            <p className="text-sm text-muted-foreground">If this takes too long, check the browser console</p>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('User clicked skip loading');
                setLoading(false);
                setProfile(null);
                setFormData({
                  displayName: authUser?.email?.split('@')[0] || '',
                  age: '',
                  height: '',
                  sexuality: '',
                  bio: ''
                });
              }}
            >
              Skip Loading
            </Button>
          </div>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  console.log('Rendering profile page:', { profile, editing, formData });

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopNav title="Profile" />
      
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Your age"
                  />
                </div>

                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="e.g., 5 feet 8 inches"
                  />
                </div>

                <div>
                  <Label htmlFor="sexuality">Sexuality</Label>
                  <Input
                    id="sexuality"
                    value={formData.sexuality}
                    onChange={(e) => setFormData({ ...formData, sexuality: e.target.value })}
                    placeholder="e.g., Straight, Gay, Bi, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile ? (
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {profile.displayName || 'Not set'}</p>
                    <p><strong>Age:</strong> {profile.age || 'Not set'}</p>
                    <p><strong>Height:</strong> {profile.height || 'Not set'}</p>
                    <p><strong>Sexuality:</strong> {profile.sexuality || 'Not set'}</p>
                    <p><strong>Bio:</strong> {profile.bio || 'Not set'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No profile information yet. Click "Create Profile" to get started!</p>
                  </div>
                )}

                <Button onClick={() => setEditing(true)}>
                  {profile ? 'Edit Profile' : 'Create Profile'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Pet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">Pet profile management coming soon!</p>
              <Button variant="outline" disabled>
                Add Pet Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Profile;