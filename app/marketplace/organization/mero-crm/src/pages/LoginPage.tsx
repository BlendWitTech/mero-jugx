import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService, LoginResponse } from '@frontend/services/authService';
import { useAuthStore } from '@frontend/store/authStore';
import toast from '@shared/hooks/useToast';
import { Loader2, Mail, Lock, Shield, ArrowLeft, Building2, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardDescription, Loading } from '@shared';
import { useTheme } from '@frontend/contexts/ThemeContext';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, accessToken, organization, _hasHydrated } = useAuthStore();
    const { theme, isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [tempToken, setTempToken] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState('');
    const [requiresOrgSelection, setRequiresOrgSelection] = useState(false);
    const [availableOrganizations, setAvailableOrganizations] = useState<Array<{ id: string; name: string; slug: string; role: string }>>([]);
    const [loginCredentials, setLoginCredentials] = useState<{ email: string; password?: string; mfaCode?: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showMfaCode, setShowMfaCode] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (!_hasHydrated) return;
        if (isAuthenticated && accessToken) {
            if (organization?.slug) {
                navigate(`/org/${organization.slug}`, { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [isAuthenticated, accessToken, organization, _hasHydrated, navigate]);

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response: LoginResponse = await authService.login({
                email: data.email,
                password: data.password,
            });

            if (response.requires_organization_selection && response.organizations) {
                setRequiresOrgSelection(true);
                setAvailableOrganizations(response.organizations);
                setLoginCredentials({ email: data.email, password: data.password });
                setIsLoading(false);
                return;
            }

            if (response.requires_mfa_verification && response.temp_token) {
                setMfaRequired(true);
                setTempToken(response.temp_token);
                setIsLoading(false);
                return;
            }

            if (response.access_token && response.user && response.organization) {
                const org = {
                    id: response.organization.id,
                    name: response.organization.name || '',
                    slug: response.organization.slug || '',
                };
                setAuth(
                    {
                        access_token: response.access_token,
                        refresh_token: response.refresh_token || '',
                    },
                    response.user,
                    org,
                );
                toast.success('Login successful!');
                await new Promise(resolve => setTimeout(resolve, 100));
                navigate(org.slug ? `/org/${org.slug}` : '/');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrganizationSelect = async (organizationId: string) => {
        if (!loginCredentials) return;
        setIsLoading(true);
        try {
            const response: LoginResponse = await authService.login({
                email: loginCredentials.email,
                password: loginCredentials.password!,
                organization_id: organizationId,
            });

            if (response.requires_mfa_verification && response.temp_token) {
                setMfaRequired(true);
                setTempToken(response.temp_token);
                setRequiresOrgSelection(false);
                return;
            }

            if (response.access_token && response.user && response.organization) {
                setAuth(
                    {
                        access_token: response.access_token,
                        refresh_token: response.refresh_token || '',
                    },
                    response.user,
                    { id: response.organization.id, name: response.organization.name || '', slug: response.organization.slug || '' },
                );
                toast.success('Login successful!');
                await new Promise(resolve => setTimeout(resolve, 100));
                navigate(response.organization.slug ? `/org/${response.organization.slug}` : '/');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMfaVerify = async () => {
        if (!tempToken || !mfaCode) {
            toast.error('Please enter the 2FA code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.verifyMfa(tempToken, mfaCode);

            if (response.requires_organization_selection && response.organizations) {
                setRequiresOrgSelection(true);
                setAvailableOrganizations(response.organizations);
                setMfaRequired(false);
                setTempToken(null);
                setMfaCode('');
                setIsLoading(false);
                return;
            }

            if (response.access_token && response.user && response.organization) {
                setAuth(
                    {
                        access_token: response.access_token,
                        refresh_token: response.refresh_token || '',
                    },
                    response.user,
                    { id: response.organization.id, name: response.organization.name || '', slug: response.organization.slug || '' },
                );
                toast.success('Login successful!');
                await new Promise(resolve => setTimeout(resolve, 100));
                navigate(response.organization.slug ? `/org/${response.organization.slug}` : '/');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid 2FA code');
        } finally {
            setIsLoading(false);
        }
    };

    // Organization Selection Screen
    if (requiresOrgSelection) {
        return (
            <div
                className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
                style={{
                    background: isDark
                        ? `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.background} 100%)`
                        : `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 50%, ${theme.colors.surface} 100%)`
                }}
            >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
                        style={{ backgroundColor: `${theme.colors.primary}1A` }}
                    />
                    <div
                        className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
                        style={{ backgroundColor: `${theme.colors.primary}0D` }}
                    />
                </div>

                <div className="relative max-w-md w-full z-10">
                    <div
                        className="rounded-2xl p-8 shadow-2xl border backdrop-blur-sm"
                        style={{
                            backgroundColor: `${theme.colors.surface}F2`,
                            borderColor: theme.colors.border,
                        }}
                    >
                        <div className="text-center mb-6">
                            <div
                                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                                }}
                            >
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                                Select Organization
                            </h2>
                            <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                                You belong to multiple organizations. Please select one to continue.
                            </p>
                        </div>
                        <div className="space-y-3">
                            {availableOrganizations.map((org) => (
                                <Button
                                    key={org.id}
                                    onClick={() => handleOrganizationSelect(org.id)}
                                    disabled={isLoading}
                                    variant="outline"
                                    fullWidth
                                    className="justify-start text-left h-auto p-4"
                                >
                                    <div className="flex flex-col items-start w-full">
                                        <div className="font-semibold">{org.name}</div>
                                        <div className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>Role: {org.role}</div>
                                    </div>
                                </Button>
                            ))}
                            <Button
                                onClick={() => {
                                    setRequiresOrgSelection(false);
                                    setAvailableOrganizations([]);
                                    setLoginCredentials(null);
                                }}
                                variant="link"
                                fullWidth
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                                className="mt-4"
                            >
                                Back to login
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // MFA Verification Screen
    if (mfaRequired) {
        return (
            <div
                className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
                style={{
                    background: isDark
                        ? `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.background} 100%)`
                        : `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 50%, ${theme.colors.surface} 100%)`
                }}
            >
                <div className="relative max-w-md w-full z-10">
                    <div
                        className="rounded-2xl p-8 shadow-2xl border backdrop-blur-sm"
                        style={{
                            backgroundColor: `${theme.colors.surface}F2`,
                            borderColor: theme.colors.border,
                        }}
                    >
                        <div className="text-center mb-6">
                            <div
                                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                                }}
                            >
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                                Two-Factor Authentication
                            </h2>
                            <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    type={showMfaCode ? "text" : "password"}
                                    placeholder="000000"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMfaCode(!showMfaCode)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: theme.colors.textSecondary }}
                                >
                                    {showMfaCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <Button
                                onClick={handleMfaVerify}
                                disabled={isLoading || mfaCode.length !== 6}
                                fullWidth
                                leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            >
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setMfaRequired(false);
                                    setTempToken(null);
                                    setMfaCode('');
                                }}
                                variant="link"
                                fullWidth
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                            >
                                Back to login
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Login Screen
    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
            style={{
                background: isDark
                    ? `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.background} 100%)`
                    : `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 50%, ${theme.colors.surface} 100%)`
            }}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
                    style={{ backgroundColor: `${theme.colors.primary}1A` }}
                />
                <div
                    className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: `${theme.colors.primary}0D` }}
                />
            </div>

            <div className="relative max-w-md w-full z-10">
                <div
                    className="rounded-2xl p-8 shadow-2xl border backdrop-blur-sm"
                    style={{
                        backgroundColor: `${theme.colors.surface}F2`,
                        borderColor: theme.colors.border,
                    }}
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                            Welcome to Mero CRM
                        </h2>
                        <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                            Sign in to manage your customer relationships
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-10"
                                    error={errors.email?.message}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                                <Input
                                    {...register('password')}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    error={errors.password?.message}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: theme.colors.textSecondary }}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Link
                                to="/forgot-password"
                                className="text-sm hover:underline"
                                style={{ color: theme.colors.primary }}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            fullWidth
                            leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-medium hover:underline"
                                style={{ color: theme.colors.primary }}
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
