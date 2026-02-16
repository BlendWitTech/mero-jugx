import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToAdminChat1823000000000 implements MigrationInterface {
    name = 'AddOrganizationIdToAdminChat1823000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add organization_id to admin_chat_messages (from admin_chats)
        await queryRunner.query(`
            ALTER TABLE "admin_chat_messages" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "admin_chat_messages" acm
            SET organization_id = ac.organization_id
            FROM "admin_chats" ac
            WHERE acm.chat_id = ac.id
        `);

        await queryRunner.query(`
            ALTER TABLE "admin_chat_messages" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "admin_chat_messages" 
            ADD CONSTRAINT "FK_admin_chat_messages_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_admin_chat_messages_organization_id" 
            ON "admin_chat_messages"("organization_id")
        `);

        // 2. Add organization_id to admin_chat_message_attachments (from admin_chat_messages)
        await queryRunner.query(`
            ALTER TABLE "admin_chat_message_attachments" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "admin_chat_message_attachments" acma
            SET organization_id = acm.organization_id
            FROM "admin_chat_messages" acm
            WHERE acma.message_id = acm.id
        `);

        await queryRunner.query(`
            ALTER TABLE "admin_chat_message_attachments" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "admin_chat_message_attachments" 
            ADD CONSTRAINT "FK_admin_chat_message_attachments_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_admin_chat_message_attachments_organization_id" 
            ON "admin_chat_message_attachments"("organization_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_admin_chat_message_attachments_organization_id"`);
        await queryRunner.query(`ALTER TABLE "admin_chat_message_attachments" DROP CONSTRAINT "FK_admin_chat_message_attachments_organization"`);
        await queryRunner.query(`ALTER TABLE "admin_chat_message_attachments" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_admin_chat_messages_organization_id"`);
        await queryRunner.query(`ALTER TABLE "admin_chat_messages" DROP CONSTRAINT "FK_admin_chat_messages_organization"`);
        await queryRunner.query(`ALTER TABLE "admin_chat_messages" DROP COLUMN "organization_id"`);
    }
}
