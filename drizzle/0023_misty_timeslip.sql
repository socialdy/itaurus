ALTER TYPE "public"."operating_system" ADD VALUE 'WIN_SVR_2025' BEFORE 'DEBIAN_10';--> statement-breakpoint
ALTER TYPE "public"."operating_system" ADD VALUE 'WIN_10' BEFORE 'DEBIAN_10';--> statement-breakpoint
ALTER TYPE "public"."operating_system" ADD VALUE 'WIN_11' BEFORE 'DEBIAN_10';--> statement-breakpoint
ALTER TYPE "public"."operating_system" ADD VALUE 'LINUX' BEFORE 'OTHER_OS';--> statement-breakpoint
ALTER TYPE "public"."operating_system" ADD VALUE 'MACOS' BEFORE 'OTHER_OS';--> statement-breakpoint
ALTER TYPE "public"."operating_system" ADD VALUE 'ESXI' BEFORE 'OTHER_OS';--> statement-breakpoint
ALTER TABLE "system" ALTER COLUMN "hardware_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."hardware_type";--> statement-breakpoint
CREATE TYPE "public"."hardware_type" AS ENUM('PHYSICAL', 'VIRTUAL');--> statement-breakpoint
ALTER TABLE "system" ALTER COLUMN "hardware_type" SET DATA TYPE "public"."hardware_type" USING "hardware_type"::"public"."hardware_type";