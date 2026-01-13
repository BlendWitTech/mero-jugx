import React from 'react';

export default function DashboardPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Mero Inventory Dashboard</h1>
            <p>Manage your products, warehouses, and orders.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Products</h2>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Warehouses</h2>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Stock Value</h2>
                    <p className="text-3xl font-bold">$0.00</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Pending Orders</h2>
                    <p className="text-3xl font-bold">0</p>
                </div>
            </div>
        </div>
    );
}
