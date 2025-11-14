import { z } from "zod";


export const userSchema = z.object({
  name: z.string().min(3),
  // Die folgenden Felder wurden entfernt, da sie auf der AccountPage nicht verwendet werden.
  // dateOfBirth: z.date().optional().nullable(),
  // gender: z.enum(["male", "female", "other"]).optional(),
  // height: z.number().optional().nullable(),
  // heightUnit: z.enum(["cm", "in"]).optional().nullable(),
  // weight: z.number().optional().nullable(),
  // weightUnit: z.enum(["kg", "lb"]).optional().nullable(),
  // allergies: z.string().optional().nullable(),
});