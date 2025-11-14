CREATE TABLE "fs_agent" (
	"id" text PRIMARY KEY NOT NULL,
	"freshservice_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"job_title" text,
	"phone" text,
	"mobile" text,
	"active" boolean DEFAULT true,
	"time_zone" text,
	"language" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "fs_agent_fsid_unique" UNIQUE("freshservice_id")
);
--> statement-breakpoint
CREATE TABLE "fs_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"freshservice_id" text NOT NULL,
	"display_id" text,
	"name" text,
	"description" text,
	"asset_type_name" text,
	"product_name" text,
	"company_freshservice_id" text,
	"department_id" text,
	"location_id" text,
	"hostname" text,
	"ip_address" text,
	"os_name" text,
	"os_version" text,
	"serial_number" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "fs_asset_fsid_unique" UNIQUE("freshservice_id")
);
--> statement-breakpoint
CREATE TABLE "fs_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"freshservice_id" text NOT NULL,
	"company_freshservice_id" text,
	"department_id" text,
	"first_name" text,
	"last_name" text,
	"primary_email" text,
	"work_phone_number" text,
	"mobile_phone_number" text,
	"address" text,
	"time_zone" text,
	"language" text,
	"vip_user" boolean DEFAULT false,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "fs_contact_fsid_unique" UNIQUE("freshservice_id")
);
