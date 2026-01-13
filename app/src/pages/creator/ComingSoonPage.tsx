import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Sparkles } from 'lucide-react';
// Import shared components
import { Button } from '@shared';

export default function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1c20] via-[#36393f] to-[#2f3136] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center animate-fadeIn">
        <div className="bg-[#2f3136] rounded-2xl shadow-xl border border-[#202225] p-12">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ed4245] to-[#c03537] mb-6 shadow-lg shadow-[#ed4245]/20">
            <User className="w-10 h-10 text-white" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-white">
              Creator Dashboard
            </h1>
            <p className="text-[#b9bbbe] leading-relaxed">
              The creator dashboard is currently under development. We're working hard to bring you an amazing experience!
            </p>
            <div className="flex items-center justify-center gap-2 text-[#8e9297] text-sm pt-2">
              <Sparkles className="w-4 h-4" />
              <span>Coming soon</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              fullWidth
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Role Selection
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="link"
              fullWidth
            >
              Or sign in as Organization
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

