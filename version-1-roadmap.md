# Mero Jugx Version 1 - Product Suite Completion Roadmap

## 🎯 Version 1 Product Strategy

**Five Focused Apps:**
1. **Mero CRM** - Customer & Sales Management
2. **Mero Board** - Project & Task Management  
3. **Mero Inventory** - Stock Management
4. **Mero Accounting** - Full Double-Entry Accounting
5. **Mero Khata** - Simple Digital Ledger (Nepal's Digital Khata Book)

**Launch Target:** 3 months from now

---

## 📊 Current State Analysis (Per App)

### 1. MERO CRM
**Status: 75% Complete** ✅

#### What You Have (From DATABASE.md):
✅ `crm_clients` - Customer database
✅ `crm_invoices` - Invoice generation with VAT 13%
✅ `crm_invoice_items` - Line items
✅ `crm_quotes` - Quotations/estimates
✅ `crm_payments` - Payment tracking
✅ PDF invoice generation (mentioned in README)
✅ Recurring invoices (daily/weekly/monthly/annually)

#### What's Missing for CRM (25%):
❌ **Lead Pipeline / Deal Management**
  - No `crm_leads` table
  - No `crm_deals` table
  - No pipeline/stages tracking
  
❌ **Contact Management**
  - No `crm_contacts` table (separate from clients)
  - No contact activities tracking
  
❌ **Sales Analytics**
  - No reporting/dashboard
  - No sales forecasting

#### To Complete Mero CRM:
```sql
-- Need these tables:
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  source VARCHAR(100), -- Website, Referral, Cold Call, etc.
  status VARCHAR(50), -- NEW, CONTACTED, QUALIFIED, LOST, CONVERTED
  created_at TIMESTAMP
);

CREATE TABLE crm_deals (
  id UUID PRIMARY KEY,
  organization_id UUID,
  lead_id UUID REFERENCES crm_leads(id),
  client_id UUID REFERENCES crm_clients(id),
  title VARCHAR(255),
  value DECIMAL(10,2),
  stage VARCHAR(100), -- PROSPECTING, PROPOSAL, NEGOTIATION, WON, LOST
  probability INT, -- 0-100%
  expected_close_date DATE,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP
);

CREATE TABLE crm_activities (
  id UUID PRIMARY KEY,
  organization_id UUID,
  entity_type VARCHAR(50), -- LEAD, DEAL, CLIENT
  entity_id UUID,
  type VARCHAR(50), -- CALL, EMAIL, MEETING, NOTE
  subject VARCHAR(255),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

---

### 2. MERO BOARD
**Status: 85% Complete** ✅

#### What You Have:
✅ `tickets` - Full ticket system
✅ `ticket_comments` - Discussion threads
✅ `board_app_id` - Board integration
✅ Priority levels (low, medium, high, urgent)
✅ Status tracking (open, in_progress, resolved)
✅ Time tracking (estimated_time, actual_time)
✅ `tasks` - General task system

#### What's Missing (15%):
❌ **Board Visualization**
  - No `boards` table (to organize tickets into boards)
  - No `board_columns` (custom stages like Trello)
  
❌ **Sprint Management**
  - No sprint planning
  - No burndown charts

#### To Complete Mero Board:
```sql
-- Need these tables:
CREATE TABLE boards (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(255),
  description TEXT,
  type VARCHAR(50), -- KANBAN, SCRUM, LIST
  created_at TIMESTAMP
);

CREATE TABLE board_columns (
  id UUID PRIMARY KEY,
  board_id UUID REFERENCES boards(id),
  name VARCHAR(100),
  position INT,
  color VARCHAR(20),
  created_at TIMESTAMP
);

-- Add to tickets table:
ALTER TABLE tickets ADD COLUMN board_id UUID REFERENCES boards(id);
ALTER TABLE tickets ADD COLUMN column_id UUID REFERENCES board_columns(id);
ALTER TABLE tickets ADD COLUMN position INT;
```

---

### 3. MERO INVENTORY
**Status: 0% Complete** ❌

#### What You Need:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  organization_id UUID,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  unit VARCHAR(50), -- pcs, kg, liter, box, dozen
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  barcode VARCHAR(100),
  min_stock_level DECIMAL(10,2),
  reorder_level DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE TABLE warehouses (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(255),
  location VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE stock (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  quantity DECIMAL(10,2),
  updated_at TIMESTAMP,
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY,
  organization_id UUID,
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  type VARCHAR(50), -- IN, OUT, TRANSFER, ADJUSTMENT
  quantity DECIMAL(10,2),
  reference_type VARCHAR(50), -- PURCHASE, SALE, ADJUSTMENT
  reference_id UUID,
  cost_price DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);

CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY,
  organization_id UUID,
  adjustment_number VARCHAR(100),
  warehouse_id UUID REFERENCES warehouses(id),
  reason VARCHAR(255), -- Physical Count, Damage, Theft, etc.
  status VARCHAR(50), -- DRAFT, APPROVED
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE stock_adjustment_items (
  id UUID PRIMARY KEY,
  adjustment_id UUID REFERENCES stock_adjustments(id),
  product_id UUID REFERENCES products(id),
  system_quantity DECIMAL(10,2),
  actual_quantity DECIMAL(10,2),
  difference DECIMAL(10,2),
  notes TEXT
);
```

**Core Features Needed:**
1. Product catalog management
2. Stock in/out operations
3. Multi-warehouse support
4. Stock transfers between warehouses
5. Stock adjustment (physical count)
6. Low stock alerts
7. Stock valuation reports
8. Barcode scanning support

---

### 4. MERO ACCOUNTING
**Status: 15% Complete** ⚠️

#### What You Have:
✅ `crm_invoices` - Sales invoicing
✅ VAT 13% calculation
✅ Payment tracking

#### What's Missing (85%):
```sql
-- Chart of Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  organization_id UUID,
  code VARCHAR(50),
  name VARCHAR(255),
  account_type VARCHAR(50), -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  category VARCHAR(100), -- Current Asset, Fixed Asset, etc.
  parent_id UUID REFERENCES accounts(id),
  balance DECIMAL(15,2) DEFAULT 0,
  is_system BOOLEAN DEFAULT false, -- Nepal standard accounts
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

-- Journal Entries (Core of Accounting)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  organization_id UUID,
  entry_number VARCHAR(100),
  entry_date DATE,
  narration TEXT,
  status VARCHAR(50), -- DRAFT, POSTED
  created_by UUID REFERENCES users(id),
  posted_by UUID REFERENCES users(id),
  posted_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY,
  journal_entry_id UUID REFERENCES journal_entries(id),
  account_id UUID REFERENCES accounts(id),
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  description TEXT
);

-- Bank Accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY,
  organization_id UUID,
  account_id UUID REFERENCES accounts(id), -- Link to COA
  bank_name VARCHAR(255),
  account_number VARCHAR(100),
  branch VARCHAR(255),
  account_holder VARCHAR(255),
  opening_balance DECIMAL(15,2),
  current_balance DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'NPR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY,
  bank_account_id UUID REFERENCES bank_accounts(id),
  transaction_date DATE,
  description TEXT,
  reference VARCHAR(100),
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2),
  is_reconciled BOOLEAN DEFAULT false,
  journal_entry_id UUID REFERENCES journal_entries(id),
  created_at TIMESTAMP
);

-- Vendors (for Purchase Accounting)
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(255),
  pan_number VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  payment_terms INT, -- Days
  opening_balance DECIMAL(10,2),
  created_at TIMESTAMP
);

CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY,
  organization_id UUID,
  vendor_id UUID REFERENCES vendors(id),
  invoice_number VARCHAR(100),
  invoice_date DATE,
  due_date DATE,
  subtotal DECIMAL(10,2),
  vat_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  status VARCHAR(50), -- DRAFT, POSTED, PARTIALLY_PAID, PAID
  journal_entry_id UUID REFERENCES journal_entries(id),
  created_at TIMESTAMP
);

-- Fiscal Year (Nepal BS Calendar)
CREATE TABLE fiscal_years (
  id UUID PRIMARY KEY,
  organization_id UUID,
  year VARCHAR(20), -- "2080-81"
  start_date DATE, -- 1 Shrawan
  end_date DATE, -- 32 Ashadh
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

**Core Features Needed:**
1. Nepal Chart of Accounts (pre-loaded)
2. Journal entry creation
3. Automatic journal entries from invoices/bills
4. Bank reconciliation
5. Financial Reports:
   - Trial Balance
   - Balance Sheet
   - Profit & Loss Statement
   - Cash Flow Statement
6. Accounts Receivable/Payable aging
7. Bikram Sambat (BS) date support
8. IRD report formats (VAT 15, VAT 13)

---

### 5. MERO KHATA (Digital Ledger Book)
**Status: 0% Complete** ❌

**Concept:** Simple digital version of Nepal's traditional "Khata" (ledger book) for small shops/businesses who don't need full accounting.

**Target Users:**
- Paan Pasal (small shops)
- Grocery stores
- Street vendors
- Small retailers

**What Makes it Different from Mero Accounting:**
- Super simple (no accounting knowledge needed)
- Just tracks "Udhar" (credit given to customers)
- "Deni-Leni" (who owes me, whom I owe)
- No complex accounting concepts

```sql
CREATE TABLE khata_customers (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  opening_balance DECIMAL(10,2), -- What they owed at start
  current_balance DECIMAL(10,2), -- Current udhar
  created_at TIMESTAMP
);

CREATE TABLE khata_transactions (
  id UUID PRIMARY KEY,
  organization_id UUID,
  customer_id UUID REFERENCES khata_customers(id),
  date DATE,
  type VARCHAR(50), -- SALE, PAYMENT, RETURN
  description TEXT,
  amount DECIMAL(10,2),
  running_balance DECIMAL(10,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);

-- For businesses that give udhar to customers AND take udhar from suppliers
CREATE TABLE khata_suppliers (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(255),
  phone VARCHAR(20),
  current_balance DECIMAL(10,2), -- What we owe them
  created_at TIMESTAMP
);

CREATE TABLE khata_supplier_transactions (
  id UUID PRIMARY KEY,
  organization_id UUID,
  supplier_id UUID REFERENCES khata_suppliers(id),
  date DATE,
  type VARCHAR(50), -- PURCHASE, PAYMENT
  description TEXT,
  amount DECIMAL(10,2),
  running_balance DECIMAL(10,2),
  created_at TIMESTAMP
);
```

**Core Features:**
1. Simple customer list with "Udhar" amount
2. Record sales on credit
3. Record payments received
4. SMS reminders for outstanding udhar
5. Simple reports:
   - "Kasle Kati Diuparcha" (Who owes me how much)
   - "Malai Kati Diuparcha" (How much I owe)
6. Very simple mobile interface
7. Nepali language UI

---

## 🗺️ VERSION 1 COMPLETION ROADMAP

### Phase 1: Foundation (Week 1-2) - IMMEDIATE
**Goal:** Payment integration & database completion

#### Week 1:
- [ ] **eSewa Integration** (2 days)
  - Payment initiation
  - Success/failure callbacks
  - Test with sandbox
  
- [ ] **Khalti Integration** (2 days)
  - Checkout SDK
  - Verification
  - Test with sandbox

- [ ] **Database Schema** (3 days)
  - Create all missing tables for 5 apps
  - Run migrations
  - Seed Nepal-specific data (COA, tax slabs)

#### Week 2:
- [ ] **Mero CRM - Complete** (5 days)
  - Add Leads table & CRUD
  - Add Deals pipeline
  - Activity tracking
  - Basic sales dashboard

- [ ] **Mero Board - Complete** (2 days)
  - Add Boards table
  - Add Board Columns
  - Drag-drop column updates
  - Board settings

---

### Phase 2: New Apps Build (Week 3-6)
**Goal:** Build Mero Inventory, Accounting, Khata from scratch

#### Week 3-4: Mero Inventory
- [ ] **Product Management** (3 days)
  - Product CRUD with barcode
  - Categories
  - Pricing
  
- [ ] **Warehouse & Stock** (3 days)
  - Warehouse setup
  - Stock in/out operations
  - Stock movements tracking
  
- [ ] **Stock Features** (4 days)
  - Stock transfer between warehouses
  - Stock adjustment
  - Low stock alerts
  - Stock reports

#### Week 5-6: Mero Accounting
- [ ] **Chart of Accounts** (2 days)
  - Nepal standard COA seed data
  - Account CRUD
  - Account tree view

- [ ] **Journal Entries** (3 days)
  - Manual JE creation
  - Auto JE from invoices/bills
  - Posting logic

- [ ] **Vendors & Purchases** (2 days)
  - Vendor management
  - Purchase invoice entry
  - Auto journal entries

- [ ] **Financial Reports** (3 days)
  - Trial Balance
  - Balance Sheet
  - Profit & Loss
  - Reports in BS dates

---

### Phase 3: Mero Khata (Week 7-8)
**Goal:** Simple digital ledger for small shops

#### Week 7:
- [ ] **Customer Ledger** (3 days)
  - Khata customer management
  - Transaction recording (sales, payments)
  - Running balance calculation

- [ ] **Supplier Ledger** (2 days)
  - Supplier udhar tracking
  - Payment recording

#### Week 8:
- [ ] **Reports & Features** (3 days)
  - Outstanding report
  - SMS reminders (Sparrow SMS)
  - Simple mobile UI

- [ ] **Nepali Localization** (2 days)
  - Nepali language interface
  - BS date throughout
  - Nepal currency formatting

---

### Phase 4: Polish & Testing (Week 9-10)
**Goal:** Production-ready quality

#### Week 9:
- [ ] **UI/UX Polish** (3 days)
  - Consistent design across all apps
  - Loading states
  - Error handling
  - Empty states

- [ ] **Testing** (2 days)
  - API endpoint testing
  - User flow testing
  - Edge cases

#### Week 10:
- [ ] **Documentation** (2 days)
  - User guides for each app
  - API documentation
  - Setup guides

- [ ] **Performance** (2 days)
  - Query optimization
  - Indexing
  - Caching

- [ ] **Security Audit** (1 day)
  - Permission testing
  - SQL injection tests
  - XSS protection

---

### Phase 5: Beta & Launch (Week 11-12)
**Goal:** Get real users and feedback

#### Week 11:
- [ ] **Beta Testing** (5 days)
  - 10 real businesses testing
  - Bug fixes
  - Feedback incorporation

#### Week 12:
- [ ] **Launch Preparation** (3 days)
  - Marketing materials
  - Pricing page
  - Landing pages for each app

- [ ] **LAUNCH** (Day 1 of Week 12) 🚀
  - Announce on social media
  - Email existing users
  - Press release

---

## 📦 APP MARKETPLACE STRATEGY

Your existing `apps` and `organization_apps` tables are perfect for this!

### Pricing Structure:

**Individual Apps:**
- Mero CRM: NPR 999/month
- Mero Board: NPR 799/month
- Mero Inventory: NPR 1,499/month
- Mero Accounting: NPR 1,999/month
- Mero Khata: NPR 499/month (for small shops)

**Bundles:**
- **Starter Pack** (CRM + Board): NPR 1,499/month (Save 299)
- **Business Pack** (CRM + Inventory + Accounting): NPR 3,999/month (Save 498)
- **Full Suite** (All 5 apps): NPR 4,999/month (Save 1,296)

**Free Trial:** 14 days for any app

---

## 🎯 MINIMUM VIABLE FEATURES (MVP)

For Version 1 launch, each app should have:

### Mero CRM (MVP):
- ✅ Client management
- ✅ Quotation creation
- ✅ Invoice generation (VAT 13%)
- ✅ Payment tracking
- 🆕 Lead pipeline (3 stages: New, Contacted, Converted)
- 🆕 Deal tracking
- 🆕 Basic sales dashboard

### Mero Board (MVP):
- ✅ Task/ticket creation
- ✅ Comments
- ✅ Time tracking
- 🆕 Kanban board view
- 🆕 Custom columns
- 🆕 Drag & drop

### Mero Inventory (MVP):
- 🆕 Product catalog
- 🆕 Stock in/out
- 🆕 Single warehouse
- 🆕 Current stock report
- 🆕 Low stock alerts

### Mero Accounting (MVP):
- 🆕 Chart of Accounts (Nepal standard)
- 🆕 Manual journal entries
- 🆕 Vendor management
- 🆕 Purchase invoice entry
- 🆕 Trial Balance
- 🆕 Basic P&L

### Mero Khata (MVP):
- 🆕 Customer udhar tracking
- 🆕 Transaction recording
- 🆕 Payment collection
- 🆕 Outstanding report
- 🆕 Simple Nepali UI

---

## 📋 IMMEDIATE NEXT STEPS (This Week)

### Day 1-2: Payment Integration
```bash
# Set up eSewa
1. Register for eSewa merchant account
2. Get merchant code & secret key
3. Implement payment initiation
4. Test callback handling

# Set up Khalti
1. Register for Khalti merchant
2. Get public & secret keys
3. Implement checkout flow
4. Test webhook
```

### Day 3-5: Database Schema
```bash
# Create migration files
cd api
npm run migration:create -- -n AddCRMLeadsAndDeals
npm run migration:create -- -n AddBoardsAndColumns
npm run migration:create -- -n AddInventoryTables
npm run migration:create -- -n AddAccountingTables
npm run migration:create -- -n AddKhataTables

# Run migrations
npm run migration:run
```

### Day 6-7: CRM Completion
```typescript
// api/src/crm/
// - Add leads.controller.ts
// - Add deals.controller.ts
// - Add activities.controller.ts

// app/src/pages/crm/
// - Add LeadPipeline.tsx
// - Add DealPipeline.tsx
```

---

## 🚀 SUCCESS METRICS FOR LAUNCH

### Month 1 Goals:
- [ ] 20 paying customers across all apps
- [ ] 100 free trial signups
- [ ] Average of 2 apps per customer

### Month 3 Goals:
- [ ] 100 paying customers
- [ ] NPR 200,000 MRR (Monthly Recurring Revenue)
- [ ] 80% customer retention

### Month 6 Goals:
- [ ] 500 paying customers
- [ ] NPR 1,000,000 MRR
- [ ] Expand to HR & Payroll (Version 2)

---

## 💡 TECHNICAL IMPLEMENTATION PRIORITIES

### 1. Core Utilities to Build First:
```typescript
// api/src/shared/utils/nepal/
├── bs-calendar.service.ts      // Bikram Sambat converter
├── vat-calculator.service.ts   // 13% VAT calculations
├── number-formatter.service.ts // Nepal currency format
└── nepali-text.service.ts      // Number to Nepali words
```

### 2. Shared Components for All Apps:
```typescript
// app/src/components/shared/
├── BSDatePicker.tsx            // Bikram Sambat date picker
├── NPRInput.tsx                // Currency input
├── FileUploader.tsx            // Document upload
├── DataTable.tsx               // Reusable table
└── Dashboard.tsx               // Dashboard template
```

### 3. API Structure:
```
api/src/
├── crm/                        // Mero CRM
│   ├── controllers/
│   ├── services/
│   └── entities/
├── boards/                     // Mero Board
├── inventory/                  // Mero Inventory
├── accounting/                 // Mero Accounting
├── khata/                      // Mero Khata
└── billing/                    // Payment & Subscriptions
    ├── esewa.service.ts
    └── khalti.service.ts
```

---

## 🎨 FRONTEND APP ORGANIZATION

```
app/src/
├── apps/
│   ├── crm/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   ├── board/
│   ├── inventory/
│   ├── accounting/
│   └── khata/
└── shared/
    ├── components/
    ├── hooks/
    └── utils/
```

---

## 🔑 KEY DIFFERENTIATORS FOR NEPAL MARKET

### Mero CRM:
- WhatsApp integration (Nepal's #1 messaging app)
- Nepali festival follow-up reminders
- Simple enough for non-tech users

### Mero Board:
- Nepali public holiday calendar pre-loaded
- BS date support throughout
- Mobile-first (most Nepal users on mobile)

### Mero Inventory:
- Support for Nepal units (mana, pathi, dhaar)
- Barcode for Nepali products
- Multi-language product names (English + Nepali)

### Mero Accounting:
- IRD-compliant reports
- Nepal Chart of Accounts pre-loaded
- BS fiscal year (Shrawan-Ashadh)
- Direct IRD submission (future feature)

### Mero Khata:
- Fully in Nepali
- Voice input for illiterate shop owners
- SMS reminders in Nepali
- Extremely simple UI

---

## 📞 NEXT STEPS SUMMARY

**THIS WEEK:**
1. Integrate eSewa payment gateway
2. Integrate Khalti payment gateway
3. Create all database migrations
4. Complete Mero CRM (add leads/deals)
5. Complete Mero Board (add boards/columns)

**NEXT 2 WEEKS:**
6. Build Mero Inventory (products, stock)
7. Build Mero Accounting foundation (COA, journal entries)

**WEEK 4-8:**
8. Complete Mero Accounting (reports)
9. Build Mero Khata
10. Polish all 5 apps

**WEEK 9-12:**
11. Testing & bug fixes
12. Beta program
13. LAUNCH! 🚀

You already have 40% of the platform done. With focused effort on these 5 apps, you can launch Version 1 in 12 weeks!

Would you like me to create detailed implementation code for any specific app?
