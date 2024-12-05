import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Tickers() {

    const [ticker, setTicker] = useState('');
    const navigate = useNavigate();

  const handleAnalyze = () => {
    // Logic for analyzing the ticker
    console.log(`Analyzing ${ticker}`);
    navigate(`/ticker?q=${ticker}`);
  };

    return (
        <div className="flex flex-col items-center justify-center flex-1 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 text-center">Welcome to Finbot</h2>
        <p className="text-base sm:text-lg text-gray-600 mb-8 text-center max-w-lg">
          Get real-time insights and analysis on your favorite stocks. Simply enter the ticker symbol below.
        </p>
        <div className="w-full max-w-sm sm:max-w-md">
          <Input
            placeholder="Enter stock ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
          />
          <Button
            onClick={handleAnalyze}
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-4"
          >
            Analyze
          </Button>
        </div>
      </div>
    )
}

export default Tickers;