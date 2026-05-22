import { z } from "zod";

export const signupSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome").max(120),
    empresaNome: z.string().trim().min(2, "Informe o nome da empresa").max(160),
    email: z.string().trim().email("E-mail invalido").max(254),
    password: z
      .string()
      .min(10, "Senha deve ter ao menos 10 caracteres")
      .max(128)
      .regex(/[a-z]/, "Senha deve conter letra minuscula")
      .regex(/[A-Z]/, "Senha deve conter letra maiuscula")
      .regex(/[0-9]/, "Senha deve conter numeros")
      .regex(/[^A-Za-z0-9]/, "Senha deve conter simbolo"),
    confirmPassword: z.string(),
    acceptTerms: z.literal("on", {
      error: "Aceite os termos para continuar",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
