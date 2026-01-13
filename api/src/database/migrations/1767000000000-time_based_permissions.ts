import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTimeBasedAndCustomPermissions1767000000000 implements MigrationInterface {
  name = 'CreateTimeBasedAndCustomPermissions1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create time_based_permissions table
    await queryRunner.createTable(
      new Table({
        name: 'time_based_permissions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'role_id',
            type: 'int',
          },
          {
            name: 'permission_id',
            type: 'int',
          },
          {
            name: 'starts_at',
            type: 'timestamp',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'granted_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reason',
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'time_based_permissions',
      new TableIndex({
        name: 'IDX_TIME_BASED_PERM_ROLE',
        columnNames: ['role_id'],
      }),
    );

    await queryRunner.createIndex(
      'time_based_permissions',
      new TableIndex({
        name: 'IDX_TIME_BASED_PERM_EXPIRES',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'time_based_permissions',
      new TableIndex({
        name: 'IDX_TIME_BASED_PERM_ACTIVE',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createForeignKey(
      'time_based_permissions',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'time_based_permissions',
      new TableForeignKey({
        columnNames: ['permission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permissions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'time_based_permissions',
      new TableForeignKey({
        columnNames: ['granted_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create custom_permissions table
    await queryRunner.createTable(
      new Table({
        name: 'custom_permissions',
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
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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
      true,
    );

    await queryRunner.createIndex(
      'custom_permissions',
      new TableIndex({
        name: 'IDX_CUSTOM_PERM_ORG',
        columnNames: ['organization_id'],
      }),
    );

    await queryRunner.createIndex(
      'custom_permissions',
      new TableIndex({
        name: 'IDX_CUSTOM_PERM_SLUG',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'custom_permissions',
      new TableIndex({
        name: 'IDX_CUSTOM_PERM_ACTIVE',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'custom_permissions',
      new TableIndex({
        name: 'IDX_CUSTOM_PERM_ORG_SLUG',
        columnNames: ['organization_id', 'slug'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'custom_permissions',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'custom_permissions',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('custom_permissions');
    await queryRunner.dropTable('time_based_permissions');
  }
}

