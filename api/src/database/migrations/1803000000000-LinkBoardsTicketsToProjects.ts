import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class LinkBoardsTicketsToProjects1803000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add project_id to boards
        await queryRunner.addColumn("boards", new TableColumn({
            name: "project_id",
            type: "uuid",
            isNullable: true,
        }));

        await queryRunner.createForeignKey("boards", new TableForeignKey({
            columnNames: ["project_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "board_projects",
            onDelete: "SET NULL",
        }));

        // Add project_id to tickets
        await queryRunner.addColumn("tickets", new TableColumn({
            name: "project_id",
            type: "uuid",
            isNullable: true,
        }));

        await queryRunner.createForeignKey("tickets", new TableForeignKey({
            columnNames: ["project_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "board_projects",
            onDelete: "SET NULL",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const boardsTable = await queryRunner.getTable("boards");
        const ticketsTable = await queryRunner.getTable("tickets");

        // Remove from tickets
        const ticketFk = ticketsTable.foreignKeys.find(fk => fk.columnNames.indexOf("project_id") !== -1);
        if (ticketFk) await queryRunner.dropForeignKey("tickets", ticketFk);
        await queryRunner.dropColumn("tickets", "project_id");

        // Remove from boards
        const boardFk = boardsTable.foreignKeys.find(fk => fk.columnNames.indexOf("project_id") !== -1);
        if (boardFk) await queryRunner.dropForeignKey("boards", boardFk);
        await queryRunner.dropColumn("boards", "project_id");
    }
}
