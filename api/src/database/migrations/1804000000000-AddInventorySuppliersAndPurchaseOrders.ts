import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventorySuppliersAndPurchaseOrders1804000000000 implements MigrationInterface {
    name = 'AddInventorySuppliersAndPurchaseOrders1804000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Suppliers Table
        await queryRunner.query(`CREATE TABLE "suppliers" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "organization_id" uuid NOT NULL,
            "name" character varying NOT NULL,
            "email" character varying,
            "phone" character varying,
            "address" text,
            "contact_person" character varying,
            "tax_id" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_suppliers_id" PRIMARY KEY ("id")
        )`);

        // Create Purchase Orders Table
        await queryRunner.query(`CREATE TYPE "purchase_orders_status_enum" AS ENUM ('draft', 'ordered', 'received', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "purchase_orders" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "organization_id" uuid NOT NULL,
            "number" character varying NOT NULL,
            "supplier_id" uuid NOT NULL,
            "status" "purchase_orders_status_enum" NOT NULL DEFAULT 'draft',
            "expected_date" date,
            "total_amount" numeric(12,2) NOT NULL DEFAULT '0',
            "notes" text,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_purchase_orders_id" PRIMARY KEY ("id")
        )`);

        // Create Purchase Order Items Table
        await queryRunner.query(`CREATE TABLE "purchase_order_items" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "purchase_order_id" uuid NOT NULL,
            "product_id" uuid NOT NULL,
            "quantity" numeric(10,2) NOT NULL,
            "unit_price" numeric(12,2) NOT NULL,
            "total" numeric(12,2) NOT NULL,
            CONSTRAINT "PK_purchase_order_items_id" PRIMARY KEY ("id")
        )`);

        // Add Foreign Keys

        // Suppliers -> Organization
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_suppliers_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Purchase Orders -> Organization
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_purchase_orders_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Purchase Orders -> Supplier
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_purchase_orders_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Purchase Order Items -> Purchase Order
        await queryRunner.query(`ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_purchase_order_items_purchase_order" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Purchase Order Items -> Product
        await queryRunner.query(`ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_purchase_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop FKs
        await queryRunner.query(`ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_purchase_order_items_product"`);
        await queryRunner.query(`ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_purchase_order_items_purchase_order"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_purchase_orders_supplier"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_purchase_orders_organization"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_suppliers_organization"`);

        // Drop Tables
        await queryRunner.query(`DROP TABLE "purchase_order_items"`);
        await queryRunner.query(`DROP TABLE "purchase_orders"`);
        await queryRunner.query(`DROP TYPE "purchase_orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
    }
}
