import React from 'react';

export default function DashboardPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Mero Accounting Dashboard</h1>
            <p>Financial overview and management.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Cash Flow</h2>
                    <p className="text-3xl font-bold text-green-600">$0.00</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Invoices</h2>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Expenses</h2>
                    <p className="text-3xl font-bold text-red-600">$0.00</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Net Profit</h2>
                    <p className="text-3xl font-bold">$0.00</p>
                </div>
            </div>
        </div>
    );
}
