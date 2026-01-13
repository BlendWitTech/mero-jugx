import { useTheme } from '@frontend/contexts/ThemeContext';
import { Sparkles, Code, Palette, Zap, Rocket, Layers, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared';

export default function ComingSoonPage() {
  const { theme } = useTheme();

  const features = [
    {
      icon: Code,
      title: 'Visual Builder',
      description: 'Drag-and-drop interface to build SaaS templates visually',
    },
    {
      icon: Palette,
      title: 'Component Library',
      description: 'Pre-built components for auth, payments, dashboards, and more',
    },
    {
      icon: Zap,
      title: 'Code Generator',
      description: 'Generate production-ready code from templates automatically',
    },
    {
      icon: Rocket,
      title: 'One-Click Deployment',
      description: 'Deploy your generated SaaS apps to various platforms',
    },
    {
      icon: Layers,
      title: 'Template Marketplace',
      description: 'Browse, purchase, and sell SaaS starter kits',
    },
    {
      icon: Globe,
      title: 'Multi-Framework Support',
      description: 'Support for Next.js, Nuxt, SvelteKit, and more',
    },
  ];

  return (
    <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: theme.colors.background }}>
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.surface || 'white'
            }}
          >
            <Code className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold" style={{ color: theme.colors.text }}>
            Mero SaaS Kit
          </h1>
          <p className="text-xl" style={{ color: theme.colors.textSecondary }}>
            Build, customize, and deploy SaaS applications with ease
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            <Sparkles className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <span className="text-lg font-semibold" style={{ color: theme.colors.primary }}>
              Coming Soon
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="h-full"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }}
              >
                <CardHeader>
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: theme.colors.primary + '20',
                      color: theme.colors.primary
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <CardTitle style={{ color: theme.colors.text }}>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center pt-8">
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            We're working hard to bring you a powerful SaaS builder that will revolutionize how you create applications.
            <br />
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
}

