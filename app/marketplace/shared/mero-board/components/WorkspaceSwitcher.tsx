import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAppContext } from '../contexts/AppContext';
import api from '@frontend/services/api';
import toast from '@shared/hooks/useToast';

interface Workspace {
  id: string;
  name: string;
  color: string | null;
  logo_url: string | null;
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string | null;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export default function WorkspaceSwitcher({
  currentWorkspaceId,
  onWorkspaceChange
}: WorkspaceSwitcherProps) {
  const { theme } = useTheme();
  const { appSlug } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Fetch workspaces
  const { data: workspacesData, isLoading } = useQuery<{ data: Workspace[]; meta: any }>({
    queryKey: ['workspaces', appSlug],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces`);
      return response.data;
    },
  });
  const workspaces = workspacesData?.data || [];

  // Fetch current workspace details
  const { data: currentWorkspace } = useQuery<Workspace>({
    queryKey: ['workspace', appSlug, currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return null;
      const response = await api.get(`/apps/${appSlug}/workspaces/${currentWorkspaceId}`);
      return response.data;
    },
    enabled: !!currentWorkspaceId,
  });

  const workspace = currentWorkspace || workspaces.find(w => w.id === currentWorkspaceId) || null;

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

  const handleWorkspaceSwitch = (workspaceId: string) => {
    // Update URL to reflect workspace change
    const currentPath = location.pathname;
    const workspaceMatch = currentPath.match(/\/workspaces\/([^/]+)/);

    if (workspaceMatch) {
      // Replace workspace ID in path
      const newPath = currentPath.replace(/\/workspaces\/[^/]+/, `/workspaces/${workspaceId}`);
      navigate(newPath);
    } else {
      // Navigate to workspace root
      navigate(`workspaces/${workspaceId}`);
    }

    onWorkspaceChange?.(workspaceId);
    setIsOpen(false);
    toast.success('Workspace switched');
  };

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors w-full text-sm"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.border;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.surface;
        }}
      >
        {workspace?.logo_url ? (
          <img
            src={workspace.logo_url}
            alt={workspace.name}
            className="w-5 h-5 rounded object-cover flex-shrink-0"
          />
        ) : workspace?.color ? (
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: workspace.color }}
          >
            {getWorkspaceInitials(workspace.name)}
          </div>
        ) : (
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{
              backgroundColor: theme.colors.primary,
              color: 'white',
            }}
          >
            {workspace ? getWorkspaceInitials(workspace.name) : <Building2 className="h-3 w-3" />}
          </div>
        )}
        <span className="flex-1 text-left font-medium truncate text-sm">
          {workspace?.name || 'Select Workspace'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: theme.colors.textSecondary }} />
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute rounded-lg shadow-xl overflow-hidden max-h-[400px] overflow-y-auto"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: buttonRef.current?.offsetWidth || 'auto',
              minWidth: buttonRef.current?.offsetWidth || 280,
              zIndex: 9999,
            }}
          >
            <div className="p-2">
              <div className="px-3 py-2 mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.textSecondary }}>
                  Switch Workspace
                </p>
              </div>

              {isLoading ? (
                <div className="p-4 text-center" style={{ color: theme.colors.textSecondary }}>
                  Loading workspaces...
                </div>
              ) : workspaces.length === 0 ? (
                <div className="p-4 text-center" style={{ color: theme.colors.textSecondary }}>
                  No workspaces found
                </div>
              ) : (
                <div className="space-y-1">
                  {workspaces.map((ws) => {
                    const isSelected = ws.id === currentWorkspaceId;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => handleWorkspaceSwitch(ws.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                        style={{
                          backgroundColor: isSelected ? theme.colors.primary + '20' : 'transparent',
                          color: isSelected ? theme.colors.primary : theme.colors.text,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = theme.colors.border;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {ws.logo_url ? (
                          <img
                            src={ws.logo_url}
                            alt={ws.name}
                            className="w-6 h-6 rounded object-cover flex-shrink-0"
                          />
                        ) : ws.color ? (
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{ backgroundColor: ws.color }}
                          >
                            {getWorkspaceInitials(ws.name)}
                          </div>
                        ) : (
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: theme.colors.primary,
                              color: 'white',
                            }}
                          >
                            {getWorkspaceInitials(ws.name)}
                          </div>
                        )}
                        <span className="flex-1 truncate font-medium">{ws.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 flex-shrink-0" style={{ color: theme.colors.primary }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

