CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "software" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "technician" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "software" CASCADE;--> statement-breakpoint
DROP TABLE "technician" CASCADE;--> statement-breakpoint
ALTER TABLE "system" ALTER COLUMN "installed_software" SET DEFAULT '{}';