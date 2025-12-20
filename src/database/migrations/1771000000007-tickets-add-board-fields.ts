import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardFieldsToTickets1771000000007 implements MigrationInterface {
  name = 'AddBoardFieldsToTickets1771000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD COLUMN "board_app_id" integer,
      ADD COLUMN "board_id" varchar(255),
      ADD COLUMN "board_card_id" varchar(255);
    `);

    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD CONSTRAINT "FK_tickets_board_app"
      FOREIGN KEY ("board_app_id") REFERENCES "apps"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_board_app_id" ON "tickets"("board_app_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_board_app_id"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "FK_tickets_board_app"`);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP COLUMN IF EXISTS "board_app_id",
      DROP COLUMN IF EXISTS "board_id",
      DROP COLUMN IF EXISTS "board_card_id";
    `);
  }
}

