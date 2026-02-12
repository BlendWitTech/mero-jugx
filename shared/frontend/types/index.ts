export interface ThemeColors {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    error: string;
    warning: string;
    info: string;
    success: string;
    // Expanded properties to satisfy UI component usage
    inputBackground?: string;
    inputBorder?: string;
    inputText?: string;
    buttonText?: string;
    [key: string]: string | undefined; // Allow flexibility
}

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    // Add camelCase aliases for compatibility if needed, or enforcing snake_case
    firstName?: string;
    lastName?: string;
    avatar_url?: string;
    is_system_admin?: boolean;
    system_admin_role?: string;
    phone?: string;
    address?: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    mfa_enabled?: boolean;
}
