import React, { useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Settings, Users, Globe } from 'lucide-react';
import { UserAppAccessTab } from '@frontend/components/apps/UserAppAccessTab';

type SettingsTab = 'general' | 'users';

export default function InventorySettingsPage() {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'users', name: 'Users', icon: Users },
    ];

    return (
        <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                    <Settings className="h-8 w-8" style={{ color: theme.colors.primary }} />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: theme.colors.text }}>
                        Inventory Settings
                    </h1>
                    <p className="opacity-70" style={{ color: theme.colors.textSecondary }}>
                        Configure your organization-wide inventory preferences
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 p-1 rounded-xl w-fit" style={{ backgroundColor: theme.colors.border }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive ? 'shadow-sm translate-y-[-1px]' : 'opacity-60 hover:opacity-100'
                                }`}
                            style={{
                                backgroundColor: isActive ? theme.colors.surface : 'transparent',
                                color: isActive ? theme.colors.primary : theme.colors.text,
                            }}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.name}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                {activeTab === 'general' && (
                    <div className="border rounded-lg p-6 max-w-2xl" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
                        <h3 className="text-lg font-medium mb-4" style={{ color: theme.colors.text }}>General Configuration</h3>
                        <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                            Inventory settings will appear here.
                        </p>
                    </div>
                )}
                {activeTab === 'users' && <UserAppAccessTab appId={2} appName="Mero Inventory" />}
            </div>
        </div>
    );
}
