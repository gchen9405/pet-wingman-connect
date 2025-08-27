import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
}

export const TopNav = ({ title, showBack = false, showSettings = false, onBack }: TopNavProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </div>

        {showSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
};