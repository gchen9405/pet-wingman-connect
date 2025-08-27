import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, User, Compass, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/feed', icon: Compass, label: 'Discover' },
  { path: '/likes', icon: ThumbsUp, label: 'Likes' },
  { path: '/matches', icon: Heart, label: 'Matches' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};