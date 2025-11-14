CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_token_unique";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "provider" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "token_type" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "session_state" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "session_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "expires" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "provider_id";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "access_token_expires_at";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "refresh_token_expires_at";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "expires_at";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "ip_address";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "user_agent";--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_provider_account_id_unique" UNIQUE("provider","provider_account_id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_session_token_unique" UNIQUE("session_token");