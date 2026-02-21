import { z } from "zod";

export const uuidSchema = z.string().uuid();

export function validate(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}
