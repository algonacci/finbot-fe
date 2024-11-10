import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LandingPage() {
  const [ticker, setTicker] = useState('');

  const handleAnalyze = () => {
    // Logika untuk menganalisis ticker
    console.log(`Analyzing ${ticker}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Input
        placeholder="Enter stock ticker"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        className="mb-4"
      />
      <Button onClick={handleAnalyze} variant="default">
        Analyze
      </Button>
    </div>
  );
}

export default LandingPage;
