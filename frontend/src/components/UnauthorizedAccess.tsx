import React from 'react';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface UnauthorizedAccessProps {
  message?: string;
  feature?: string;
  onBack?: () => void;
}

export const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  message,
  feature,
  onBack,
}) => {
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div 
        className="max-w-md w-full rounded-2xl p-8 text-center shadow-2xl"
        style={{
          background: isDark ? 'rgba(47, 49, 54, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="mb-6">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: `linear-gradient(135deg, #ed424520 0%, #dc262620 100%)` }}
          >
            <Shield className="h-12 w-12 text-[#ed4245]" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>
          403 - Access Forbidden
        </h2>
        
        <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
          {message || (
            <>
              You do not have permission to {feature ? `access ${feature}` : 'access this feature'}.
              <br />
              Please ask your organization owner to set up access for you.
            </>
          )}
        </p>

        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            background: `${theme.colors.border}40`,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#faa61a' }} />
            <p className="text-sm text-left" style={{ color: theme.colors.textSecondary }}>
              If you need access to this feature, please contact your organization owner 
              to update your role permissions. They can grant you the necessary permissions 
              through the Roles & Permissions page.
            </p>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="w-full px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-white"
          style={{ background: theme.colors.primary }}
        >
          <ArrowLeft className="h-5 w-5" />
          Go Back
        </button>
      </div>
    </div>
  );
};

