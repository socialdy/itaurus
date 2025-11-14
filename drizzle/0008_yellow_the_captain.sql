ALTER TABLE "customer" ADD COLUMN "customer_instructions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "maintenance" DROP COLUMN "instructions";