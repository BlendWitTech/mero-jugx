import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageExpirationFields1732300000000 implements MigrationInterface {
  name = 'AddPackageExpirationFields1732300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add package_expires_at column
    await queryRunner.query(`
      ALTER TABLE "organizations" 
      ADD COLUMN "package_expires_at" TIMESTAMP NULL
    `);

    // Add index for package_expires_at
    await queryRunner.query(`
      CREATE INDEX "IDX_organizations_package_expires_at" 
      ON "organizations" ("package_expires_at")
    `);

    // Add package_auto_renew column
    await queryRunner.query(`
      ALTER TABLE "organizations" 
      ADD COLUMN "package_auto_renew" boolean NOT NULL DEFAULT false
    `);

    // Add has_upgraded_from_freemium column
    await queryRunner.query(`
      ALTER TABLE "organizations" 
      ADD COLUMN "has_upgraded_from_freemium" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_organizations_package_expires_at"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "organizations" 
      DROP COLUMN IF EXISTS "package_expires_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations" 
      DROP COLUMN IF EXISTS "package_auto_renew"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations" 
      DROP COLUMN IF EXISTS "has_upgraded_from_freemium"
    `);
  }
}

