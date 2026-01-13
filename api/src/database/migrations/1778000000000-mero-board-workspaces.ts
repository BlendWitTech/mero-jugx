import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMeroBoardWorkspaces1778000000000 implements MigrationInterface {
  name = 'CreateMeroBoardWorkspaces1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create mero_board_workspaces table
    await queryRunner.createTable(
      new Table({
        name: 'mero_board_workspaces',
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
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'owner_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'sort_order',
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
    );

    // Create indexes
    await queryRunner.createIndex(
      'mero_board_workspaces',
      new TableIndex({
        name: 'IDX_mero_board_workspaces_organization_id',
        columnNames: ['organization_id'],
      }),
    );

    await queryRunner.createIndex(
      'mero_board_workspaces',
      new TableIndex({
        name: 'IDX_mero_board_workspaces_created_by',
        columnNames: ['created_by'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'mero_board_workspaces',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'mero_board_workspaces',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'mero_board_workspaces',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create mero_board_workspace_members table
    await queryRunner.createTable(
      new Table({
        name: 'mero_board_workspace_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workspace_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['owner', 'admin', 'member'],
            default: "'member'",
          },
          {
            name: 'invited_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'joined_at',
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
    );

    // Create unique constraint for workspace_id + user_id
    await queryRunner.createIndex(
      'mero_board_workspace_members',
      new TableIndex({
        name: 'IDX_mero_board_workspace_members_unique',
        columnNames: ['workspace_id', 'user_id'],
        isUnique: true,
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'mero_board_workspace_members',
      new TableIndex({
        name: 'IDX_mero_board_workspace_members_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );

    await queryRunner.createIndex(
      'mero_board_workspace_members',
      new TableIndex({
        name: 'IDX_mero_board_workspace_members_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'mero_board_workspace_members',
      new TableIndex({
        name: 'IDX_mero_board_workspace_members_role',
        columnNames: ['role'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'mero_board_workspace_members',
      new TableForeignKey({
        columnNames: ['workspace_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mero_board_workspaces',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'mero_board_workspace_members',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'mero_board_workspace_members',
      new TableForeignKey({
        columnNames: ['invited_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Add workspace_id to projects table (nullable, for mero-board app)
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN IF NOT EXISTS "workspace_id" uuid;
    `);

    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['workspace_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mero_board_workspaces',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove workspace_id from projects
    await queryRunner.query(`
      ALTER TABLE "projects" 
      DROP CONSTRAINT IF EXISTS "FK_projects_workspace_id";
      DROP INDEX IF EXISTS "IDX_projects_workspace_id";
      DROP COLUMN IF EXISTS "workspace_id";
    `);

    // Drop workspace_members table
    await queryRunner.dropTable('mero_board_workspace_members', true);

    // Drop workspaces table
    await queryRunner.dropTable('mero_board_workspaces', true);
  }
}

