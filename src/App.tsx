import Navbar from "@/components/pages/navbar";
import Footer from "@/components/pages/footer";
import Tickers from "@/components/pages/tickers";

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <Tickers />
      <Footer />
    </div>
  );
}

export default LandingPage;
