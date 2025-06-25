import type { Route } from "./+types/login";
import { Form, redirect, useActionData, useNavigation } from "react-router";
import { verifyLogin, createUserSession, getUser } from "~/lib/auth.server";
import { loginSchema } from "~/lib/schemas/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (user) {
    return redirect("/dashboard");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  // Validação com Zod
  const result = loginSchema.safeParse({ email, password });
  
  if (!result.success) {
    return {
      error: "Dados inválidos",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const { email: validEmail, password: validPassword } = result.data;

  try {
    const user = await verifyLogin(validEmail, validPassword);
    
    if (!user) {
      return {
        error: "Email ou senha incorretos",
        fieldErrors: {},
      };
    }

    return createUserSession(user.id, "/dashboard");
  } catch (error) {
    return {
      error: "Erro interno do servidor",
      fieldErrors: {},
    };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Sistema de Basquete" },
    { name: "description", content: "Faça login no sistema de controle financeiro" },
  ];
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sistema de Basquete
          </CardTitle>
          <CardDescription className="text-center">
            Faça login para acessar o sistema de controle financeiro
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form method="post" className="space-y-4">
            {actionData?.error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {actionData.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                disabled={isSubmitting}
                className={actionData?.fieldErrors?.email ? "border-red-500" : ""}
              />
              {actionData?.fieldErrors?.email && (
                <p className="text-sm text-red-600">{actionData.fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className={actionData?.fieldErrors?.password ? "border-red-500" : ""}
              />
              {actionData?.fieldErrors?.password && (
                <p className="text-sm text-red-600">{actionData.fieldErrors.password[0]}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
