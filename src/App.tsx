import { Routes, Route } from 'react-router-dom';
import Navbar from "@/components/pages/navbar";
import Footer from "@/components/pages/footer";
import Tickers from "@/components/pages/tickers";
import ChatPage from "@/components/pages/chat";

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <Tickers />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Halaman utama */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Halaman chat */}
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;
