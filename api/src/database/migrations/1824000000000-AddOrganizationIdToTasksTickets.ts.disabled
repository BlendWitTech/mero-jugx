import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToTasksTickets1824000000000 implements MigrationInterface {
    name = 'AddOrganizationIdToTasksTickets1824000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add organization_id to task_attachments (from tasks)
        const taskAttachmentsExists = await queryRunner.hasTable('task_attachments');
        if (taskAttachmentsExists) {
            await queryRunner.query(`
                ALTER TABLE "task_attachments" 
                ADD COLUMN "organization_id" uuid
            `);

            await queryRunner.query(`
                UPDATE "task_attachments" ta
                SET organization_id = t.organization_id
                FROM "tasks" t
                WHERE ta.task_id = t.id
            `);

            await queryRunner.query(`
                ALTER TABLE "task_attachments" 
                ALTER COLUMN "organization_id" SET NOT NULL
            `);

            await queryRunner.query(`
                ALTER TABLE "task_attachments" 
                ADD CONSTRAINT "FK_task_attachments_organization" 
                FOREIGN KEY ("organization_id") 
                REFERENCES "organizations"("id") 
                ON DELETE CASCADE
            `);

            await queryRunner.query(`
                CREATE INDEX "IDX_task_attachments_organization_id" 
                ON "task_attachments"("organization_id")
            `);
        } else {
            console.log('⚠️  Skipping task_attachments migration - table does not exist yet');
        }

        // 2. Add organization_id to task_comments (from tasks)
        const taskCommentsExists = await queryRunner.hasTable('task_comments');
        if (taskCommentsExists) {
            await queryRunner.query(`
                ALTER TABLE "task_comments" 
                ADD COLUMN "organization_id" uuid
            `);

            await queryRunner.query(`
                UPDATE "task_comments" tc
                SET organization_id = t.organization_id
                FROM "tasks" t
                WHERE tc.task_id = t.id
            `);

            await queryRunner.query(`
                ALTER TABLE "task_comments" 
                ALTER COLUMN "organization_id" SET NOT NULL
            `);

            await queryRunner.query(`
                ALTER TABLE "task_comments" 
                ADD CONSTRAINT "FK_task_comments_organization" 
                FOREIGN KEY ("organization_id") 
                REFERENCES "organizations"("id") 
                ON DELETE CASCADE
            `);

            await queryRunner.query(`
                CREATE INDEX "IDX_task_comments_organization_id" 
                ON "task_comments"("organization_id")
            `);
        } else {
            console.log('⚠️  Skipping task_comments migration - table does not exist yet');
        }

        // 3. Add organization_id to ticket_activities (from tickets)
        const ticketActivitiesExists = await queryRunner.hasTable('ticket_activities');
        if (ticketActivitiesExists) {
            await queryRunner.query(`
                ALTER TABLE "ticket_activities" 
                ADD COLUMN "organization_id" uuid
            `);

            await queryRunner.query(`
                UPDATE "ticket_activities" ta
                SET organization_id = t.organization_id
                FROM "tickets" t
                WHERE ta.ticket_id = t.id
            `);

            await queryRunner.query(`
                ALTER TABLE "ticket_activities" 
                ALTER COLUMN "organization_id" SET NOT NULL
            `);

            await queryRunner.query(`
                ALTER TABLE "ticket_activities" 
                ADD CONSTRAINT "FK_ticket_activities_organization" 
                FOREIGN KEY ("organization_id") 
                REFERENCES "organizations"("id") 
                ON DELETE CASCADE
            `);

            await queryRunner.query(`
                CREATE INDEX "IDX_ticket_activities_organization_id" 
                ON "ticket_activities"("organization_id")
            `);
        } else {
            console.log('⚠️  Skipping ticket_activities migration - table does not exist yet');
        }

        // 4. Add organization_id to ticket_comments (from tickets)
        const ticketCommentsExists = await queryRunner.hasTable('ticket_comments');
        if (ticketCommentsExists) {
            await queryRunner.query(`
                ALTER TABLE "ticket_comments" 
                ADD COLUMN "organization_id" uuid
            `);

            await queryRunner.query(`
                UPDATE "ticket_comments" tc
                SET organization_id = t.organization_id
                FROM "tickets" t
                WHERE tc.ticket_id = t.id
            `);

            await queryRunner.query(`
                ALTER TABLE "ticket_comments" 
                ALTER COLUMN "organization_id" SET NOT NULL
            `);

            await queryRunner.query(`
                ALTER TABLE "ticket_comments" 
                ADD CONSTRAINT "FK_ticket_comments_organization" 
                FOREIGN KEY ("organization_id") 
                REFERENCES "organizations"("id") 
                ON DELETE CASCADE
            `);

            await queryRunner.query(`
                CREATE INDEX "IDX_ticket_comments_organization_id" 
                ON "ticket_comments"("organization_id")
            `);
        } else {
            console.log('⚠️  Skipping ticket_comments migration - table does not exist yet');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_ticket_comments_organization_id"`);
        await queryRunner.query(`ALTER TABLE "ticket_comments" DROP CONSTRAINT "FK_ticket_comments_organization"`);
        await queryRunner.query(`ALTER TABLE "ticket_comments" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_ticket_activities_organization_id"`);
        await queryRunner.query(`ALTER TABLE "ticket_activities" DROP CONSTRAINT "FK_ticket_activities_organization"`);
        await queryRunner.query(`ALTER TABLE "ticket_activities" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_task_comments_organization_id"`);
        await queryRunner.query(`ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_organization"`);
        await queryRunner.query(`ALTER TABLE "task_comments" DROP COLUMN "organization_id"`);

        await queryRunner.query(`DROP INDEX "IDX_task_attachments_organization_id"`);
        await queryRunner.query(`ALTER TABLE "task_attachments" DROP CONSTRAINT "FK_task_attachments_organization"`);
        await queryRunner.query(`ALTER TABLE "task_attachments" DROP COLUMN "organization_id"`);
    }
}
