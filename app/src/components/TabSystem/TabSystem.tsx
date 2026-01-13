import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getActiveAppIds } from '../../services/appSessionService';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface Tab {
  id: string;
  type: 'dashboard' | 'app' | 'marketplace';
  label: string;
  icon?: string;
  appId?: number;
  appSlug?: string;
  path: string;
}

interface TabSystemProps {
  onNewTab?: () => void;
  onCloseTab?: (tabId: string) => void;
  onTabClick?: (tab: Tab) => void;
}

export default function TabSystem({ onNewTab, onCloseTab, onTabClick }: TabSystemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { theme } = useTheme();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Get active app IDs
  const activeAppIds = getActiveAppIds();

  // Fetch all apps
  const { data: allApps } = useQuery({
    queryKey: ['all-apps-for-tabs'],
    queryFn: async () => {
      const response = await api.get('/marketplace/apps');
      return response.data.data || response.data || [];
    },
  });

  // Initialize tabs from localStorage
  useEffect(() => {
    const savedTabs = localStorage.getItem('app-tabs');
    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs);
        setTabs(parsedTabs);
      } catch (e) {
        console.error('Failed to parse saved tabs', e);
      }
    } else {
      // Default: Dashboard tab
      const defaultTab: Tab = {
        id: 'dashboard',
        type: 'dashboard',
        label: 'Dashboard',
        path: `/org/${slug || ''}`,
      };
      setTabs([defaultTab]);
      setActiveTabId('dashboard');
    }
  }, [slug]);

  // Update active tab based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check if it's an app route
    const appMatch = currentPath.match(/\/app\/([^/]+)/);
    if (appMatch) {
      const appSlug = appMatch[1];
      const app = allApps?.find((a: any) => a.slug === appSlug);
      if (app) {
        const tabId = `app-${app.id}`;
        setActiveTabId(tabId);
        
        // Add tab if it doesn't exist
        setTabs((prev) => {
          const exists = prev.find((t) => t.id === tabId);
          if (!exists) {
            const newTabs = [
              ...prev,
              {
                id: tabId,
                type: 'app',
                label: app.name,
                icon: app.icon_url || undefined,
                appId: app.id,
                appSlug: app.slug,
                path: currentPath,
              },
            ];
            return newTabs;
          }
          // Update path if tab exists
          return prev.map(t => t.id === tabId ? { ...t, path: currentPath } : t);
        });
        return;
      }
    }

    // Check if it's marketplace
    if (currentPath.includes('/apps') && !currentPath.match(/\/app\//)) {
      const tabId = 'marketplace';
      setActiveTabId(tabId);
      setTabs((prev) => {
        const exists = prev.find((t) => t.id === tabId);
        if (!exists) {
          return [
            ...prev,
            {
              id: tabId,
              type: 'marketplace',
              label: 'Marketplace',
              path: currentPath,
            },
          ];
        }
        return prev.map(t => t.id === tabId ? { ...t, path: currentPath } : t);
      });
      return;
    }

    // Default to dashboard
    setActiveTabId('dashboard');
    setTabs((prev) => {
      const dashboardTab = prev.find((t) => t.id === 'dashboard');
      if (dashboardTab) {
        return prev.map(t => t.id === 'dashboard' ? { ...t, path: currentPath } : t);
      }
      return prev;
    });
  }, [location.pathname, allApps]);

  // Save tabs to localStorage
  useEffect(() => {
    if (tabs.length > 0) {
      localStorage.setItem('app-tabs', JSON.stringify(tabs));
    }
  }, [tabs]);

  const handleNewTab = () => {
    if (onNewTab) {
      onNewTab();
    } else {
      // Default: navigate to marketplace
      navigate(`/org/${slug || ''}/apps`);
    }
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTabId(tab.id);
    if (onTabClick) {
      onTabClick(tab);
    } else {
      navigate(tab.path);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    
    if (tabId === 'dashboard') {
      // Can't close dashboard
      return;
    }

    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      
      // If closing active tab, switch to dashboard
      if (tabId === activeTabId && newTabs.length > 0) {
        const dashboardTab = newTabs.find((t) => t.id === 'dashboard');
        if (dashboardTab) {
          setActiveTabId('dashboard');
          navigate(dashboardTab.path);
        } else if (newTabs.length > 0) {
          const nextTab = newTabs[0];
          setActiveTabId(nextTab.id);
          navigate(nextTab.path);
        }
      }
      
      return newTabs;
    });

    if (onCloseTab) {
      onCloseTab(tabId);
    }
  };

  return (
    <div
      className="flex items-center gap-1 px-2 h-8 overflow-x-auto scrollbar-thin"
      style={{
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded-t-md cursor-pointer transition-all
              min-w-[120px] max-w-[200px] group
              ${isActive ? '' : 'hover:opacity-80'}
            `}
            style={{
              backgroundColor: isActive ? theme.colors.background : 'transparent',
              borderBottom: isActive ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
              color: isActive ? theme.colors.text : theme.colors.textSecondary,
            }}
          >
            {tab.icon && (
              <img
                src={tab.icon}
                alt={tab.label}
                className="w-4 h-4 rounded flex-shrink-0"
              />
            )}
            <span className="text-xs font-medium truncate flex-1">{tab.label}</span>
            {tab.id !== 'dashboard' && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 transition-all flex-shrink-0"
                style={{ color: theme.colors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.textSecondary;
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
      
      <button
        onClick={handleNewTab}
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-1"
        style={{ color: theme.colors.textSecondary }}
        title="New Tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

