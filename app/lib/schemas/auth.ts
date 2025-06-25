import { z } from "zod";

// Schema para login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

// Schema para cadastro de usuário
export const userCreateSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["ADMINISTRADOR", "ATLETA"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" })
  }),
});

// Schema para edição de usuário
export const userUpdateSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["ADMINISTRADOR", "ATLETA"]).optional(),
});

// Tipos TypeScript inferidos
export type LoginData = z.infer<typeof loginSchema>;
export type UserCreateData = z.infer<typeof userCreateSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
