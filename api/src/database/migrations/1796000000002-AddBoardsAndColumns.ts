import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddBoardsAndColumns1796000000002 implements MigrationInterface {
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
