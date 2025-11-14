ALTER TYPE "public"."maintenance_item_status" ADD VALUE 'NotDone';--> statement-breakpoint
CREATE TABLE "software" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon_path" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "software_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "technician" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "technician_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "system" ALTER COLUMN "installed_software" DROP DEFAULT;