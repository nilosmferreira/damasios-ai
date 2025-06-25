import type { Route } from "./+types/admin.users";
import { Link, Form, useActionData, useNavigation } from "react-router";
import { requireAdmin, createUser } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma/db.server";
import { userCreateSchema } from "~/lib/schemas/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { AlertCircle, ArrowLeft, Plus } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      athlete: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return { users };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const role = formData.get("role")?.toString() as "ADMINISTRADOR" | "ATLETA";

    // Validação com Zod
    const result = userCreateSchema.safeParse({ email, password, role });
    
    if (!result.success) {
      return {
        error: "Dados inválidos",
        fieldErrors: result.error.flatten().fieldErrors,
      };
    }

    const { email: validEmail, password: validPassword, role: validRole } = result.data;

    try {
      // Verificar se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: validEmail },
      });

      if (existingUser) {
        return {
          error: "Este email já está cadastrado",
          fieldErrors: {},
        };
      }

      await createUser(validEmail, validPassword, validRole);
      
      return {
        success: "Usuário criado com sucesso!",
        fieldErrors: {},
      };
    } catch (error) {
      return {
        error: "Erro ao criar usuário",
        fieldErrors: {},
      };
    }
  }

  return { error: "Ação inválida", fieldErrors: {} };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gerenciar Usuários - Sistema de Basquete" },
    { name: "description", content: "Gerenciar usuários do sistema" },
  ];
}

export default function AdminUsersPage({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-sm text-gray-600">Cadastrar e gerenciar usuários do sistema</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulário de Cadastro */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Novo Usuário
                </CardTitle>
                <CardDescription>
                  Cadastrar um novo usuário no sistema
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="create" />
                  
                  {actionData?.error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      {actionData.error}
                    </div>
                  )}

                  {actionData?.success && (
                    <div className="p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md">
                      {actionData.success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="usuario@email.com"
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

                  <div className="space-y-2">
                    <Label htmlFor="role">Tipo de Usuário</Label>
                    <Select name="role" required disabled={isSubmitting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATLETA">Atleta</SelectItem>
                        <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    {actionData?.fieldErrors?.role && (
                      <p className="text-sm text-red-600">{actionData.fieldErrors.role[0]}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Criando..." : "Criar Usuário"}
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Usuários */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Atleta</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "ADMINISTRADOR" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.athlete ? (
                              <div className="flex items-center gap-2">
                                <span>{user.athlete.name}</span>
                                <Badge variant={user.athlete.isActive ? "default" : "destructive"} className="text-xs">
                                  {user.athlete.isActive ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-500">Não é atleta</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
