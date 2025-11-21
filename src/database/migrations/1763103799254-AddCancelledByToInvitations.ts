import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCancelledByToInvitations1763103799254 implements MigrationInterface {
  name = 'AddCancelledByToInvitations1763103799254';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add cancelled_by column
    await queryRunner.addColumn(
      'invitations',
      new TableColumn({
        name: 'cancelled_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'invitations',
      new TableForeignKey({
        columnNames: ['cancelled_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get the foreign key constraint name
    const table = await queryRunner.getTable('invitations');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('cancelled_by') !== -1,
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('invitations', foreignKey);
    }

    // Drop the column
    await queryRunner.dropColumn('invitations', 'cancelled_by');
  }
}

