import React from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Card } from '@shared/frontend/components/ui/Card';

export default function DashboardPage() {
    const { theme } = useTheme();

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>
                        Inventory Dashboard
                    </h1>
                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>
                        Overview of your stock and movements.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Placeholder Cards */}
                <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.text }}>Total Products</h3>
                    <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>0</p>
                </Card>
                <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.text }}>Total Warehouses</h3>
                    <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>0</p>
                </Card>
                <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.text }}>Low Stock Items</h3>
                    <p className="text-3xl font-bold decoration-orange-500 underline decoration-2 underline-offset-4" style={{ color: theme.colors.text }}>0</p>
                </Card>
                <Card className="p-6" style={{ backgroundColor: theme.colors.surface }}>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.text }}>Recent Movements</h3>
                    <p className="text-3xl font-bold" style={{ color: theme.colors.text }}>0</p>
                </Card>
            </div>
        </div>
    );
}
