import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToCommunication1820000000000 implements MigrationInterface {
    name = 'AddOrganizationIdToCommunication1820000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add organization_id to messages (from chats)
        await queryRunner.query(`
            ALTER TABLE "messages" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "messages" m
            SET organization_id = c.organization_id
            FROM "chats" c
            WHERE m.chat_id = c.id
        `);

        await queryRunner.query(`
            ALTER TABLE "messages" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "messages" 
            ADD CONSTRAINT "FK_messages_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_organization_id" 
            ON "messages"("organization_id")
        `);

        // 2. Add organization_id to message_attachments (from messages)
        await queryRunner.query(`
            ALTER TABLE "message_attachments" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "message_attachments" ma
            SET organization_id = m.organization_id
            FROM "messages" m
            WHERE ma.message_id = m.id
        `);

        await queryRunner.query(`
            ALTER TABLE "message_attachments" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "message_attachments" 
            ADD CONSTRAINT "FK_message_attachments_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_message_attachments_organization_id" 
            ON "message_attachments"("organization_id")
        `);

        // 3. Add organization_id to message_reactions (from messages)
        await queryRunner.query(`
            ALTER TABLE "message_reactions" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "message_reactions" mr
            SET organization_id = m.organization_id
            FROM "messages" m
            WHERE mr.message_id = m.id
        `);

        await queryRunner.query(`
            ALTER TABLE "message_reactions" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "message_reactions" 
            ADD CONSTRAINT "FK_message_reactions_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_message_reactions_organization_id" 
            ON "message_reactions"("organization_id")
        `);

        // 4. Add organization_id to message_read_status (from messages)
        await queryRunner.query(`
            ALTER TABLE "message_read_status" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "message_read_status" mrs
            SET organization_id = m.organization_id
            FROM "messages" m
            WHERE mrs.message_id = m.id
        `);

        await queryRunner.query(`
            ALTER TABLE "message_read_status" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "message_read_status" 
            ADD CONSTRAINT "FK_message_read_status_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_message_read_status_organization_id" 
            ON "message_read_status"("organization_id")
        `);

        // 5. Add organization_id to chat_members (from chats)
        await queryRunner.query(`
            ALTER TABLE "chat_members" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "chat_members" cm
            SET organization_id = c.organization_id
            FROM "chats" c
            WHERE cm.chat_id = c.id
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_members" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_members" 
            ADD CONSTRAINT "FK_chat_members_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_chat_members_organization_id" 
            ON "chat_members"("organization_id")
        `);

        // 6. Add organization_id to call_sessions (from chats)
        await queryRunner.query(`
            ALTER TABLE "call_sessions" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "call_sessions" cs
            SET organization_id = c.organization_id
            FROM "chats" c
            WHERE cs.chat_id = c.id
        `);

        await queryRunner.query(`
            ALTER TABLE "call_sessions" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "call_sessions" 
            ADD CONSTRAINT "FK_call_sessions_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_call_sessions_organization_id" 
            ON "call_sessions"("organization_id")
        `);

        // 7. Add organization_id to call_participants (from call_sessions)
        await queryRunner.query(`
            ALTER TABLE "call_participants" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "call_participants" cp
            SET organization_id = cs.organization_id
            FROM "call_sessions" cs
            WHERE cp.call_session_id = cs.id
        `);

        await queryRunner.query(`
            ALTER TABLE "call_participants" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "call_participants" 
            ADD CONSTRAINT "FK_call_participants_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_call_participants_organization_id" 
            ON "call_participants"("organization_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse order - drop child tables first
        await queryRunner.query(`DROP INDEX "IDX_call_participants_organization_id"`);
        await queryRunner.query(`ALTER TABLE "call_participants" DROP CONSTRAINT "FK_call_participants_organization"`);
        await queryRunner.query(`ALTER TABLE "call_participants" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_call_sessions_organization_id"`);
        await queryRunner.query(`ALTER TABLE "call_sessions" DROP CONSTRAINT "FK_call_sessions_organization"`);
        await queryRunner.query(`ALTER TABLE "call_sessions" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_chat_members_organization_id"`);
        await queryRunner.query(`ALTER TABLE "chat_members" DROP CONSTRAINT "FK_chat_members_organization"`);
        await queryRunner.query(`ALTER TABLE "chat_members" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_message_read_status_organization_id"`);
        await queryRunner.query(`ALTER TABLE "message_read_status" DROP CONSTRAINT "FK_message_read_status_organization"`);
        await queryRunner.query(`ALTER TABLE "message_read_status" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_message_reactions_organization_id"`);
        await queryRunner.query(`ALTER TABLE "message_reactions" DROP CONSTRAINT "FK_message_reactions_organization"`);
        await queryRunner.query(`ALTER TABLE "message_reactions" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_message_attachments_organization_id"`);
        await queryRunner.query(`ALTER TABLE "message_attachments" DROP CONSTRAINT "FK_message_attachments_organization"`);
        await queryRunner.query(`ALTER TABLE "message_attachments" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_messages_organization_id"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_organization"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "organization_id"`);
    }
}
