import React from 'react';
import { X, AlertCircle, Info, Megaphone } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type?: 'welcome' | 'info' | 'announcement';
  image?: string;
  actionText?: string;
  actionUrl?: string;
}

interface AnnouncementModalProps {
  announcement: Announcement;
  onClose: () => void;
  onDismiss?: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  onClose,
  onDismiss,
}) => {
  const { theme, isDark } = useTheme();

  const getIconColor = () => {
    switch (announcement.type) {
      case 'welcome':
        return theme.colors.primary;
      case 'info':
        return '#0ea5e9';
      case 'announcement':
        return '#faa61a';
      default:
        return theme.colors.primary;
    }
  };

  const getBgColor = () => {
    switch (announcement.type) {
      case 'welcome':
        return theme.colors.primary + '1A';
      case 'info':
        return '#0ea5e9' + '1A';
      case 'announcement':
        return '#faa61a' + '1A';
      default:
        return theme.colors.primary + '1A';
    }
  };

  const getIcon = () => {
    const iconColor = getIconColor();
    switch (announcement.type) {
      case 'welcome':
        return <Megaphone className="h-8 w-8" style={{ color: iconColor }} />;
      case 'info':
        return <Info className="h-8 w-8" style={{ color: iconColor }} />;
      case 'announcement':
        return <AlertCircle className="h-8 w-8" style={{ color: iconColor }} />;
      default:
        return <Info className="h-8 w-8" style={{ color: iconColor }} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" 
      style={{ 
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)'
      }}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden animate-slideUp"
        style={{
          backgroundColor: isDark ? '#1a1c20' : theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: isDark 
            ? `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)`
            : `0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid ${theme.colors.border}`, backgroundColor: isDark ? '#1a1c20' : theme.colors.background }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: getBgColor() }}>
              {getIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                {announcement.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ 
              color: theme.colors.textSecondary,
              backgroundColor: theme.colors.surface,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.border;
              e.currentTarget.style.color = theme.colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface;
              e.currentTarget.style.color = theme.colors.textSecondary;
            }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6" style={{ backgroundColor: isDark ? '#1a1c20' : theme.colors.background }}>
          {announcement.image && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={announcement.image}
                alt={announcement.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}
          <div 
            className="max-w-none"
            style={{ color: theme.colors.textSecondary }}
          >
            <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: theme.colors.textSecondary }}>
              {announcement.message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6" style={{ borderTop: `1px solid ${theme.colors.border}`, backgroundColor: isDark ? '#1a1c20' : theme.colors.background }}>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                color: theme.colors.textSecondary,
                backgroundColor: theme.colors.surface,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.border;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              Don't show again
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            {announcement.actionUrl && announcement.actionText && (
              <a
                href={announcement.actionUrl}
                className="px-6 py-2 rounded-lg font-semibold transition-colors"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                }}
              >
                {announcement.actionText}
              </a>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-semibold transition-colors"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

