import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { clientsApi, CreateClientDto } from '../../api/clients';
import { Card, Button, Input, Label, Textarea } from '@shared';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function ClientFormPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateClientDto>({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        notes: '',
    });

    useEffect(() => {
        if (isEdit) {
            fetchClient();
        }
    }, [id]);

    const fetchClient = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const client = await clientsApi.getClient(id);
            setFormData({
                name: client.name,
                email: client.email,
                phone: client.phone || '',
                company: client.company || '',
                address: client.address || '',
                city: client.city || '',
                state: client.state || '',
                country: client.country || '',
                zipCode: client.zipCode || '',
                notes: client.notes || '',
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch client');
            navigate(buildHref('/clients'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast.error('Name and email are required');
            return;
        }

        try {
            setSubmitting(true);
            if (isEdit && id) {
                await clientsApi.updateClient(id, formData);
                toast.success('Client updated successfully');
            } else {
                await clientsApi.createClient(formData);
                toast.success('Client created successfully');
            }
            navigate(buildHref('/clients'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} client`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field: keyof CreateClientDto, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                        style={{ borderColor: theme.colors.primary }}
                    ></div>
                    <p style={{ color: theme.colors.textSecondary }}>Loading client...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(buildHref('/clients'))}
                    className="p-2 rounded transition-colors"
                    style={{ color: theme.colors.textSecondary }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                    }}
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
                        {isEdit ? 'Edit Client' : 'New Client'}
                    </h1>
                    <p style={{ color: theme.colors.textSecondary }}>
                        {isEdit ? 'Update client information' : 'Add a new client to your CRM'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6" style={{ backgroundColor: theme.colors.surface }}>
                    {/* Basic Information */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div>
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => handleChange('company', e.target.value)}
                                    placeholder="Acme Inc."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Address Information
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label htmlFor="address">Street Address</Label>
                                <Input
                                    id="address"
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="123 Main St"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        placeholder="New York"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">State/Province</Label>
                                    <Input
                                        id="state"
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        placeholder="NY"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => handleChange('country', e.target.value)}
                                        placeholder="United States"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                                    <Input
                                        id="zipCode"
                                        type="text"
                                        value={formData.zipCode}
                                        onChange={(e) => handleChange('zipCode', e.target.value)}
                                        placeholder="10001"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Additional Information
                        </h2>
                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Add any additional notes about this client..."
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(buildHref('/clients'))}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isEdit ? 'Update Client' : 'Create Client'}
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}
