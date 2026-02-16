import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToCRM1822000000000 implements MigrationInterface {
    name = 'AddOrganizationIdToCRM1822000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists before altering
        const tableExists = await queryRunner.hasTable('crm_deal_items');
        if (!tableExists) {
            console.log('⚠️  Skipping crm_deal_items migration - table does not exist yet');
            return;
        }

        // Add organization_id to crm_deal_items (from crm_deals)
        await queryRunner.query(`
            ALTER TABLE "crm_deal_items" 
            ADD COLUMN "organization_id" uuid
        `);

        await queryRunner.query(`
            UPDATE "crm_deal_items" cdi
            SET organization_id = cd.organization_id
            FROM "crm_deals" cd
            WHERE cdi.deal_id = cd.id
        `);

        await queryRunner.query(`
            ALTER TABLE "crm_deal_items" 
            ALTER COLUMN "organization_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "crm_deal_items" 
            ADD CONSTRAINT "FK_crm_deal_items_organization" 
            FOREIGN KEY ("organization_id") 
            REFERENCES "organizations"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_crm_deal_items_organization_id" 
            ON "crm_deal_items"("organization_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_crm_deal_items_organization_id"`);
        await queryRunner.query(`ALTER TABLE "crm_deal_items" DROP CONSTRAINT "FK_crm_deal_items_organization"`);
        await queryRunner.query(`ALTER TABLE "crm_deal_items" DROP COLUMN "organization_id"`);
    }
}
