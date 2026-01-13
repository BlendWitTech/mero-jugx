import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import AppsPage from '../../pages/apps/AppsPage';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppSelect?: (appId: number, appSlug: string) => void;
}

export default function MarketplaceModal({ isOpen, onClose, onAppSelect }: MarketplaceModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{ backgroundColor: theme.colors.background }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
            App Marketplace
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: theme.colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.colors.text;
              e.currentTarget.style.backgroundColor = theme.colors.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.colors.textSecondary;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto">
          <AppsPage />
        </div>
      </div>
    </div>
  );
}

