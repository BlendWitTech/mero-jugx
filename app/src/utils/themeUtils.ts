/**
 * Theme utility functions to help components use theme colors
 */

export const getThemeClasses = (isDark: boolean) => {
  return {
    // Backgrounds
    bgSurface: isDark ? 'bg-[#2f3136]' : 'bg-[#f8f9fa]',
    bgBackground: isDark ? 'bg-[#36393f]' : 'bg-white',
    bgCard: isDark ? 'bg-[#2f3136]' : 'bg-white',
    
    // Text
    textPrimary: isDark ? 'text-white' : 'text-[#1a1c20]',
    textSecondary: isDark ? 'text-[#b9bbbe]' : 'text-[#6b7280]',
    
    // Borders
    border: isDark ? 'border-[#202225]' : 'border-[#e5e7eb]',
    
    // Hover states
    hoverBg: isDark ? 'hover:bg-[#36393f]' : 'hover:bg-[#f3f4f6]',
  };
};

/**
 * Get inline styles using CSS variables for theme-aware components
 */
export const getThemeStyles = () => {
  return {
    background: 'var(--theme-background)',
    surface: 'var(--theme-surface)',
    text: 'var(--theme-text)',
    textSecondary: 'var(--theme-text-secondary)',
    border: 'var(--theme-border)',
    primary: 'var(--theme-primary)',
    secondary: 'var(--theme-secondary)',
    accent: 'var(--theme-accent)',
  };
};

