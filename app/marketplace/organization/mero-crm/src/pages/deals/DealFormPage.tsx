import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { dealsApi, CreateDealDto } from '../../api/deals';
import { leadsApi, Lead } from '../../api/leads';
import { Card, Button, Input } from '@shared';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from '@shared';

export default function DealFormPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [leads, setLeads] = useState<Lead[]>([]);

    const [formData, setFormData] = useState<CreateDealDto>({
        title: '',
        value: 0,
        currency: 'NPR',
        stage: 'New',
        probability: 10,
        status: 'OPEN',
        lead_id: '',
    });

    useEffect(() => {
        fetchLeads();
        if (isEditMode) {
            fetchDeal();
        }
    }, [id]);

    const fetchLeads = async () => {
        try {
            const data = await leadsApi.getLeads();
            setLeads(data);
        } catch (error) {
            console.error('Failed to fetch leads');
        }
    };

    const fetchDeal = async () => {
        try {
            setLoading(true);
            const deal = await dealsApi.getDeal(id!);
            setFormData({
                title: deal.title,
                value: deal.value,
                currency: deal.currency,
                stage: deal.stage,
                probability: deal.probability,
                status: deal.status,
                lead_id: deal.leadId,
                expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().split('T')[0] : undefined,
            });
        } catch (error: any) {
            toast.error('Failed to fetch deal details');
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
                await dealsApi.updateDeal(id!, formData);
                toast.success('Deal updated successfully');
            } else {
                await dealsApi.createDeal(formData);
                toast.success('Deal created successfully');
            }
            navigate(-1);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save deal');
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
                    {isEditMode ? 'Edit Deal' : 'Create New Deal'}
                </h1>
            </div>

            <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Deal Title *</label>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="E.g. Website Redesign Project"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Value</label>
                            <Input
                                name="value"
                                type="number"
                                value={formData.value}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Currency</label>
                            <Input
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                placeholder="NPR"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Associated Lead</label>
                            <select
                                name="lead_id"
                                value={formData.lead_id || ''}
                                onChange={handleChange}
                                className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.text,
                                }}
                            >
                                <option value="">Select a lead...</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>
                                        {lead.first_name} {lead.last_name} ({lead.company})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Expected Close Date</label>
                            <Input
                                name="expected_close_date"
                                type="date"
                                value={formData.expected_close_date || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Stage</label>
                            <Input
                                name="stage"
                                value={formData.stage}
                                onChange={handleChange}
                                placeholder="Qualification"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>Probability (%)</label>
                            <Input
                                name="probability"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.probability}
                                onChange={handleChange}
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
                                <option value="OPEN">Open</option>
                                <option value="WON">Won</option>
                                <option value="LOST">Lost</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button type="submit" variant="primary" disabled={loading}>
                            <Save className="h-5 w-5 mr-2" />
                            {loading ? 'Saving...' : 'Save Deal'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
