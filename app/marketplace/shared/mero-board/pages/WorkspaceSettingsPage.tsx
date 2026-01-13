import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Loading } from '@shared/frontend';
import api from '@frontend/services/api';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import WorkspaceColorPicker from '../components/WorkspaceColorPicker';
import toast from '@shared/frontend/hooks/useToast';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { ConfirmDialog } from '@shared/frontend/components/feedback/ConfirmDialog';

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { appSlug } = useAppContext();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', appSlug, workspaceId],
    queryFn: async () => {
      const response = await api.get(`/apps/${appSlug}/workspaces/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: null as string | null,
  });

  React.useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name || '',
        description: workspace.description || '',
        color: workspace.color || null,
      });
    }
  }, [workspace]);

  const updateWorkspaceMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string; color?: string }) => {
      const response = await api.put(`/apps/${appSlug}/workspaces/${workspaceId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', appSlug, workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', appSlug] });
      toast.success('Workspace updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update workspace');
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/apps/${appSlug}/workspaces/${workspaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', appSlug] });
      toast.success('Workspace deleted successfully');
      navigate('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    },
  });

  const handleSave = () => {
    updateWorkspaceMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color || undefined,
    });
  };

  const handleDelete = () => {
    deleteWorkspaceMutation.mutate();
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading settings..." />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background }}>
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardContent className="py-12 text-center">
            <p style={{ color: theme.colors.text }}>Workspace not found</p>
            <Button 
              onClick={() => navigate('../../', { relative: 'route' })} 
              className="mt-4"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspaces
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(`../`, { relative: 'route' })} 
          className="mb-4"
          style={{
            borderColor: theme.colors.border,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
          }}
          onMouseEnter={(e: any) => {
            e.currentTarget.style.backgroundColor = theme.colors.background;
          }}
          onMouseLeave={(e: any) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspace
        </Button>
        <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>Workspace Settings</h1>
        <p className="mt-2" style={{ color: theme.colors.textSecondary }}>Manage your workspace settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* General Settings */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <CardHeader>
            <CardTitle style={{ color: theme.colors.text }}>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Workspace Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter workspace name"
                style={{
                  backgroundColor: theme.colors.inputBackground || theme.colors.background,
                  borderColor: theme.colors.inputBorder || theme.colors.border,
                  color: theme.colors.inputText || theme.colors.text,
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter workspace description"
                rows={3}
                style={{
                  backgroundColor: theme.colors.inputBackground || theme.colors.background,
                  borderColor: theme.colors.inputBorder || theme.colors.border,
                  color: theme.colors.inputText || theme.colors.text,
                }}
              />
            </div>
            <WorkspaceColorPicker
              selectedColor={formData.color}
              onColorSelect={(color) => setFormData({ ...formData, color })}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={!formData.name.trim() || updateWorkspaceMutation.isPending}
                isLoading={updateWorkspaceMutation.isPending}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.buttonText || '#ffffff',
                }}
                onMouseEnter={(e: any) => {
                  e.currentTarget.style.backgroundColor = theme.colors.secondary;
                }}
                onMouseLeave={(e: any) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary;
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card style={{ 
          borderColor: theme.colors.danger, 
          backgroundColor: theme.colors.surface,
          borderWidth: '1px',
        }}>
          <CardHeader 
            style={{ 
              backgroundColor: theme.colors.surface,
              borderBottom: `1px solid ${theme.colors.danger}20`,
              padding: '1rem',
            }}
          >
            <CardTitle 
              className="!text-lg !font-semibold !leading-none !tracking-tight"
              style={{ 
                color: theme.colors.danger,
              }}
            >
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent style={{ 
            backgroundColor: theme.colors.surface,
            padding: '1rem',
          }}>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Delete Workspace</h3>
                <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                  Once you delete a workspace, there is no going back. Please be certain.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  style={{ 
                    borderColor: theme.colors.danger, 
                    color: theme.colors.danger,
                    backgroundColor: theme.colors.surface,
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.backgroundColor = theme.colors.danger;
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = theme.colors.danger;
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surface;
                    e.currentTarget.style.color = theme.colors.danger;
                    e.currentTarget.style.borderColor = theme.colors.danger;
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspace.name}"? This action cannot be undone and will delete all projects, tasks, and data in this workspace.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        theme={theme}
      />
    </div>
  );
}

