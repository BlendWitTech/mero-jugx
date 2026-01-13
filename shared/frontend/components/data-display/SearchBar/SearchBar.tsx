import { InputHTMLAttributes, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { useSearch } from '../../../hooks/useSearch';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  accent: string;
}

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
  showClearButton?: boolean;
  fullWidth?: boolean;
  theme?: {
    colors: ThemeColors;
  };
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      onSearch,
      debounceMs = 300,
      showClearButton = true,
      fullWidth = true,
      placeholder = 'Search...',
      theme,
      ...props
    },
    ref,
  ) => {
    const { searchValue, setSearchValue, clear, isSearching } = useSearch({
      debounceMs,
      onSearch,
    });

    const searchIconStyle = theme
      ? { color: theme.colors.textSecondary }
      : undefined;

    const spinnerStyle = theme
      ? {
          borderColor: theme.colors.border,
          borderTopColor: theme.colors.primary,
        }
      : undefined;

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={placeholder}
          leftIcon={<Search className="h-4 w-4" style={searchIconStyle} />}
          rightIcon={
            showClearButton && searchValue ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="h-auto p-0"
                aria-label="Clear search"
                style={theme ? { color: theme.colors.textSecondary } : undefined}
                onMouseEnter={(e) => {
                  if (theme) {
                    e.currentTarget.style.color = theme.colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme) {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : isSearching ? (
              <div
                className="h-4 w-4 animate-spin rounded-full border-2"
                style={spinnerStyle}
              />
            ) : null
          }
          fullWidth={fullWidth}
          theme={theme}
          {...props}
        />
      </div>
    );
  },
);

SearchBar.displayName = 'SearchBar';

