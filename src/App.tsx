import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSession } from "@/services/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Likes from "./pages/Likes";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ConversationView from "./components/ConversationView";

const queryClient = new QueryClient();

// Auth wrapper component to initialize session management
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  // This hook call initializes the auth state listener
  useSession();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthWrapper>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<ConversationView />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
