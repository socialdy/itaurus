ALTER TABLE "verification_token" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "verification_token" CASCADE;--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_provider_provider_account_id_unique";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_session_token_unique";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "provider_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "access_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "expires_at";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "token_type";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "session_state";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "session_token";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "expires";--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_token_unique" UNIQUE("token");