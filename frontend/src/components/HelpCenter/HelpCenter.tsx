import React, { useState } from 'react';
import { Search, Book, MessageCircle, Video, FileText, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

interface HelpCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  articles: HelpArticle[];
}

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: <Book className="h-5 w-5" />,
    articles: [
      {
        id: 'create-organization',
        title: 'How to Create an Organization',
        category: 'getting-started',
        content: 'Learn how to create your first organization and invite team members.',
        tags: ['organization', 'setup'],
      },
      {
        id: 'invite-users',
        title: 'Inviting Users to Your Organization',
        category: 'getting-started',
        content: 'Step-by-step guide to inviting users and managing team members.',
        tags: ['users', 'invitations'],
      },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    icon: <FileText className="h-5 w-5" />,
    articles: [
      {
        id: 'roles-permissions',
        title: 'Understanding Roles and Permissions',
        category: 'features',
        content: 'Learn how to configure roles and manage permissions in your organization.',
        tags: ['roles', 'permissions'],
      },
      {
        id: 'chat-features',
        title: 'Using Chat Features',
        category: 'features',
        content: 'Discover all the chat features including file sharing and message threading.',
        tags: ['chat', 'communication'],
      },
    ],
  },
  {
    id: 'billing',
    name: 'Billing & Plans',
    icon: <FileText className="h-5 w-5" />,
    articles: [
      {
        id: 'upgrade-plan',
        title: 'Upgrading Your Plan',
        category: 'billing',
        content: 'Learn how to upgrade your organization plan and unlock new features.',
        tags: ['billing', 'plans'],
      },
    ],
  },
];

export const HelpCenter: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredCategories = helpCategories.filter((category) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(query) ||
      category.articles.some(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    );
  });

  const filteredArticles = selectedCategory
    ? helpCategories
        .find((c) => c.id === selectedCategory)
        ?.articles.filter((article) => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            article.title.toLowerCase().includes(query) ||
            article.tags.some((tag) => tag.toLowerCase().includes(query))
          );
        })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Help Center</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Close help center"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-6" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: theme.colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                '--tw-ring-color': theme.colors.primary
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedArticle ? (
            <div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="mb-4 flex items-center gap-2"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.secondary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.primary}
              >
                ← Back to articles
              </button>
              <h3 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>{selectedArticle.title}</h3>
              <div className="prose prose-invert max-w-none">
                <p style={{ color: theme.colors.textSecondary }}>{selectedArticle.content}</p>
              </div>
            </div>
          ) : selectedCategory ? (
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="mb-4 flex items-center gap-2"
                style={{ color: theme.colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.secondary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.primary}
              >
                ← Back to categories
              </button>
              <div className="space-y-3">
                {filteredArticles?.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full p-4 rounded-lg text-left transition-colors"
                    style={{ backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surface}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.background}
                  >
                    <h4 className="font-medium mb-1" style={{ color: theme.colors.text }}>{article.title}</h4>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>{article.content}</p>
                    <div className="flex gap-2 mt-2">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded"
                          style={{ backgroundColor: theme.colors.surface, color: theme.colors.textSecondary }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="p-6 rounded-lg text-left transition-colors group"
                  style={{ backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.border}` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.background;
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}>
                      {category.icon}
                    </div>
                    <h3 className="text-lg font-semibold transition-colors" style={{ color: theme.colors.text }}>
                      {category.name}
                    </h3>
                    <ChevronRight className="h-5 w-5 ml-auto" style={{ color: theme.colors.textSecondary }} />
                  </div>
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {category.articles.length} article{category.articles.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

