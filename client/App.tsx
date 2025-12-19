import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Generator from "./pages/Generator";
import SceneToPrompt from "./pages/SceneToPrompt";
import SceneTextToPrompt from "./pages/SceneTextToPrompt";
import BrollToPrompt from "./pages/BrollToPrompt";
import BrollToPrompt2 from "./pages/BrollToPrompt2";
import BrollToPrompt3 from "./pages/BrollToPrompt3";
import FakeAvatarGenerator from "./pages/FakeAvatarGenerator";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import History from "./pages/History";
import FaceAnalyzer from "./pages/FaceAnalyzer";
import OutfitAnalyzer from "./pages/OutfitAnalyzer";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Kling from "./pages/Kling";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/generate" element={<Generator />} />
              <Route path="/scene-to-prompt" element={<SceneToPrompt />} />
              <Route path="/scene-text-to-prompt" element={<SceneTextToPrompt />} />
              <Route path="/broll-to-prompt" element={<BrollToPrompt />} />
              <Route path="/broll-to-prompt-2" element={<BrollToPrompt2 />} />
              <Route path="/broll-to-prompt-3" element={<BrollToPrompt3 />} />
              <Route path="/fake-avatar-generator" element={<FakeAvatarGenerator />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/support" element={<Support />} />
              <Route path="/history" element={<History />} />
              <Route path="/face-analyzer" element={<FaceAnalyzer />} />
              <Route path="/outfit-analyzer" element={<OutfitAnalyzer />} />
              <Route path="/kling" element={<Kling />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const container = document.getElementById("root")!;
const w = window as any;
if (!w.__root) {
  w.__root = createRoot(container);
}
w.__root.render(<App />);
