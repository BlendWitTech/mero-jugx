import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMultiBranchAndRegionalSettings1810000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add columns to packages table
        await queryRunner.addColumn(
            'packages',
            new TableColumn({
                name: 'base_branch_limit',
                type: 'int',
                default: 1,
            }),
        );

        // Add columns to organizations table
        await queryRunner.addColumns('organizations', [
            new TableColumn({
                name: 'branch_limit',
                type: 'int',
                default: 1,
            }),
            new TableColumn({
                name: 'timezone',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
            new TableColumn({
                name: 'language',
                type: 'varchar',
                length: '10',
                default: "'en'",
            }),
            new TableColumn({
                name: 'date_format',
                type: 'varchar',
                length: '20',
                default: "'YYYY-MM-DD'",
            }),
            new TableColumn({
                name: 'time_format',
                type: 'varchar',
                length: '10',
                default: "'HH:mm'",
            }),
        ]);

        // Update existing packages with their branch limits
        // Free: 1, Basic: 5, Platinum: 10, Diamond: 15
        await queryRunner.query("UPDATE packages SET base_branch_limit = 1 WHERE slug = 'freemium'");
        await queryRunner.query("UPDATE packages SET base_branch_limit = 5 WHERE slug = 'basic'");
        await queryRunner.query("UPDATE packages SET base_branch_limit = 10 WHERE slug = 'platinum'");
        await queryRunner.query("UPDATE packages SET base_branch_limit = 15 WHERE slug = 'diamond'");

        // Sync branch_limit in organizations based on their package
        await queryRunner.query(`
      UPDATE organizations 
      SET branch_limit = p.base_branch_limit 
      FROM packages p 
      WHERE organizations.package_id = p.id
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('organizations', 'time_format');
        await queryRunner.dropColumn('organizations', 'date_format');
        await queryRunner.dropColumn('organizations', 'language');
        await queryRunner.dropColumn('organizations', 'timezone');
        await queryRunner.dropColumn('organizations', 'branch_limit');
        await queryRunner.dropColumn('packages', 'base_branch_limit');
    }
}
