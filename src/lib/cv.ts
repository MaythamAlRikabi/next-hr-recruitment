import { z } from "zod";
export const cvSchema = z.object({
 name:z.string().max(200),title:z.string().max(200),email:z.string().max(200),phone:z.string().max(200),location:z.string().max(200),
 summary:z.string().max(6000),experience:z.string().max(6000),education:z.string().max(6000),skills:z.string().max(6000),languages:z.string().max(6000),
});
export type CV = z.infer<typeof cvSchema>;
export const draftSchema = z.object({version:z.literal(1),language:z.enum(["ar","en"]),cv:cvSchema});
