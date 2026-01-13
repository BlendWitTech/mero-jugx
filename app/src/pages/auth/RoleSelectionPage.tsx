import { useNavigate } from 'react-router-dom';
import { Building2, User, ArrowRight, Sparkles, Zap, Shield, TrendingUp, Users, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleSelectRole = (role: 'organization' | 'creator') => {
    if (role === 'organization') {
      navigate('/login');
    } else {
      navigate('/creator/coming-soon');
    }
  };

  const features = [
    { icon: Users, text: 'Team Collaboration' },
    { icon: Shield, text: 'Enterprise Security' },
    { icon: TrendingUp, text: 'Analytics & Insights' },
    { icon: Globe, text: 'Global Access' },
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ 
        background: isDark 
          ? 'linear-gradient(135deg, #1a1c20 0%, #2f3136 50%, #36393f 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5865f2]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#5865f2]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5865f2]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl w-full space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#5865f2] to-[#4752c4] mb-6 shadow-2xl shadow-[#5865f2]/30 transform hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight"
              style={{ color: theme.colors.text }}>
            Welcome to Mero Jugx
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto"
             style={{ color: theme.colors.textSecondary }}>
            Your all-in-one platform for team collaboration, project management, and business growth
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-300 hover:scale-105"
                  style={{
                    background: isDark ? 'rgba(47, 49, 54, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(32, 34, 37, 0.5)' : 'rgba(226, 232, 240, 0.8)',
                    color: theme.colors.textSecondary,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slideUp">
          {/* Organization Card */}
          <div
            className="group relative rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] overflow-hidden"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(47, 49, 54, 0.95) 0%, rgba(54, 57, 63, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              border: `2px solid ${isDark ? 'rgba(32, 34, 37, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
              boxShadow: hoveredCard === 'organization' 
                ? `0 20px 60px -15px ${theme.colors.primary}40`
                : isDark 
                  ? '0 10px 40px -10px rgba(0, 0, 0, 0.3)'
                  : '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={() => setHoveredCard('organization')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleSelectRole('organization')}
          >
            {/* Animated gradient overlay */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}15 0%, transparent 100%)`,
              }}
            />
            
            <div className="relative space-y-6">
              {/* Icon */}
              <div 
                className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-500 ${
                  hoveredCard === 'organization' ? 'scale-110 rotate-6' : ''
                }`}
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                  boxShadow: `0 10px 30px -5px ${theme.colors.primary}50`,
                }}
              >
                <Building2 className="w-10 h-10 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                  Organization
                </h2>
                <p className="text-lg leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  Manage your team, collaborate on projects, and access organization-wide features and settings. Perfect for businesses and teams.
                </p>
              </div>

              {/* Features list */}
              <ul className="space-y-2">
                {['Team Management', 'Role-Based Access', 'Analytics Dashboard', 'Custom Branding'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                    <Zap className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div 
                className="flex items-center font-semibold transition-all duration-300 group-hover:gap-3"
                style={{ color: theme.colors.primary }}
              >
                <span className="text-lg">Continue as Organization</span>
                <ArrowRight 
                  className={`ml-2 w-6 h-6 transition-transform duration-300 ${
                    hoveredCard === 'organization' ? 'translate-x-2' : ''
                  }`} 
                />
              </div>
            </div>
          </div>

          {/* Creator Card */}
          <div
            className="group relative rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] overflow-hidden"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(47, 49, 54, 0.95) 0%, rgba(54, 57, 63, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              border: `2px solid ${isDark ? 'rgba(32, 34, 37, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
              boxShadow: hoveredCard === 'creator' 
                ? `0 20px 60px -15px #ed424540`
                : isDark 
                  ? '0 10px 40px -10px rgba(0, 0, 0, 0.3)'
                  : '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={() => setHoveredCard('creator')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleSelectRole('creator')}
          >
            {/* Animated gradient overlay */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(237, 66, 69, 0.15) 0%, transparent 100%)',
              }}
            />
            
            <div className="relative space-y-6">
              {/* Icon */}
              <div 
                className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-500 ${
                  hoveredCard === 'creator' ? 'scale-110 rotate-6' : ''
                }`}
                style={{
                  background: 'linear-gradient(135deg, #ed4245 0%, #c03537 100%)',
                  boxShadow: '0 10px 30px -5px rgba(237, 66, 69, 0.5)',
                }}
              >
                <User className="w-10 h-10 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                  Creator
                </h2>
                <p className="text-lg leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  Access your personal creator dashboard, manage your content, and grow your audience. Built for individual creators and freelancers.
                </p>
              </div>

              {/* Features list */}
              <ul className="space-y-2">
                {['Content Management', 'Audience Analytics', 'Revenue Tracking', 'Creator Tools'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                    <Zap className="w-4 h-4" style={{ color: '#ed4245' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div 
                className="flex items-center font-semibold transition-all duration-300 group-hover:gap-3"
                style={{ color: '#ed4245' }}
              >
                <span className="text-lg">Continue as Creator</span>
                <ArrowRight 
                  className={`ml-2 w-6 h-6 transition-transform duration-300 ${
                    hoveredCard === 'creator' ? 'translate-x-2' : ''
                  }`} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center animate-fadeIn">
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Need help?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold transition-colors hover:underline"
              style={{ color: theme.colors.primary }}
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
