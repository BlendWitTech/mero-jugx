import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AppInvitationExternalSupport1808000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add email to app_invitations table
        await queryRunner.addColumn('app_invitations', new TableColumn({
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
        }));

        // Make user_id and member_id nullable in app_invitations
        await queryRunner.query('ALTER TABLE "app_invitations" ALTER COLUMN "user_id" DROP NOT NULL');
        await queryRunner.query('ALTER TABLE "app_invitations" ALTER COLUMN "member_id" DROP NOT NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert user_id and member_id to not null (caution: may fail if there are nulls)
        await queryRunner.query('ALTER TABLE "app_invitations" ALTER COLUMN "user_id" SET NOT NULL');
        await queryRunner.query('ALTER TABLE "app_invitations" ALTER COLUMN "member_id" SET NOT NULL');

        // Remove email from app_invitations table
        await queryRunner.dropColumn('app_invitations', 'email');
    }
}
