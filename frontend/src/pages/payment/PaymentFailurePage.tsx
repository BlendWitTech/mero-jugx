import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  
  // Get the return path from localStorage (set before payment initiation) or default to packages page
  const getReturnPath = () => {
    const stored = localStorage.getItem('payment_return_path');
    if (stored) {
      localStorage.removeItem('payment_return_path'); // Clean up
      return stored;
    }
    return '/packages'; // Default to packages page where payments are initiated
  };

  const handleGoBack = () => {
    navigate(getReturnPath());
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-[#2f3136] rounded-lg shadow-xl border border-[#202225] p-8 text-center">
        <XCircle className="h-16 w-16 text-[#ed4245] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Payment Failed
        </h2>
        <p className="text-[#b9bbbe] mb-6">
          Your payment could not be processed. This could be due to:
        </p>
        <ul className="text-left text-sm text-[#b9bbbe] mb-6 space-y-2">
          <li>• Insufficient balance in your eSewa account</li>
          <li>• Payment was cancelled</li>
          <li>• Network or technical issues</li>
        </ul>
        <button
          onClick={handleGoBack}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5865f2] hover:bg-[#4752c4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5865f2]"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Go Back
        </button>
      </div>
    </div>
  );
}

