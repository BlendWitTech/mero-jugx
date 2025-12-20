import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBoardsTables1772000000000 implements MigrationInterface {
  name = 'CreateBoardsTables1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create boards table
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
            isNullable: false,
          },
          {
            name: 'project_id',
            type: 'uuid',
            isNullable: true,
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
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
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
          },
        ],
      }),
      true,
    );

    // Create projects table
    await queryRunner.createTable(
      new Table({
        name: 'projects',
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
            name: 'board_id',
            type: 'uuid',
            isNullable: true,
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
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'planning'",
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
            name: 'start_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
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
          },
        ],
      }),
      true,
    );

    // Create epics table
    await queryRunner.createTable(
      new Table({
        name: 'epics',
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
            name: 'project_id',
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
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'planning'",
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'assignee_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
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
          },
        ],
      }),
      true,
    );

    // Create tasks table
    await queryRunner.createTable(
      new Table({
        name: 'tasks',
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
            name: 'project_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'epic_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ticket_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'title',
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
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'todo'",
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '50',
            default: "'medium'",
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'assignee_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'due_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'estimated_hours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'actual_hours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            default: "'{}'",
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
          },
        ],
      }),
      true,
    );

    // Create task_assignees junction table
    await queryRunner.createTable(
      new Table({
        name: 'task_assignees',
        columns: [
          {
            name: 'task_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys for boards
    await queryRunner.createForeignKey(
      'boards',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'boards',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign keys for projects
    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['board_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'boards',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign keys for epics
    await queryRunner.createForeignKey(
      'epics',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'epics',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'epics',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'epics',
      new TableForeignKey({
        columnNames: ['assignee_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign keys for tasks
    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['epic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'epics',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['ticket_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tickets',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tasks',
      new TableForeignKey({
        columnNames: ['assignee_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign keys for task_assignees
    await queryRunner.createForeignKey(
      'task_assignees',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'task_assignees',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes
    await queryRunner.createIndex('boards', new TableIndex({ columnNames: ['organization_id'] }));
    await queryRunner.createIndex('boards', new TableIndex({ columnNames: ['project_id'] }));
    await queryRunner.createIndex('boards', new TableIndex({ columnNames: ['created_by'] }));

    await queryRunner.createIndex('projects', new TableIndex({ columnNames: ['organization_id'] }));
    await queryRunner.createIndex('projects', new TableIndex({ columnNames: ['board_id'] }));
    await queryRunner.createIndex('projects', new TableIndex({ columnNames: ['created_by'] }));

    await queryRunner.createIndex('epics', new TableIndex({ columnNames: ['organization_id'] }));
    await queryRunner.createIndex('epics', new TableIndex({ columnNames: ['project_id'] }));
    await queryRunner.createIndex('epics', new TableIndex({ columnNames: ['created_by'] }));

    await queryRunner.createIndex('tasks', new TableIndex({ columnNames: ['organization_id'] }));
    await queryRunner.createIndex('tasks', new TableIndex({ columnNames: ['project_id'] }));
    await queryRunner.createIndex('tasks', new TableIndex({ columnNames: ['epic_id'] }));
    await queryRunner.createIndex('tasks', new TableIndex({ columnNames: ['assignee_id'] }));
    await queryRunner.createIndex('tasks', new TableIndex({ columnNames: ['created_by'] }));
    await queryRunner.createIndex('tasks', new TableIndex({ columnNames: ['status'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('tasks', 'IDX_tasks_status');
    await queryRunner.dropIndex('tasks', 'IDX_tasks_created_by');
    await queryRunner.dropIndex('tasks', 'IDX_tasks_assignee_id');
    await queryRunner.dropIndex('tasks', 'IDX_tasks_epic_id');
    await queryRunner.dropIndex('tasks', 'IDX_tasks_project_id');
    await queryRunner.dropIndex('tasks', 'IDX_tasks_organization_id');

    await queryRunner.dropIndex('epics', 'IDX_epics_created_by');
    await queryRunner.dropIndex('epics', 'IDX_epics_project_id');
    await queryRunner.dropIndex('epics', 'IDX_epics_organization_id');

    await queryRunner.dropIndex('projects', 'IDX_projects_created_by');
    await queryRunner.dropIndex('projects', 'IDX_projects_board_id');
    await queryRunner.dropIndex('projects', 'IDX_projects_organization_id');

    await queryRunner.dropIndex('boards', 'IDX_boards_created_by');
    await queryRunner.dropIndex('boards', 'IDX_boards_project_id');
    await queryRunner.dropIndex('boards', 'IDX_boards_organization_id');

    // Drop foreign keys
    const taskAssigneesTable = await queryRunner.getTable('task_assignees');
    if (taskAssigneesTable) {
      const foreignKeys = taskAssigneesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('task_assignees', fk);
      }
    }

    const tasksTable = await queryRunner.getTable('tasks');
    if (tasksTable) {
      const foreignKeys = tasksTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('tasks', fk);
      }
    }

    const epicsTable = await queryRunner.getTable('epics');
    if (epicsTable) {
      const foreignKeys = epicsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('epics', fk);
      }
    }

    const projectsTable = await queryRunner.getTable('projects');
    if (projectsTable) {
      const foreignKeys = projectsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('projects', fk);
      }
    }

    const boardsTable = await queryRunner.getTable('boards');
    if (boardsTable) {
      const foreignKeys = boardsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('boards', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('task_assignees', true);
    await queryRunner.dropTable('tasks', true);
    await queryRunner.dropTable('epics', true);
    await queryRunner.dropTable('projects', true);
    await queryRunner.dropTable('boards', true);
  }
}

