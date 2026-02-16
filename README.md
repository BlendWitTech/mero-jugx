# Mero Jugx - Nepal's Complete Business Operating System 🇳🇵

> **नेपाली व्यापारको लागि पूर्ण डिजिटल समाधान** | The all-in-one ERP platform built specifically for Nepali businesses

Mero Jugx is a **multi-tenant ERP platform** designed from the ground up for Nepal's business environment. Unlike generic international ERPs, we handle Nepal's unique requirements: SSF (Social Security Fund) compliance, Nepal Labour Act 2074, VAT 13%, eSewa/Khalti payments, and Nepali fiscal year (Shrawan-Ashadh).

---

## 🎯 Why Mero Jugx?

**Built for Nepal, by understanding Nepal:**
- ✅ **SSF Compliance**: Automatic 11% employee + 20% employer contribution calculation
- ✅ **Nepal Labour Act 2074**: Pre-configured leave types (Casual 12 days, Sick 12 days, Maternity 98 days, Puja leave)
- ✅ **Local Payments**: Native eSewa and Khalti integration for subscriptions and invoicing
- ✅ **VAT 13%**: IRD-compliant invoice generation with proper tax calculations
- ✅ **Multi-Branch**: Support for businesses with multiple locations (Kathmandu HQ + Pokhara branch)
- ✅ **Nepali Fiscal Year**: Shrawan 1 to Ashadh 31 accounting periods
- ✅ **Multi-Tenant**: Complete data isolation - each organization sees only their data

---

## 🏢 Core Modules

### 1. **Organization Hub** (Multi-Tenant Foundation)
Every business gets their own isolated workspace with:
- Organization profile (PAN/VAT, fiscal year, currency NPR)
- Multi-branch management (HQ + regional offices)
- Dynamic role-based access control (not just Admin/User)
- Organization branding (logo, colors, custom CSS/JS)
- **Data Isolation**: `organization_id` on every table ensures complete privacy

### 2. **HR & Payroll** (Nepal-Specific)
The most comprehensive HR solution for Nepal:
- **Employee Management**: Citizenship, PAN, bank account, document storage
- **Attendance**: Manual entry + biometric device integration
- **Leave Management**: All Nepal Labour Act 2074 leave types pre-configured
- **Payroll Engine**:
  - SSF: Employee 11% + Employer 20% auto-calculation
  - CIT (Corporate Income Tax) and TDS (Tax Deducted at Source) slabs
  - Bank payment files (NIC Asia, NABIL, HBL formats)
- **Compliance Documents**:
  - Payslips in Nepali format
  - SSF challan PDFs
  - TDS certificates

### 3. **CRM & Sales**
Manage your customer relationships and sales pipeline:
- **Lead Management**: Track prospects from first contact to conversion
- **Deal Pipeline**: Kanban-style deal tracking with stages
- **Client Database**: Complete customer profiles with contact history
- **Quotations**: Professional quote generation with VAT
- **Invoicing**: IRD-compliant invoices with VAT 13%
- **Payment Tracking**: Record payments against invoices

### 4. **Inventory Management**
Multi-warehouse inventory control:
- **Product Catalog**: SKU, barcode, pricing, stock levels
- **Warehouse Management**: Multiple locations, stock transfers
- **Stock Adjustments**: Track inventory movements
- **Purchase Orders**: Supplier management and ordering
- **Reports**: Stock valuation, movement history, low stock alerts

### 5. **Accounting & Finance**
Nepal Chart of Accounts compliant:
- **General Ledger**: Double-entry bookkeeping
- **Accounts Payable/Receivable**: Track what you owe and are owed
- **Bank Reconciliation**: Match transactions with bank statements
- **Financial Reports**: Balance Sheet, P&L, Cash Flow
- **VAT Returns**: Generate VAT reports for IRD filing

### 6. **Project Management**
Kanban-style project tracking:
- **Boards**: Organize work into projects
- **Tasks**: Assign, track, and complete work items
- **Time Tracking**: Log hours against tasks
- **Collaboration**: Comments, attachments, mentions

---

## 💳 Payment Integration

### eSewa (Nepal's #1 Digital Wallet)
- Subscription payments for SaaS billing
- Customer invoice payments
- Automatic payment verification
- Refund processing

### Khalti
- Alternative payment gateway
- Server-side verification
- Webhook support for real-time updates

---

## 🛠️ Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Backend** | NestJS (Node v18) | Modular architecture, TypeScript safety |
| **Frontend** | React 18 + Vite | Fast development, modern UI |
| **Database** | PostgreSQL 15 | ACID compliance, JSON support, proven reliability |
| **ORM** | TypeORM | Type-safe queries, migration management |
| **Real-time** | Socket.io | Live chat, notifications |
| **Queue** | BullMQ (Redis) | Async job processing (payroll, emails) |
| **Multi-Tenancy** | Row-Level Security | `organization_id` on every table |

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- Docker Desktop (recommended) or PostgreSQL 15 + Redis

### 1. Clone and Setup
```bash
git clone https://github.com/BlendWitTech/mero-jugx.git
cd mero-jugx
npm run setup  # Interactive setup wizard
```

### 2. Initialize Database
```bash
npm run db:init  # Creates schema, runs migrations, seeds data
```

### 3. Start Development Server
```bash
npm start  # Interactive launcher
# Select: Development → Full Stack
```

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api

---

## 📂 Project Structure

```
mero-jugx/
├── api/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/          # JWT, 2FA, sessions
│   │   ├── organizations/ # Multi-tenant org management
│   │   ├── hr/            # HR & Payroll (Nepal-specific)
│   │   ├── crm/           # CRM & Sales
│   │   ├── inventory/     # Inventory management
│   │   ├── accounting/    # Finance & accounting
│   │   ├── database/      # Entities, migrations, seeds
│   │   └── ...
│   └── marketplace/       # Modular apps (CRM, Inventory, etc.)
├── app/                   # React Frontend
│   ├── src/
│   │   ├── pages/        # Route components
│   │   ├── components/   # UI components
│   │   └── store/        # State management
│   └── marketplace/      # App-specific frontends
├── scripts/              # Automation scripts
└── docker-compose.yml    # PostgreSQL + Redis
```

---

## 🇳🇵 Nepal-Specific Features

### SSF (Social Security Fund) Compliance
- Automatic contribution calculation (Employee 11%, Employer 20%)
- SSF challan generation
- Monthly SSF reports

### Nepal Labour Act 2074
- Pre-configured leave types with correct entitlements
- Maternity leave (98 days paid)
- Puja leave calculations
- Festival bonus calculations

### IRD (Inland Revenue Department) Compliance
- VAT 13% invoice generation
- TDS certificate generation
- VAT return reports
- PAN/VAT validation

### Nepali Fiscal Year
- Shrawan 1 to Ashadh 31 accounting periods
- Nepali date support (BS - Bikram Sambat)
- Festival calendar integration

---

## 📖 Documentation

- [**Setup Guide**](SETUP.md) - Detailed installation & troubleshooting
- [**Architecture**](ARCHITECTURE.md) - System design & multi-tenancy
- [**Database Schema**](DATABASE.md) - Complete schema reference
- [**Scripts Reference**](SCRIPTS.md) - CLI tools & commands
- [**Deployment**](DEPLOYMENT.md) - Production deployment guide
- [**Payment Integration**](PAYMENT.md) - eSewa & Khalti setup

---

## 🚀 Roadmap

### Phase 1: Foundation (Current)
- [x] Multi-tenant architecture
- [x] Organization management
- [x] Role-based access control
- [x] App-specific permissions
- [ ] Multi-branch support

### Phase 2: Payments & Billing
- [ ] eSewa integration (API v2)
- [ ] Khalti integration
- [ ] Subscription management
- [ ] VAT invoice generation

### Phase 3: HR & Payroll
- [ ] Employee management
- [ ] Attendance tracking
- [ ] Leave management (Nepal Labour Act)
- [ ] Payroll engine (SSF, CIT, TDS)
- [ ] Bank payment files
- [ ] Compliance documents

### Phase 4: Business Modules
- [x] CRM & Sales
- [x] Inventory Management
- [ ] Accounting & Finance
- [ ] Project Management

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

---

## 📄 License

Copyright © 2024 BlendWit Tech. All rights reserved.

---

## 🆘 Support

- **Email**: support@blendwit.com
- **Documentation**: [docs.merojugx.com](https://docs.merojugx.com)
- **Issues**: [GitHub Issues](https://github.com/BlendWitTech/mero-jugx/issues)

---

**Built with ❤️ in Nepal, for Nepal**
