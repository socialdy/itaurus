ALTER TABLE "maintenance" RENAME COLUMN "technician_id" TO "technician_ids";--> statement-breakpoint
ALTER TABLE "maintenance" DROP CONSTRAINT "maintenance_technician_id_user_id_fk";
