# Complete Database Schema & Implementation Guide
## For Mero Jugx Version 1 - All 5 Apps

Based on your existing NestJS + TypeORM architecture

---

## 🗄️ COMPLETE DATABASE SCHEMA

### Migration Strategy

Create separate migration files for each app:

```bash
cd api
npm run migration:create -- -n AddCRMLeadsDealsActivities
npm run migration:create -- -n AddBoardsAndColumns  
npm run migration:create -- -n AddInventoryModule
npm run migration:create -- -n AddAccountingModule
npm run migration:create -- -n AddKhataModule
```

---

## 1. MERO CRM - MISSING TABLES

### Migration File: `AddCRMLeadsDealsActivities.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddCRMLeadsDealsActivities1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    
    // CRM Leads Table
    await queryRunner.createTable(
      new Table({
        name: 'crm_leads',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'company',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Website, Referral, Cold Call, Social Media, etc.',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CONVERTED', 'LOST'],
            default: "'NEW'",
          },
          {
            name: 'rating',
            type: 'enum',
            enum: ['HOT', 'WARM', 'COLD'],
            isNullable: true,
          },
          {
            name: 'assigned_to',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'converted_to_client_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'converted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'crm_leads',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'crm_leads',
      new TableForeignKey({
        columnNames: ['assigned_to'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'crm_leads',
      new TableForeignKey({
        columnNames: ['converted_to_client_id'],
        referencedTableName: 'crm_clients',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // CRM Deals Table
    await queryRunner.createTable(
      new Table({
        name: 'crm_deals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'lead_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'stage',
            type: 'enum',
            enum: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
            default: "'PROSPECTING'",
          },
          {
            name: 'probability',
            type: 'int',
            default: 0,
            comment: 'Percentage 0-100',
          },
          {
            name: 'expected_close_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'actual_close_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'assigned_to',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'lost_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'crm_deals',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'crm_deals',
      new TableForeignKey({
        columnNames: ['lead_id'],
        referencedTableName: 'crm_leads',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'crm_deals',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedTableName: 'crm_clients',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // CRM Activities Table
    await queryRunner.createTable(
      new Table({
        name: 'crm_activities',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'entity_type',
            type: 'enum',
            enum: ['LEAD', 'DEAL', 'CLIENT'],
          },
          {
            name: 'entity_id',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'WHATSAPP'],
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scheduled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'crm_activities',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'crm_activities',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('crm_activities');
    await queryRunner.dropTable('crm_deals');
    await queryRunner.dropTable('crm_leads');
  }
}
```

---

## 2. MERO BOARD - MISSING TABLES

### Migration File: `AddBoardsAndColumns.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddBoardsAndColumns1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    
    // Boards Table
    await queryRunner.createTable(
      new Table({
        name: 'boards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['KANBAN', 'SCRUM', 'LIST'],
            default: "'KANBAN'",
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'is_archived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'boards',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Board Columns Table
    await queryRunner.createTable(
      new Table({
        name: 'board_columns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'board_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'position',
            type: 'int',
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'wip_limit',
            type: 'int',
            isNullable: true,
            comment: 'Work In Progress limit',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'board_columns',
      new TableForeignKey({
        columnNames: ['board_id'],
        referencedTableName: 'boards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add columns to existing tickets table
    await queryRunner.query(`
      ALTER TABLE tickets 
      ADD COLUMN board_id UUID,
      ADD COLUMN column_id UUID,
      ADD COLUMN position INT DEFAULT 0
    `);

    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['board_id'],
        referencedTableName: 'boards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        columnNames: ['column_id'],
        referencedTableName: 'board_columns',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tickets 
      DROP COLUMN board_id,
      DROP COLUMN column_id,
      DROP COLUMN position
    `);
    await queryRunner.dropTable('board_columns');
    await queryRunner.dropTable('boards');
  }
}
```

---

## 3. MERO INVENTORY - ALL TABLES

### Migration File: `AddInventoryModule.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddInventoryModule1234567892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    
    // Products Table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'sku',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_nepali',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
            default: "'pcs'",
            comment: 'pcs, kg, liter, box, dozen, mana, pathi, etc.',
          },
          {
            name: 'cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'selling_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'barcode',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'min_stock_level',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'reorder_level',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'track_expiry',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_product_org_sku ON products(organization_id, sku) WHERE deleted_at IS NULL
    `);

    // Warehouses Table
    await queryRunner.createTable(
      new Table({
        name: 'warehouses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'warehouses',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Stock Table (Current stock levels)
    await queryRunner.createTable(
      new Table({
        name: 'stock',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'warehouse_id',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'stock',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'stock',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_stock_product_warehouse ON stock(product_id, warehouse_id)
    `);

    // Stock Movements Table (Transaction log)
    await queryRunner.createTable(
      new Table({
        name: 'stock_movements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'warehouse_id',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'],
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'PURCHASE, SALE, ADJUSTMENT, TRANSFER',
          },
          {
            name: 'reference_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Stock Adjustments Table
    await queryRunner.createTable(
      new Table({
        name: 'stock_adjustments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'adjustment_number',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'warehouse_id',
            type: 'uuid',
          },
          {
            name: 'adjustment_date',
            type: 'date',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            comment: 'Physical Count, Damage, Theft, Expiry, etc.',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['DRAFT', 'APPROVED', 'CANCELLED'],
            default: "'DRAFT'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'stock_adjustments',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'stock_adjustments',
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Stock Adjustment Items Table
    await queryRunner.createTable(
      new Table({
        name: 'stock_adjustment_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'adjustment_id',
            type: 'uuid',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'system_quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'actual_quantity',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'difference',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'stock_adjustment_items',
      new TableForeignKey({
        columnNames: ['adjustment_id'],
        referencedTableName: 'stock_adjustments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'stock_adjustment_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stock_adjustment_items');
    await queryRunner.dropTable('stock_adjustments');
    await queryRunner.dropTable('stock_movements');
    await queryRunner.dropTable('stock');
    await queryRunner.dropTable('warehouses');
    await queryRunner.dropTable('products');
  }
}
```

---

## 4. MERO ACCOUNTING - ALL TABLES

### Migration File: `AddAccountingModule.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddAccountingModule1234567893 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    
    // Chart of Accounts Table
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_nepali',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'account_type',
            type: 'enum',
            enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            comment: 'Current Asset, Fixed Asset, Current Liability, etc.',
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
            comment: 'Nepal standard accounts',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'accounts',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'accounts',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_account_org_code ON accounts(organization_id, code)
    `);

    // Journal Entries Table
    await queryRunner.createTable(
      new Table({
        name: 'journal_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'entry_number',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'entry_date',
            type: 'date',
          },
          {
            name: 'narration',
            type: 'text',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['DRAFT', 'POSTED', 'CANCELLED'],
            default: "'DRAFT'",
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'INVOICE, BILL, PAYMENT, etc.',
          },
          {
            name: 'reference_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'posted_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'posted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'journal_entries',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Journal Entry Lines Table
    await queryRunner.createTable(
      new Table({
        name: 'journal_entry_lines',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'journal_entry_id',
            type: 'uuid',
          },
          {
            name: 'account_id',
            type: 'uuid',
          },
          {
            name: 'debit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'credit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'journal_entry_lines',
      new TableForeignKey({
        columnNames: ['journal_entry_id'],
        referencedTableName: 'journal_entries',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'journal_entry_lines',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Vendors Table
    await queryRunner.createTable(
      new Table({
        name: 'vendors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'pan_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payment_terms',
            type: 'int',
            isNullable: true,
            comment: 'Payment terms in days',
          },
          {
            name: 'opening_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'vendors',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Purchase Invoices Table
    await queryRunner.createTable(
      new Table({
        name: 'purchase_invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'vendor_id',
            type: 'uuid',
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'invoice_date',
            type: 'date',
          },
          {
            name: 'due_date',
            type: 'date',
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'vat_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'paid_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['DRAFT', 'POSTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'],
            default: "'DRAFT'",
          },
          {
            name: 'journal_entry_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'purchase_invoices',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'purchase_invoices',
      new TableForeignKey({
        columnNames: ['vendor_id'],
        referencedTableName: 'vendors',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Bank Accounts Table
    await queryRunner.createTable(
      new Table({
        name: 'bank_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'account_id',
            type: 'uuid',
            comment: 'Link to Chart of Accounts',
          },
          {
            name: 'bank_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'account_number',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'branch',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'account_holder',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'opening_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'NPR'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'bank_accounts',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bank_accounts',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Fiscal Years Table
    await queryRunner.createTable(
      new Table({
        name: 'fiscal_years',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'year',
            type: 'varchar',
            length: '20',
            comment: '2080-81 (BS) or 2023-24 (AD)',
          },
          {
            name: 'start_date',
            type: 'date',
            comment: '1 Shrawan or custom start',
          },
          {
            name: 'end_date',
            type: 'date',
            comment: '32 Ashadh or custom end',
          },
          {
            name: 'is_closed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'fiscal_years',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fiscal_years');
    await queryRunner.dropTable('bank_accounts');
    await queryRunner.dropTable('purchase_invoices');
    await queryRunner.dropTable('vendors');
    await queryRunner.dropTable('journal_entry_lines');
    await queryRunner.dropTable('journal_entries');
    await queryRunner.dropTable('accounts');
  }
}
```

---

## 5. MERO KHATA - ALL TABLES

### Migration File: `AddKhataModule.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddKhataModule1234567894 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    
    // Khata Customers Table
    await queryRunner.createTable(
      new Table({
        name: 'khata_customers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_nepali',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'opening_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'What they owed at start (Udhar)',
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Current Udhar amount',
          },
          {
            name: 'credit_limit',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Maximum Udhar allowed',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'khata_customers',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Khata Transactions Table
    await queryRunner.createTable(
      new Table({
        name: 'khata_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'customer_id',
            type: 'uuid',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['SALE', 'PAYMENT', 'RETURN', 'ADJUSTMENT'],
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'running_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            comment: 'Balance after this transaction',
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'CASH, ESEWA, KHALTI, BANK',
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'khata_transactions',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'khata_transactions',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedTableName: 'khata_customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Khata Suppliers Table
    await queryRunner.createTable(
      new Table({
        name: 'khata_suppliers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_nepali',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'What we owe them',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'khata_suppliers',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Khata Supplier Transactions Table
    await queryRunner.createTable(
      new Table({
        name: 'khata_supplier_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'supplier_id',
            type: 'uuid',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['PURCHASE', 'PAYMENT', 'RETURN'],
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'running_balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'khata_supplier_transactions',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'khata_supplier_transactions',
      new TableForeignKey({
        columnNames: ['supplier_id'],
        referencedTableName: 'khata_suppliers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Khata Settings Table (for SMS reminders, etc.)
    await queryRunner.createTable(
      new Table({
        name: 'khata_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'sms_reminders_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'reminder_days',
            type: 'int',
            default: 7,
            comment: 'Send reminder after N days of unpaid udhar',
          },
          {
            name: 'reminder_message',
            type: 'text',
            isNullable: true,
            comment: 'Custom SMS template in Nepali',
          },
          {
            name: 'language',
            type: 'enum',
            enum: ['ENGLISH', 'NEPALI'],
            default: "'NEPALI'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'khata_settings',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('khata_settings');
    await queryRunner.dropTable('khata_supplier_transactions');
    await queryRunner.dropTable('khata_suppliers');
    await queryRunner.dropTable('khata_transactions');
    await queryRunner.dropTable('khata_customers');
  }
}
```

---

## 📊 NEPAL CHART OF ACCOUNTS SEED DATA

Create a seed file to populate Nepal-standard Chart of Accounts:

**File: `api/src/database/seeds/nepal-chart-of-accounts.seed.ts`**

```typescript
export const NEPAL_CHART_OF_ACCOUNTS = [
  // ASSETS
  { code: '1000', name: 'Assets', nameNepali: 'सम्पत्ति', type: 'ASSET', category: 'Main', parent: null, isSystem: true },
  
  // Current Assets
  { code: '1100', name: 'Current Assets', nameNepali: 'चालु सम्पत्ति', type: 'ASSET', category: 'Current Asset', parent: '1000', isSystem: true },
  { code: '1110', name: 'Cash', nameNepali: 'नगद', type: 'ASSET', category: 'Current Asset', parent: '1100', isSystem: true },
  { code: '1120', name: 'Bank Accounts', nameNepali: 'बैंक खाता', type: 'ASSET', category: 'Current Asset', parent: '1100', isSystem: true },
  { code: '1130', name: 'Accounts Receivable', nameNepali: 'पाउनु पर्ने रकम', type: 'ASSET', category: 'Current Asset', parent: '1100', isSystem: true },
  { code: '1140', name: 'Inventory', nameNepali: 'स्टक', type: 'ASSET', category: 'Current Asset', parent: '1100', isSystem: true },
  
  // Fixed Assets
  { code: '1200', name: 'Fixed Assets', nameNepali: 'स्थिर सम्पत्ति', type: 'ASSET', category: 'Fixed Asset', parent: '1000', isSystem: true },
  { code: '1210', name: 'Land', nameNepali: 'जग्गा', type: 'ASSET', category: 'Fixed Asset', parent: '1200', isSystem: true },
  { code: '1220', name: 'Building', nameNepali: 'भवन', type: 'ASSET', category: 'Fixed Asset', parent: '1200', isSystem: true },
  { code: '1230', name: 'Furniture & Fixtures', nameNepali: 'फर्निचर', type: 'ASSET', category: 'Fixed Asset', parent: '1200', isSystem: true },
  { code: '1240', name: 'Vehicles', nameNepali: 'गाडी', type: 'ASSET', category: 'Fixed Asset', parent: '1200', isSystem: true },
  { code: '1250', name: 'Computer & Equipment', nameNepali: 'कम्प्युटर', type: 'ASSET', category: 'Fixed Asset', parent: '1200', isSystem: true },

  // LIABILITIES
  { code: '2000', name: 'Liabilities', nameNepali: 'दायित्व', type: 'LIABILITY', category: 'Main', parent: null, isSystem: true },
  
  // Current Liabilities
  { code: '2100', name: 'Current Liabilities', nameNepali: 'चालु दायित्व', type: 'LIABILITY', category: 'Current Liability', parent: '2000', isSystem: true },
  { code: '2110', name: 'Accounts Payable', nameNepali: 'तिर्नु पर्ने रकम', type: 'LIABILITY', category: 'Current Liability', parent: '2100', isSystem: true },
  { code: '2120', name: 'VAT Payable', nameNepali: 'तिर्नु पर्ने भ्याट', type: 'LIABILITY', category: 'Current Liability', parent: '2100', isSystem: true },
  { code: '2130', name: 'TDS Payable', nameNepali: 'तिर्नु पर्ने टि.डि.एस.', type: 'LIABILITY', category: 'Current Liability', parent: '2100', isSystem: true },
  { code: '2140', name: 'SSF Payable', nameNepali: 'तिर्नु पर्ने सामाजिक सुरक्षा कोष', type: 'LIABILITY', category: 'Current Liability', parent: '2100', isSystem: true },
  { code: '2150', name: 'Salary Payable', nameNepali: 'तिर्नु पर्ने तलब', type: 'LIABILITY', category: 'Current Liability', parent: '2100', isSystem: true },

  // Long-term Liabilities
  { code: '2200', name: 'Long-term Liabilities', nameNepali: 'दीर्घकालीन दायित्व', type: 'LIABILITY', category: 'Long-term Liability', parent: '2000', isSystem: true },
  { code: '2210', name: 'Bank Loan', nameNepali: 'बैंक ऋण', type: 'LIABILITY', category: 'Long-term Liability', parent: '2200', isSystem: true },

  // EQUITY
  { code: '3000', name: 'Equity', nameNepali: 'पूँजी', type: 'EQUITY', category: 'Main', parent: null, isSystem: true },
  { code: '3100', name: 'Owner Equity', nameNepali: 'मालिक पूँजी', type: 'EQUITY', category: 'Equity', parent: '3000', isSystem: true },
  { code: '3200', name: 'Retained Earnings', nameNepali: 'संचित नाफा', type: 'EQUITY', category: 'Equity', parent: '3000', isSystem: true },

  // REVENUE
  { code: '4000', name: 'Revenue', nameNepali: 'आम्दानी', type: 'REVENUE', category: 'Main', parent: null, isSystem: true },
  { code: '4100', name: 'Sales Revenue', nameNepali: 'बिक्री आम्दानी', type: 'REVENUE', category: 'Operating Revenue', parent: '4000', isSystem: true },
  { code: '4200', name: 'Service Revenue', nameNepali: 'सेवा आम्दानी', type: 'REVENUE', category: 'Operating Revenue', parent: '4000', isSystem: true },
  { code: '4300', name: 'Other Income', nameNepali: 'अन्य आम्दानी', type: 'REVENUE', category: 'Other Revenue', parent: '4000', isSystem: true },

  // EXPENSES
  { code: '5000', name: 'Expenses', nameNepali: 'खर्च', type: 'EXPENSE', category: 'Main', parent: null, isSystem: true },
  
  // Operating Expenses
  { code: '5100', name: 'Operating Expenses', nameNepali: 'सञ्चालन खर्च', type: 'EXPENSE', category: 'Operating Expense', parent: '5000', isSystem: true },
  { code: '5110', name: 'Salary & Wages', nameNepali: 'तलब', type: 'EXPENSE', category: 'Operating Expense', parent: '5100', isSystem: true },
  { code: '5120', name: 'Rent Expense', nameNepali: 'भाडा खर्च', type: 'EXPENSE', category: 'Operating Expense', parent: '5100', isSystem: true },
  { code: '5130', name: 'Utilities', nameNepali: 'बिजुली पानी', type: 'EXPENSE', category: 'Operating Expense', parent: '5100', isSystem: true },
  { code: '5140', name: 'Office Supplies', nameNepali: 'कार्यालय सामग्री', type: 'EXPENSE', category: 'Operating Expense', parent: '5100', isSystem: true },
  { code: '5150', name: 'Phone & Internet', nameNepali: 'फोन र इन्टरनेट', type: 'EXPENSE', category: 'Operating Expense', parent: '5100', isSystem: true },
  
  // Cost of Goods Sold
  { code: '5200', name: 'Cost of Goods Sold', nameNepali: 'बिक्री लागत', type: 'EXPENSE', category: 'COGS', parent: '5000', isSystem: true },
  { code: '5210', name: 'Purchase of Goods', nameNepali: 'सामान खरिद', type: 'EXPENSE', category: 'COGS', parent: '5200', isSystem: true },
  { code: '5220', name: 'Freight In', nameNepali: 'ढुवानी खर्च', type: 'EXPENSE', category: 'COGS', parent: '5200', isSystem: true },
];
```

---

## 🚀 NEXT STEPS - EXECUTION PLAN

### This Week - Database Setup

```bash
# 1. Create all migrations
cd api
npm run migration:create -- -n AddCRMLeadsDealsActivities
npm run migration:create -- -n AddBoardsAndColumns
npm run migration:create -- -n AddInventoryModule
npm run migration:create -- -n AddAccountingModule
npm run migration:create -- -n AddKhataModule

# 2. Copy migration content from above

# 3. Run migrations
npm run migration:run

# 4. Seed Nepal Chart of Accounts
npm run seed:run
```

### Week 2 - API Development

For each module, create:
```
api/src/[module]/
├── controllers/
│   └── [entity].controller.ts
├── services/
│   └── [entity].service.ts
├── dto/
│   ├── create-[entity].dto.ts
│   └── update-[entity].dto.ts
└── [module].module.ts
```

### Week 3-4 - Frontend Development

For each app, create:
```
app/src/apps/[app]/
├── pages/
│   └── [feature]/
│       ├── List.tsx
│       ├── Create.tsx
│       ├── Edit.tsx
│       └── View.tsx
├── components/
│   └── [feature]/
│       ├── Form.tsx
│       ├── Table.tsx
│       └── Card.tsx
└── services/
    └── [entity].service.ts
```

---

This gives you the complete database foundation for all 5 apps!

Would you like me to create the actual NestJS service and controller code for any specific app?
