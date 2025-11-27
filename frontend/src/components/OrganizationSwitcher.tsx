import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Building2, ChevronDown, Plus, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OrganizationSwitcher({ compact = false }: { compact?: boolean }) {
  const { organization: orgFromStore, accessToken, _hasHydrated, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch current organization details
  const { data: currentOrganization } = useQuery({
    queryKey: ['current-organization'],
    queryFn: async () => {
      const response = await api.get('/organizations/me');
      return response.data;
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  // Use fetched organization or fallback to store organization
  const organization = currentOrganization || orgFromStore;

  // Fetch user's organizations
  const { data: organizations } = useQuery({
    queryKey: ['user-organizations'],
    queryFn: async () => {
      const response = await api.get('/organizations');
      return response.data || [];
    },
    enabled: _hasHydrated && isAuthenticated && !!accessToken,
  });

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      const response = await api.put('/organizations/switch', { organization_id: orgId });
      const { access_token, refresh_token, user: newUser, organization: newOrg } = response.data;
      
      const authStore = useAuthStore.getState();
      // Ensure slug is included in organization object
      const orgWithSlug = {
        id: newOrg.id,
        name: newOrg.name || '',
        slug: newOrg.slug || '',
      };
      authStore.setAuth(
        { access_token, refresh_token },
        newUser,
        orgWithSlug,
        null
      );
      
      // Navigate to organization slug route
      if (orgWithSlug.slug) {
        window.location.href = `/org/${orgWithSlug.slug}`;
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Failed to switch organization:', error);
    }
    setIsOpen(false);
  };


  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${compact ? 'w-12 h-12' : 'px-2 py-1.5'} ${compact ? 'rounded-2xl' : 'rounded'} flex items-center ${compact ? 'justify-center' : 'gap-2'} ${compact ? 'bg-gradient-to-br from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c45a5]' : 'hover:bg-[#393c43]'} transition-colors group ${compact ? 'relative' : ''} ${compact ? '' : 'text-left'}`}
        title={compact ? 'Switch Account' : (organization?.name || 'Switch Organization')}
      >
        {organization ? (
          <div className={`${compact ? 'h-12 w-12' : 'h-8 w-8'} ${compact ? 'rounded-2xl' : 'rounded-full'} ${compact ? '' : 'bg-[#5865f2]'} flex items-center justify-center flex-shrink-0 relative`}>
            <span className="text-xs font-bold text-white">
              {organization.name.charAt(0).toUpperCase()}
            </span>
            {compact && (
              <RefreshCw className="h-3 w-3 absolute -bottom-0.5 -right-0.5 bg-[#202225] text-white rounded-full p-0.5 border border-[#36393f]" />
            )}
          </div>
        ) : (
          <div className={`${compact ? 'h-12 w-12' : 'h-8 w-8'} ${compact ? 'rounded-2xl' : 'rounded-full'} ${compact ? '' : 'bg-[#5865f2]'} flex items-center justify-center flex-shrink-0 relative`}>
            <Building2 className={`${compact ? 'h-5 w-5' : 'h-4 w-4'} text-white`} />
            {compact && (
              <RefreshCw className="h-3 w-3 absolute -bottom-0.5 -right-0.5 bg-[#202225] text-white rounded-full p-0.5 border border-[#36393f]" />
            )}
          </div>
        )}
        {!compact && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {organization?.name || 'No Organization'}
              </p>
              <p className="text-xs text-[#b9bbbe] truncate">Switch account</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#b9bbbe] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute ${compact ? 'top-14 left-0' : 'top-0 left-16'} z-50 w-64 bg-[#18191c] rounded-lg shadow-xl border border-[#202225] overflow-hidden`}>
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
                Switch Organization
              </div>
              
              {/* Organizations */}
              {organizations && organizations.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-[#8e9297] uppercase tracking-wide mt-2">
                    Organizations
                  </div>
                  {organizations.map((org: any) => (
                    <button
                      key={org.id}
                      onClick={() => handleSwitchOrganization(org.id)}
                      className="w-full px-3 py-2 rounded text-left hover:bg-[#2d2f33] transition-colors flex items-center gap-3 group"
                    >
                      <div className="h-10 w-10 rounded-full bg-[#5865f2] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {org.name}
                        </p>
                        <p className="text-xs text-[#b9bbbe] truncate">
                          {org.email}
                        </p>
                      </div>
                      {organization?.id === org.id && (
                        <div className="h-2 w-2 rounded-full bg-[#23a55a] flex-shrink-0"></div>
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* Add Organization */}
              <div className="border-t border-[#202225] mt-2 pt-2">
                <button className="w-full px-3 py-2 rounded text-left hover:bg-[#2d2f33] transition-colors flex items-center gap-3 text-[#b9bbbe] hover:text-white">
                  <div className="h-10 w-10 rounded-full bg-[#36393f] flex items-center justify-center flex-shrink-0 border-2 border-dashed border-[#4f545c]">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">Create Organization</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

