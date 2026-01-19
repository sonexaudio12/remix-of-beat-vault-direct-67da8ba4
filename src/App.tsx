import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import { AudioPlayerProvider } from "@/hooks/useAudioPlayer";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Beats from "./pages/Beats";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Download from "./pages/Download";
import OrderConfirmation from "./pages/OrderConfirmation";
import Licenses from "./pages/Licenses";
import SoundKits from "./pages/SoundKits";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import About from "@/pages/About";
import Terms from "./pages/Terms of service";
import Privacy from "./pages/Privacy policy";
import Refund from "./pages/Refund policy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <AudioPlayerProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/beats" element={<Beats />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/download" element={<Download />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/licenses" element={<Licenses />} />
                <Route path="/sound-kits" element={<SoundKits />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Login />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/refunds" element={<Refund />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AudioPlayerProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
