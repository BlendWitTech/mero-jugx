import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card, Button, Input, Label, toast } from '@shared';
import { Save, Image as ImageIcon, Type, Hash } from 'lucide-react';
import { crmSettingsApi } from '../../../api/settings';

export default function GeneralSettings() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState({
        crm_logo: '',
        crm_company_footer: '',
        crm_invoice_prefix: 'INV-',
        crm_quote_prefix: 'QT-',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await crmSettingsApi.getSettings();
            setSettings((prev) => ({
                ...prev,
                ...data,
            }));
        } catch (error: any) {
            toast.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSubmitting(true);
            await crmSettingsApi.batchUpdateSettings(settings);
            toast.success('Settings updated successfully');
        } catch (error: any) {
            toast.error('Failed to update settings');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center opacity-50">Loading settings...</div>;
    }

    return (
        <Card className="p-8 space-y-8 border-none shadow-xl shadow-black/5" style={{ backgroundColor: theme.colors.surface, borderRadius: '24px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Branding */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <ImageIcon className="h-5 w-5 text-primary" style={{ color: theme.colors.primary }} />
                        <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>Branding</h3>
                    </div>

                    <div className="space-y-2">
                        <Label>CRM Logo URL</Label>
                        <Input
                            placeholder="https://example.com/logo.png"
                            value={settings.crm_logo}
                            onChange={(e) => setSettings({ ...settings, crm_logo: e.target.value })}
                            className="bg-transparent border-2 focus:border-primary transition-all rounded-xl h-12"
                        />
                        <p className="text-xs opacity-50 pl-1">Displayed on Invoices and Quotes</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Company Footer Text</Label>
                        <Input
                            placeholder="Copyright 2024 © Your Company"
                            value={settings.crm_company_footer}
                            onChange={(e) => setSettings({ ...settings, crm_company_footer: e.target.value })}
                            className="bg-transparent border-2 focus:border-primary transition-all rounded-xl h-12"
                        />
                    </div>
                </div>

                {/* Prefixes */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Hash className="h-5 w-5 text-primary" style={{ color: theme.colors.primary }} />
                        <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>Document Prefixes</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Invoice Prefix</Label>
                            <Input
                                placeholder="INV-"
                                value={settings.crm_invoice_prefix}
                                onChange={(e) => setSettings({ ...settings, crm_invoice_prefix: e.target.value })}
                                className="bg-transparent border-2 focus:border-primary transition-all rounded-xl h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Quote Prefix</Label>
                            <Input
                                placeholder="QT-"
                                value={settings.crm_quote_prefix}
                                onChange={(e) => setSettings({ ...settings, crm_quote_prefix: e.target.value })}
                                className="bg-transparent border-2 focus:border-primary transition-all rounded-xl h-12"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={submitting}
                    className="px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Save className="h-5 w-5 mr-3" />
                    {submitting ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </Card>
    );
}
