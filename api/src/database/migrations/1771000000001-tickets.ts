import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTicketsTables1771000000001 implements MigrationInterface {
  name = 'CreateTicketsTables1771000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_status_enum" AS ENUM('open', 'in_progress', 'resolved', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_source_enum" AS ENUM('regular', 'chat_flag', 'admin_chat')`,
    );

    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "assignee_id" uuid,
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" "public"."tickets_status_enum" NOT NULL DEFAULT 'open',
        "priority" "public"."tickets_priority_enum" NOT NULL DEFAULT 'medium',
        "source" "public"."tickets_source_enum" NOT NULL DEFAULT 'regular',
        "chat_id" uuid,
        "message_id" uuid,
        "tags" text array NOT NULL DEFAULT '{}'::text[],
        "attachment_urls" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tickets_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_tickets_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_tickets_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tickets_chat" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_tickets_message" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_tickets_org" ON "tickets" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_status" ON "tickets" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_priority" ON "tickets" ("priority")`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_assignee" ON "tickets" ("assignee_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_created_by" ON "tickets" ("created_by")`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_chat" ON "tickets" ("chat_id")`);

    await queryRunner.query(`
      CREATE TABLE "ticket_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "body" text NOT NULL,
        "attachment_urls" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_comments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticket_comments_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_ticket_comments_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_ticket_comments_ticket" ON "ticket_comments" ("ticket_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_ticket_comments_author" ON "ticket_comments" ("author_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticket_comments_author"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ticket_comments_ticket"`);
    await queryRunner.query(`DROP TABLE "ticket_comments"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_chat"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_created_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_assignee"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_org"`);
    await queryRunner.query(`DROP TABLE "tickets"`);

    await queryRunner.query(`DROP TYPE "public"."tickets_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
  }
}

