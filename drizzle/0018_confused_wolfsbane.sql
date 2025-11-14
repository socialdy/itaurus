ALTER TABLE "contact_person" ADD COLUMN "freshservice_id" text;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "freshservice_id" text;--> statement-breakpoint
ALTER TABLE "system" ADD COLUMN "freshservice_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "freshservice_id" text;