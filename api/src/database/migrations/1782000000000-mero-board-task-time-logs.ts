import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MeroBoardTaskTimeLogs1782000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'mero_board_task_time_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'task_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'logged_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'duration_minutes',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_billable',
            type: 'boolean',
            default: false,
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

    // Add indexes
    await queryRunner.createIndex(
      'mero_board_task_time_logs',
      new TableIndex({
        name: 'IDX_mero_board_task_time_logs_task_id',
        columnNames: ['task_id'],
      }),
    );

    await queryRunner.createIndex(
      'mero_board_task_time_logs',
      new TableIndex({
        name: 'IDX_mero_board_task_time_logs_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'mero_board_task_time_logs',
      new TableIndex({
        name: 'IDX_mero_board_task_time_logs_logged_date',
        columnNames: ['logged_date'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'mero_board_task_time_logs',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'mero_board_task_time_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('mero_board_task_time_logs');
  }
}

