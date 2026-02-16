import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToBoards1821000000000 implements MigrationInterface {
    name = 'AddOrganizationIdToBoards1821000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add organization_id to board_columns (from boards)
        await queryRunner.query(`
            ALTER TABLE "board_columns" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "board_columns" bc
            SET organization_id = b.organization_id
            FROM "boards" b
            WHERE bc.board_id = b.id
        `);

        await queryRunner.query(`
            ALTER TABLE "board_columns" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "board_columns" 
            ADD CONSTRAINT "FK_board_columns_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_board_columns_organization_id" 
            ON "board_columns"("organization_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_board_columns_organization_id"`);
        await queryRunner.query(`ALTER TABLE "board_columns" DROP CONSTRAINT "FK_board_columns_organization"`);
        await queryRunner.query(`ALTER TABLE "board_columns" DROP COLUMN "organization_id"`);
    }
}
