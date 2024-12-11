import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';


interface StockInfo {
    name: string;
    symbol: string;
    current_price: number;
    currency: string;
    market_cap: number;
    sector: string;
    industry: string;
    description: string;
    website: string;
    country: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    full_time_employees: number;
    chart_url: string;
}

function Tickers() {
    const [ticker, setTicker] = useState('');
    const [loading, setLoading] = useState(false);
    const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
    const [chartUrl, setChartUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        setStockInfo(null);
        setChartUrl(null);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/ticker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SECRET_KEY}`
                },
                mode: 'cors',  // Enable CORS mode
                credentials: 'include',  // Include cookies if necessary
                body: JSON.stringify({ ticker }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.status.message || 'An error occurred');
            }

            setStockInfo(data.data.stock_info);
            setChartUrl(data.data.stock_info.chart_url);
        } catch (error: any) {
            console.error('Error fetching ticker data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChatRedirect = () => {
      navigate(`/chat?symbol=${stockInfo?.symbol}`);
    };

    return (
        <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
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
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Analyze'}
                </Button>
            </div>
            
            {error && (
                <Alert variant="destructive" className="mt-4 w-full max-w-sm sm:max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            {stockInfo && chartUrl && (
                <div className="mt-8 p-6 border rounded-lg shadow-lg transition-all duration-500 ease-in-out transform bg-white w-full max-w-2xl">
                    <h3 className="text-xl font-bold mb-4 text-center">{stockInfo.name}</h3>
                    <img src={chartUrl} alt="Stock Chart" className="w-full h-auto mb-12" />
                    <div className="grid grid-cols-2 gap-4">
                        <ul className="list-disc list-inside">
                            <li className="text-sm text-gray-700">Symbol: <span className="font-semibold">{stockInfo.symbol}</span></li>
                            <li className="text-sm text-gray-700">Current Price: <span className="font-semibold">{stockInfo.current_price} {stockInfo.currency}</span></li>
                            <li className="text-sm text-gray-700">Market Cap: <span className="font-semibold">{stockInfo.market_cap}</span></li>
                            <li className="text-sm text-gray-700">Sector: <span className="font-semibold">{stockInfo.sector}</span></li>
                            <li className="text-sm text-gray-700">Industry: <span className="font-semibold">{stockInfo.industry}</span></li>
                        </ul>
                        <ul className="list-disc list-inside">
                            <li className="text-sm text-gray-700">Website: <a href={stockInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{stockInfo.website}</a></li>
                            <li className="text-sm text-gray-700">Country: <span className="font-semibold">{stockInfo.country}</span></li>
                            <li className="text-sm text-gray-700">Phone: <span className="font-semibold">{stockInfo.phone}</span></li>
                            <li className="text-sm text-gray-700">Address: <span className="font-semibold">{stockInfo.address}, {stockInfo.city}, {stockInfo.zip}</span></li>
                            <li className="text-sm text-gray-700">Full Time Employees: <span className="font-semibold">{stockInfo.full_time_employees}</span></li>
                        </ul>
                    </div>
                    <div className="mt-4">
                        <h4 className="text-lg font-bold mb-2">Description</h4>
                        <p className="text-sm text-gray-700">{stockInfo.description}</p>
                    </div>
                    <Button
                        onClick={handleChatRedirect}
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold mt-4"
                    >
                        Is there follow up questions? Chat with me!
                    </Button>
                </div>
            )}
        </div>
    );
}

export default Tickers;