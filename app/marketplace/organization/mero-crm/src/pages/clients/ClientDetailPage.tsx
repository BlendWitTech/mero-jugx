import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { clientsApi, Client } from '../../api/clients';
import { Card, Button, Badge } from '@shared';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, MapPin } from 'lucide-react';
import { toast } from '@shared';
import { useAppContext } from '../../contexts/AppContext';

export default function ClientDetailPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { buildHref } = useAppContext();
    const { id } = useParams<{ id: string }>();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchClient();
        }
    }, [id]);

    const fetchClient = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await clientsApi.getClient(id);
            setClient(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch client');
            navigate(buildHref('/clients'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Are you sure you want to delete this client?')) {
            return;
        }

        try {
            await clientsApi.deleteClient(id);
            toast.success('Client deleted successfully');
            navigate(buildHref('/clients'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete client');
        }
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

    if (!client) {
        return null;
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
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
                            {client.name}
                        </h1>
                        <p style={{ color: theme.colors.textSecondary }}>Client Details</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => navigate(buildHref(`/clients/${id}/edit`))}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Client Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Contact Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                        Email
                                    </p>
                                    <a
                                        href={`mailto:${client.email}`}
                                        className="text-base hover:underline"
                                        style={{ color: theme.colors.primary }}
                                    >
                                        {client.email}
                                    </a>
                                </div>
                            </div>
                            {client.phone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                            Phone
                                        </p>
                                        <a
                                            href={`tel:${client.phone}`}
                                            className="text-base hover:underline"
                                            style={{ color: theme.colors.primary }}
                                        >
                                            {client.phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {client.company && (
                                <div className="flex items-start gap-3">
                                    <Building className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                            Company
                                        </p>
                                        <p className="text-base" style={{ color: theme.colors.text }}>
                                            {client.company}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {(client.address || client.city || client.state || client.country) && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 mt-0.5" style={{ color: theme.colors.textSecondary }} />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                                            Address
                                        </p>
                                        <p className="text-base" style={{ color: theme.colors.text }}>
                                            {[client.address, client.city, client.state, client.zipCode, client.country]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {client.notes && (
                        <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                                Notes
                            </h2>
                            <p className="whitespace-pre-wrap" style={{ color: theme.colors.textSecondary }}>
                                {client.notes}
                            </p>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Details
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Created By
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {client.createdBy
                                        ? `${client.createdBy.firstName} ${client.createdBy.lastName}`
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Assigned To
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {client.assignedTo
                                        ? `${client.assignedTo.firstName} ${client.assignedTo.lastName}`
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Created At
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {new Date(client.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                                    Last Updated
                                </p>
                                <p style={{ color: theme.colors.text }}>
                                    {new Date(client.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
                            Quick Actions
                        </h2>
                        <div className="space-y-2">
                            <Link to={buildHref(`/invoices/new?clientId=${client.id}`)} className="block">
                                <Button variant="secondary" className="w-full">
                                    Create Invoice
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
