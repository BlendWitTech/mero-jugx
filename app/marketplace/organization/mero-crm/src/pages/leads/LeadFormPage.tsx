import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { leadsApi, CreateLeadDto } from '../../api/leads';
import { Card, Button, Input } from '@shared';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@shared';

export default function LeadFormPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateLeadDto>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        status: 'NEW',
        source: '',
        estimated_value: 0,
    });

    useEffect(() => {
        if (isEditMode) {
            fetchLead();
        }
    }, [id]);

    const fetchLead = async () => {
        try {
            setLoading(true);
            const lead = await leadsApi.getLead(id!);
            setFormData({
                first_name: lead.first_name,
                last_name: lead.last_name,
                email: lead.email,
                phone: lead.phone,
                company: lead.company,
                job_title: lead.job_title,
                status: lead.status,
                source: lead.source,
                estimated_value: lead.estimated_value,
            });
        } catch (error: any) {
            toast.error('Failed to fetch lead details');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEditMode) {
                await leadsApi.updateLead(id!, formData);
                toast.success('Lead updated successfully');
            } else {
                await leadsApi.createLead(formData);
                toast.success('Lead created successfully');
            }
            navigate(-1);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save lead');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>
                    {isEditMode ? 'Edit Lead' : 'Create New Lead'}
                </h1>
            </div>

            <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>First Name *</label>
                            <Input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Last Name</label>
                            <Input
                                name="last_name"
                                value={formData.last_name || ''}
                                onChange={handleChange}
                                placeholder="Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Email</label>
                            <Input
                                name="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Phone</label>
                            <Input
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                placeholder="+977 9800000000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Company</label>
                            <Input
                                name="company"
                                value={formData.company || ''}
                                onChange={handleChange}
                                placeholder="Acme Corp"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Job Title</label>
                            <Input
                                name="job_title"
                                value={formData.job_title || ''}
                                onChange={handleChange}
                                placeholder="Manager"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                }}
                            >
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="PROPOSAL">Proposal</option>
                                <option value="NEGOTIATION">Negotiation</option>
                                <option value="WON">Won</option>
                                <option value="LOST">Lost</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Source</label>
                            <Input
                                name="source"
                                value={formData.source || ''}
                                onChange={handleChange}
                                placeholder="Web / Referral"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Estimated Value</label>
                            <Input
                                name="estimated_value"
                                type="number"
                                value={formData.estimated_value || ''}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button type="submit" variant="primary" disabled={loading}>
                            <Save className="h-5 w-5 mr-2" />
                            {loading ? 'Saving...' : 'Save Lead'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
