import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h2>
        <p className="text-gray-600 mb-6">
          Your payment could not be processed. This could be due to:
        </p>
        <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
          <li>• Insufficient balance in your eSewa account</li>
          <li>• Payment was cancelled</li>
          <li>• Network or technical issues</li>
        </ul>
        <button
          onClick={() => navigate('/payment')}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Try Again
        </button>
      </div>
    </div>
  );
}

