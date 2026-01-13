import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Mock eSewa payment page for development
 * Simulates the eSewa payment flow when UAT is not accessible
 */
export default function MockEsewaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  const pid = searchParams.get('pid'); // Transaction ID
  const amt = searchParams.get('amt'); // Amount
  const tAmt = searchParams.get('tAmt'); // Total amount
  const scd = searchParams.get('scd'); // Merchant ID
  const su = searchParams.get('su'); // Success URL
  const fu = searchParams.get('fu'); // Failure URL

  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      setProcessing(false);
      // Simulate success (you can change this to test failure)
      const shouldSucceed = true; // Set to false to test failure
      setSuccess(shouldSucceed);

      // Redirect after 2 seconds
      setTimeout(() => {
        if (shouldSucceed && su) {
          // Simulate eSewa success callback
          const successUrl = new URL(su);
          successUrl.searchParams.set('pid', pid || '');
          successUrl.searchParams.set('refId', `MOCK-${Date.now()}`);
          window.location.href = successUrl.toString();
        } else if (fu) {
          // Simulate eSewa failure callback
          const failureUrl = new URL(fu);
          failureUrl.searchParams.set('pid', pid || '');
          window.location.href = failureUrl.toString();
        }
      }, 2000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [pid, su, fu]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {processing ? (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Payment...
            </h2>
            <p className="text-gray-600 mb-4">
              Simulating eSewa payment processing
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-left">
              <p className="text-sm text-blue-800">
                <strong>Mock Mode:</strong> This is a development simulation.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Transaction ID: {pid || 'N/A'}
              </p>
              <p className="text-xs text-blue-700">
                Amount: NPR {tAmt || amt || '0.00'}
              </p>
            </div>
          </>
        ) : success ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Redirecting to success page...
            </p>
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-4">
              Redirecting to failure page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

