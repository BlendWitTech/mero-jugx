import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAppInvitations1770500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type
        await queryRunner.query(
            `CREATE TYPE "public"."app_invitations_status_enum" AS ENUM('pending', 'accepted', 'declined', 'cancelled', 'expired')`,
        );

        // Create app_invitations table
        await queryRunner.createTable(
            new Table({
                name: 'app_invitations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
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
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false, // Will be made nullable in migration 1808000000000
                    },
                    {
                        name: 'member_id',
                        type: 'uuid',
                        isNullable: false, // Will be made nullable in migration 1808000000000
                    },
                    {
                        name: 'invited_by',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'accepted', 'declined', 'cancelled', 'expired'],
                        default: "'pending'",
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'accepted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'declined_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'cancelled_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Create indexes
        await queryRunner.createIndex(
            'app_invitations',
            new TableIndex({
                name: 'IDX_app_invitations_token',
                columnNames: ['token'],
                isUnique: true,
            }),
        );

        await queryRunner.createIndex(
            'app_invitations',
            new TableIndex({
                name: 'IDX_app_invitations_org_app_user',
                columnNames: ['organization_id', 'app_id', 'user_id'],
            }),
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            'app_invitations',
            new TableForeignKey({
                columnNames: ['organization_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organizations',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'app_invitations',
            new TableForeignKey({
                columnNames: ['app_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'apps',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'app_invitations',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'app_invitations',
            new TableForeignKey({
                columnNames: ['member_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organization_members',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'app_invitations',
            new TableForeignKey({
                columnNames: ['invited_by'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('app_invitations');
        await queryRunner.query(`DROP TYPE "public"."app_invitations_status_enum"`);
    }
}
