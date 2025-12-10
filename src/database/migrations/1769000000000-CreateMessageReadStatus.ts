import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMessageReadStatus1769000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'message_read_status',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'read_at',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique constraint for message_id + user_id
    await queryRunner.createIndex(
      'message_read_status',
      new TableIndex({
        name: 'IDX_message_read_status_message_user',
        columnNames: ['message_id', 'user_id'],
        isUnique: true,
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'message_read_status',
      new TableIndex({
        name: 'IDX_message_read_status_message_id',
        columnNames: ['message_id'],
      }),
    );

    await queryRunner.createIndex(
      'message_read_status',
      new TableIndex({
        name: 'IDX_message_read_status_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'message_read_status',
      new TableIndex({
        name: 'IDX_message_read_status_read_at',
        columnNames: ['read_at'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'message_read_status',
      new TableForeignKey({
        columnNames: ['message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'messages',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'message_read_status',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('message_read_status');
  }
}

