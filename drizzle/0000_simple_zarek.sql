CREATE TYPE "public"."device_type" AS ENUM('SERVER', 'CLIENT', 'SWITCH', 'STORAGE', 'ROUTER', 'FIREWALL');--> statement-breakpoint
CREATE TYPE "public"."hardware_type" AS ENUM('PHYSICAL', 'VIRTUAL', 'CLOUD');--> statement-breakpoint
CREATE TYPE "public"."maintenance_item_status" AS ENUM('OK', 'Error', 'InProgress', 'NotApplicable');--> statement-breakpoint
CREATE TYPE "public"."operating_system" AS ENUM('WIN_SVR_2012_R2', 'WIN_SVR_2016', 'WIN_SVR_2019', 'WIN_SVR_2022', 'DEBIAN_10', 'DEBIAN_11', 'DEBIAN_12', 'CENTOS_7', 'CENTOS_8', 'CENTOS_9', 'UBUNTU_18', 'UBUNTU_20', 'UBUNTU_22', 'AMAZON_LINUX_2', 'AMAZON_LINUX_2023', 'OTHER_OS');--> statement-breakpoint
CREATE TYPE "public"."server_application_type" AS ENUM('EXCHANGE', 'SQL', 'FILE', 'DOMAIN', 'BACKUP', 'RDS', 'APPLICATION', 'OTHER', 'NONE');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_item" (
	"id" text PRIMARY KEY NOT NULL,
	"maintenance_entry_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "maintenance_item_status" NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_person" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"postal_code" text,
	"country" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"category" text,
	"billing_code" text,
	"service_manager" text,
	"abbreviation" text NOT NULL,
	"business_email" text,
	"business_phone" text,
	"website" text,
	CONSTRAINT "customer_abbreviation_unique" UNIQUE("abbreviation")
);
--> statement-breakpoint
CREATE TABLE "maintenance_entry" (
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
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "system" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"hostname" text NOT NULL,
	"ip_address" text,
	"description" text,
	"open_api_definition" text,
	"hardware_type" "hardware_type" NOT NULL,
	"operating_system" "operating_system" NOT NULL,
	"device_type" "device_type" NOT NULL,
	"server_application_type" "server_application_type",
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item" ADD CONSTRAINT "checklist_item_maintenance_entry_id_maintenance_entry_id_fk" FOREIGN KEY ("maintenance_entry_id") REFERENCES "public"."maintenance_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_person" ADD CONSTRAINT "contact_person_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_entry" ADD CONSTRAINT "maintenance_entry_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_entry" ADD CONSTRAINT "maintenance_entry_technician_id_user_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system" ADD CONSTRAINT "system_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;