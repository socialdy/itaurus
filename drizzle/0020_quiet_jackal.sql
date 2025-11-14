CREATE TABLE "fs_company" (
	"id" text PRIMARY KEY NOT NULL,
	"freshservice_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"zip" text,
	"country" text,
	"email" text,
	"phone" text,
	"website" text,
	"industry" text,
	"account_tier" text,
	"sla_tier" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "fs_company_fsid_unique" UNIQUE("freshservice_id")
);
