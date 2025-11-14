CREATE TABLE "maintenance" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"title" text NOT NULL,
	"technician_id" text,
	"date" timestamp NOT NULL,
	"notes" text,
	"status" "maintenance_item_status" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "maintenance_entry" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "maintenance_entry" CASCADE;--> statement-breakpoint
ALTER TABLE "checklist_item" DROP CONSTRAINT "checklist_item_maintenance_entry_id_maintenance_entry_id_fk";
--> statement-breakpoint
ALTER TABLE "checklist_item" ADD COLUMN "maintenance_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_technician_id_user_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item" ADD CONSTRAINT "checklist_item_maintenance_id_maintenance_id_fk" FOREIGN KEY ("maintenance_id") REFERENCES "public"."maintenance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item" DROP COLUMN "maintenance_entry_id";