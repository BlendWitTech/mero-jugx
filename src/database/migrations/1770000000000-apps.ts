import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAppMarketplace1770000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create apps table
    await queryRunner.createTable(
      new Table({
        name: 'apps',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'short_description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'icon_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'banner_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'screenshots',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'billing_period',
            type: 'enum',
            enum: ['monthly', 'yearly'],
            default: "'monthly'",
          },
          {
            name: 'trial_days',
            type: 'int',
            default: 0,
          },
          {
            name: 'features',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'permissions',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'developer_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'developer_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'developer_website',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '50',
            default: "'1.0.0'",
          },
          {
            name: 'support_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'documentation_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'archived'],
            default: "'draft'",
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'subscription_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'review_count',
            type: 'int',
            default: 0,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for apps table
    await queryRunner.createIndex(
      'apps',
      new TableIndex({
        name: 'IDX_apps_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'apps',
      new TableIndex({
        name: 'IDX_apps_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'apps',
      new TableIndex({
        name: 'IDX_apps_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'apps',
      new TableIndex({
        name: 'IDX_apps_is_featured',
        columnNames: ['is_featured'],
      }),
    );

    // Create organization_apps table
    await queryRunner.createTable(
      new Table({
        name: 'organization_apps',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'app_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['trial', 'active', 'cancelled', 'expired'],
            default: "'trial'",
          },
          {
            name: 'subscription_start',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'subscription_end',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'next_billing_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'trial_ends_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'trial_used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancellation_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'auto_renew',
            type: 'boolean',
            default: true,
          },
          {
            name: 'payment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'subscription_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'billing_period',
            type: 'enum',
            enum: ['monthly', 'yearly'],
            isNullable: false,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique constraint for organization_id + app_id
    await queryRunner.createIndex(
      'organization_apps',
      new TableIndex({
        name: 'UQ_organization_apps_org_app',
        columnNames: ['organization_id', 'app_id'],
        isUnique: true,
      }),
    );

    // Create indexes for organization_apps table
    await queryRunner.createIndex(
      'organization_apps',
      new TableIndex({
        name: 'IDX_organization_apps_organization_id',
        columnNames: ['organization_id'],
      }),
    );

    await queryRunner.createIndex(
      'organization_apps',
      new TableIndex({
        name: 'IDX_organization_apps_app_id',
        columnNames: ['app_id'],
      }),
    );

    await queryRunner.createIndex(
      'organization_apps',
      new TableIndex({
        name: 'IDX_organization_apps_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'organization_apps',
      new TableIndex({
        name: 'IDX_organization_apps_subscription_end',
        columnNames: ['subscription_end'],
      }),
    );

    await queryRunner.createIndex(
      'organization_apps',
      new TableIndex({
        name: 'IDX_organization_apps_next_billing_date',
        columnNames: ['next_billing_date'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'organization_apps',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'organization_apps',
      new TableForeignKey({
        columnNames: ['app_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'apps',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to payments (optional, check if exists)
    const paymentFkExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        INNER JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'organization_apps'
          AND kcu.column_name = 'payment_id'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      );
    `);

    if (!paymentFkExists[0].exists) {
      await queryRunner.createForeignKey(
        'organization_apps',
        new TableForeignKey({
          columnNames: ['payment_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'payments',
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const table = await queryRunner.getTable('organization_apps');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('organization_apps', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('organization_apps');
    await queryRunner.dropTable('apps');
  }
}

