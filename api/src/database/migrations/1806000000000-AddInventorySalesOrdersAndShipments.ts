import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventorySalesOrdersAndShipments1806000000000 implements MigrationInterface {
    name = 'AddInventorySalesOrdersAndShipments1806000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Sales Orders Table
        await queryRunner.query(`CREATE TABLE "sales_orders" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "order_number" character varying(50) NOT NULL,
            "organization_id" uuid NOT NULL,
            "customer_id" uuid,
            "customer_name" character varying(255),
            "customer_email" character varying(255),
            "status" character varying(50) NOT NULL DEFAULT 'DRAFT',
            "order_date" date,
            "expected_shipment_date" date,
            "total_amount" numeric(10,2) NOT NULL DEFAULT '0',
            "tax_amount" numeric(10,2) NOT NULL DEFAULT '0',
            "discount_amount" numeric(10,2) NOT NULL DEFAULT '0',
            "notes" text,
            "created_by" uuid NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_sales_orders_order_number" UNIQUE ("order_number"),
            CONSTRAINT "PK_sales_orders_id" PRIMARY KEY ("id")
        )`);

        // Create Sales Order Items Table
        await queryRunner.query(`CREATE TABLE "sales_order_items" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "sales_order_id" uuid NOT NULL,
            "product_id" uuid NOT NULL,
            "quantity" integer NOT NULL,
            "unit_price" numeric(10,2) NOT NULL,
            "total_price" numeric(10,2) NOT NULL,
            "tax_amount" numeric(10,2) NOT NULL DEFAULT '0',
            "discount_amount" numeric(10,2) NOT NULL DEFAULT '0',
            CONSTRAINT "PK_sales_order_items_id" PRIMARY KEY ("id")
        )`);

        // Create Shipments Table
        await queryRunner.query(`CREATE TABLE "shipments" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "shipment_number" character varying(50) NOT NULL,
            "sales_order_id" uuid NOT NULL,
            "status" character varying(50) NOT NULL DEFAULT 'PENDING',
            "shipped_date" date,
            "delivered_date" date,
            "carrier" character varying(100),
            "tracking_number" character varying(100),
            "shipping_address" text,
            "created_by" uuid NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_shipments_shipment_number" UNIQUE ("shipment_number"),
            CONSTRAINT "PK_shipments_id" PRIMARY KEY ("id")
        )`);

        // Create Indexes
        await queryRunner.query(`CREATE INDEX "IDX_sales_orders_organization_id" ON "sales_orders" ("organization_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_sales_orders_status" ON "sales_orders" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_sales_order_items_sales_order_id" ON "sales_order_items" ("sales_order_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_sales_order_items_product_id" ON "sales_order_items" ("product_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_shipments_sales_order_id" ON "shipments" ("sales_order_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_shipments_status" ON "shipments" ("status")`);

        // Add Foreign Keys

        // Sales Orders -> Organization
        await queryRunner.query(`ALTER TABLE "sales_orders" ADD CONSTRAINT "FK_sales_orders_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Sales Orders -> User (Creator)
        await queryRunner.query(`ALTER TABLE "sales_orders" ADD CONSTRAINT "FK_sales_orders_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Sales Order Items -> Sales Order
        await queryRunner.query(`ALTER TABLE "sales_order_items" ADD CONSTRAINT "FK_sales_order_items_sales_order" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Sales Order Items -> Product
        await queryRunner.query(`ALTER TABLE "sales_order_items" ADD CONSTRAINT "FK_sales_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Shipments -> Sales Order
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_shipments_sales_order" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Shipments -> User (Creator)
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_shipments_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop FKs
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_shipments_created_by"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_shipments_sales_order"`);
        await queryRunner.query(`ALTER TABLE "sales_order_items" DROP CONSTRAINT "FK_sales_order_items_product"`);
        await queryRunner.query(`ALTER TABLE "sales_order_items" DROP CONSTRAINT "FK_sales_order_items_sales_order"`);
        await queryRunner.query(`ALTER TABLE "sales_orders" DROP CONSTRAINT "FK_sales_orders_created_by"`);
        await queryRunner.query(`ALTER TABLE "sales_orders" DROP CONSTRAINT "FK_sales_orders_organization"`);

        // Drop Indexes
        await queryRunner.query(`DROP INDEX "IDX_shipments_status"`);
        await queryRunner.query(`DROP INDEX "IDX_shipments_sales_order_id"`);
        await queryRunner.query(`DROP INDEX "IDX_sales_order_items_product_id"`);
        await queryRunner.query(`DROP INDEX "IDX_sales_order_items_sales_order_id"`);
        await queryRunner.query(`DROP INDEX "IDX_sales_orders_status"`);
        await queryRunner.query(`DROP INDEX "IDX_sales_orders_organization_id"`);

        // Drop Tables
        await queryRunner.query(`DROP TABLE "shipments"`);
        await queryRunner.query(`DROP TABLE "sales_order_items"`);
        await queryRunner.query(`DROP TABLE "sales_orders"`);
    }
}
