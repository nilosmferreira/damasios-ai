import type { Route } from "./+types/athletes";
import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import { prisma } from "~/lib/prisma/db.server";
import { requireUser } from "~/lib/auth.server";
import bcrypt from "bcryptjs";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { 
  createAthleteSchema, 
  updateAthleteSchema, 
  toggleAthleteStatusSchema,
  athleteFiltersSchema,
  basketballPositions,
  billingTypes,
  getPositionDisplayName,
  getBillingTypeDisplayName,
  type AthleteFilters 
} from "~/lib/schemas/athlete";
import { PlusIcon, PencilIcon, UserCheckIcon, UserXIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

type ActionData = 
  | { success: true; message: string }
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  
  const url = new URL(request.url);
  const filtersResult = athleteFiltersSchema.safeParse({
    status: url.searchParams.get("status") || "active",
    billingType: url.searchParams.get("billingType") || "all",
    search: url.searchParams.get("search") || undefined,
    page: url.searchParams.get("page") || "1",
    limit: url.searchParams.get("limit") || "20",
  });

  const filters = filtersResult.success ? filtersResult.data : {
    status: "active" as const,
    billingType: "all" as const,
    search: undefined,
    page: 1,
    limit: 20,
  };

  // Build where clause based on filters
  const whereClause: any = {};
  
  if (filters.status !== "all") {
    whereClause.isActive = filters.status === "active";
  }
  
  if (filters.billingType !== "all") {
    whereClause.billingType = filters.billingType;
  }
  
  if (filters.search) {
    whereClause.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { 
        user: { 
          email: { contains: filters.search, mode: "insensitive" } 
        } 
      },
    ].filter(Boolean); // Remove undefined conditions
  }

  const [athletes, totalCount] = await Promise.all([
    prisma.athlete.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            matchConfirmations: true,
            participations: true,
            financialPendencies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.athlete.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / filters.limit);

  return { 
    athletes, 
    filters, 
    pagination: { totalCount, totalPages, currentPage: filters.page }
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "create": {
        const data = {
          name: formData.get("name"),
          email: formData.get("email") || undefined,
          billingType: formData.get("billingType"),
          preferredPositions: formData.getAll("preferredPositions"),
          isActive: formData.get("isActive") === "true",
          createUser: formData.get("createUser") === "true",
          userEmail: formData.get("userEmail") || undefined,
          userPassword: formData.get("userPassword") || undefined,
        };

        const validatedData = createAthleteSchema.parse(data);

        let userId = null;

        // Create user if requested
        if (validatedData.createUser && validatedData.userEmail && validatedData.userPassword) {
          // Check if email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.userEmail },
          });

          if (existingUser) {
            return { 
              error: "Este email já está cadastrado", 
              fieldErrors: { userEmail: ["Email já está em uso"] }
            } as ActionData;
          }

          const user = await prisma.user.create({
            data: {
              email: validatedData.userEmail,
              password: await bcrypt.hash(validatedData.userPassword, 10),
              role: "ATLETA",
            },
          });
          userId = user.id;
        }

        // Check if athlete email already exists (if provided)
        if (validatedData.email) {
          const existingAthlete = await prisma.athlete.findUnique({
            where: { email: validatedData.email },
          });

          if (existingAthlete) {
            return { 
              error: "Este email já está cadastrado para outro atleta", 
              fieldErrors: { email: ["Email já está em uso"] }
            } as ActionData;
          }
        }

        // Create athlete
        await prisma.athlete.create({
          data: {
            name: validatedData.name,
            email: validatedData.email || validatedData.userEmail || null,
            billingType: validatedData.billingType,
            preferredPositions: validatedData.preferredPositions,
            isActive: validatedData.isActive,
            userId,
          },
        });

        return { success: true, message: "Atleta criado com sucesso!" } as ActionData;
      }

      case "update": {
        const data = {
          id: formData.get("id"),
          name: formData.get("name"),
          billingType: formData.get("billingType"),
          preferredPositions: formData.getAll("preferredPositions"),
          isActive: formData.get("isActive") === "true",
        };

        const validatedData = updateAthleteSchema.parse(data);
        const { id, ...updateData } = validatedData;

        await prisma.athlete.update({
          where: { id },
          data: updateData,
        });

        return { success: true, message: "Atleta atualizado com sucesso!" } as ActionData;
      }

      case "toggleStatus": {
        const data = {
          id: formData.get("id"),
          isActive: formData.get("isActive") === "true",
        };

        const validatedData = toggleAthleteStatusSchema.parse(data);

        await prisma.athlete.update({
          where: { id: validatedData.id },
          data: { isActive: validatedData.isActive },
        });

        return { success: true, message: `Atleta ${validatedData.isActive ? 'ativado' : 'desativado'} com sucesso!` } as ActionData;
      }

      default:
        return { error: "Ação inválida" } as ActionData;
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { 
        error: "Falha na validação", 
        fieldErrors: error.flatten().fieldErrors 
      } as ActionData;
    }
    
    console.error("Action error:", error);
    return { error: "Ocorreu um erro inesperado" } as ActionData;
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Atletas - Sistema de Basquete" },
    { name: "description", content: "Gerenciar atletas e suas informações" },
  ];
}

function AthleteFormFields({ athlete, actionData }: { athlete?: any; actionData?: ActionData }) {
  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    athlete?.preferredPositions || []
  );
  const [createUser, setCreateUser] = useState(false);

  const fieldErrors = (actionData && 'fieldErrors' in actionData) ? actionData.fieldErrors || {} : {};

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={athlete?.name || ""}
          placeholder="Digite o nome do atleta"
          className={fieldErrors.name ? "border-red-500" : ""}
        />
        {fieldErrors.name && (
          <p className="text-sm text-red-500">{fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email para Contato</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={athlete?.email || ""}
          placeholder="email@exemplo.com"
          className={fieldErrors.email ? "border-red-500" : ""}
        />
        {fieldErrors.email && (
          <p className="text-sm text-red-500">{fieldErrors.email[0]}</p>
        )}
        <p className="text-sm text-gray-600">
          Email para contato (necessário se não criar usuário)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingType">Tipo de Cobrança *</Label>
        <Select name="billingType" defaultValue={athlete?.billingType || ""}>
          <SelectTrigger className={fieldErrors.billingType ? "border-red-500" : ""}>
            <SelectValue placeholder="Selecione o tipo de cobrança" />
          </SelectTrigger>
          <SelectContent>
            {billingTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getBillingTypeDisplayName(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.billingType && (
          <p className="text-sm text-red-500">{fieldErrors.billingType[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Posições Preferidas *</Label>
        <div className="grid grid-cols-2 gap-2">
          {basketballPositions.map((position) => (
            <div key={position} className="flex items-center space-x-2">
              <Checkbox
                id={position}
                name="preferredPositions"
                value={position}
                defaultChecked={selectedPositions.includes(position)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPositions([...selectedPositions, position]);
                  } else {
                    setSelectedPositions(selectedPositions.filter(p => p !== position));
                  }
                }}
              />
              <Label htmlFor={position} className="text-sm">
                {getPositionDisplayName(position)}
              </Label>
            </div>
          ))}
        </div>
        {fieldErrors.preferredPositions && (
          <p className="text-sm text-red-500">{fieldErrors.preferredPositions[0]}</p>
        )}
      </div>

      {/* Seção de criação de usuário - apenas para novos atletas */}
      {!athlete && (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createUser"
              name="createUser"
              value="true"
              checked={createUser}
              onCheckedChange={(checked) => setCreateUser(checked === true)}
            />
            <Label htmlFor="createUser">Criar conta de usuário para este atleta</Label>
          </div>

          {createUser && (
            <div className="space-y-4 ml-6 border-l-2 border-gray-200 pl-4">
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email do Usuário *</Label>
                <Input
                  id="userEmail"
                  name="userEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  className={fieldErrors.userEmail ? "border-red-500" : ""}
                />
                {fieldErrors.userEmail && (
                  <p className="text-sm text-red-500">{fieldErrors.userEmail[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPassword">Senha *</Label>
                <Input
                  id="userPassword"
                  name="userPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className={fieldErrors.userPassword ? "border-red-500" : ""}
                />
                {fieldErrors.userPassword && (
                  <p className="text-sm text-red-500">{fieldErrors.userPassword[0]}</p>
                )}
              </div>

              <p className="text-sm text-blue-600">
                O atleta poderá fazer login no sistema com essas credenciais
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          name="isActive"
          value="true"
          defaultChecked={athlete?.isActive ?? true}
        />
        <Label htmlFor="isActive">Atleta Ativo</Label>
      </div>
    </>
  );
}

function CreateAthleteDialog({ actionData }: { actionData?: ActionData }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "create";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar Atleta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Atleta</DialogTitle>
          <DialogDescription>
            Criar um novo perfil de atleta. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create" />
          <AthleteFormFields actionData={actionData} />
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Atleta"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditAthleteDialog({ athlete, actionData }: { athlete: any; actionData?: ActionData }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "update" &&
    navigation.formData?.get("id") === athlete.id;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PencilIcon className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Atleta</DialogTitle>
          <DialogDescription>
            Atualizar informações do atleta. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="id" value={athlete.id} />
          <AthleteFormFields athlete={athlete} actionData={actionData} />
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Atualizando..." : "Atualizar Atleta"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AthleteCard({ athlete, actionData }: { athlete: any; actionData?: ActionData }) {
  const navigation = useNavigation();
  const isTogglingStatus = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "toggleStatus" &&
    navigation.formData?.get("id") === athlete.id;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {athlete.name}
              <Badge variant={athlete.isActive ? "default" : "secondary"}>
                {athlete.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {athlete.email || athlete.user?.email || "Sem email"}
              {athlete.user && (
                <Badge variant="secondary" className="text-xs">
                  Com Acesso
                </Badge>
              )}
              <Badge variant="outline">
                {getBillingTypeDisplayName(athlete.billingType)}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <EditAthleteDialog athlete={athlete} actionData={actionData} />
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="toggleStatus" />
              <input type="hidden" name="id" value={athlete.id} />
              <input type="hidden" name="isActive" value={(!athlete.isActive).toString()} />
              <Button
                type="submit"
                variant={athlete.isActive ? "destructive" : "default"}
                size="sm"
                disabled={isTogglingStatus}
              >
                {isTogglingStatus ? (
                  "..."
                ) : athlete.isActive ? (
                  <>
                    <UserXIcon className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <UserCheckIcon className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </Button>
            </Form>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {athlete.preferredPositions.length > 0 && (
            <div>
              <span className="text-sm font-medium">Posições: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {athlete.preferredPositions.map((position: string) => (
                  <Badge key={position} variant="outline" className="text-xs">
                    {getPositionDisplayName(position as any)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mt-4">
            <div className="text-center">
              <p className="font-medium text-gray-900">{athlete._count.participations}</p>
              <p>Participações</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">{athlete._count.matchConfirmations}</p>
              <p>Confirmações</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">{athlete._count.financialPendencies}</p>
              <p>Pendências</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FiltersSection({ filters }: { filters: AthleteFilters }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="get" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Nome ou email..."
                  defaultValue={filters.search}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={filters.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Atletas</SelectItem>
                  <SelectItem value="active">Apenas Ativos</SelectItem>
                  <SelectItem value="inactive">Apenas Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingType">Tipo de Cobrança</Label>
              <Select name="billingType" defaultValue={filters.billingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="DIARISTA">Por Jogo</SelectItem>
                  <SelectItem value="MENSALISTA">Mensalista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function AthletesPage({ loaderData }: Route.ComponentProps) {
  const { athletes, filters, pagination } = loaderData;
  const actionData = useActionData<ActionData>();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atletas</h1>
          <p className="text-gray-600">
            Gerenciar perfis e informações dos atletas
          </p>
        </div>
        <CreateAthleteDialog actionData={actionData} />
      </div>

      {(actionData && 'error' in actionData) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{actionData.error}</p>
        </div>
      )}

      {(actionData && 'success' in actionData) && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{actionData.message}</p>
        </div>
      )}

      <FiltersSection filters={filters} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {athletes.length} de {pagination.totalCount} atletas
        </p>
        <div className="text-sm text-gray-600">
          Página {pagination.currentPage} de {pagination.totalPages}
        </div>
      </div>

      <div className="grid gap-4">
        {athletes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Nenhum atleta encontrado com os critérios selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          athletes.map((athlete: any) => (
            <AthleteCard 
              key={athlete.id} 
              athlete={athlete} 
              actionData={actionData} 
            />
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <Form key={page} method="get" className="inline">
              <input type="hidden" name="status" value={filters.status} />
              <input type="hidden" name="billingType" value={filters.billingType} />
              <input type="hidden" name="search" value={filters.search || ""} />
              <input type="hidden" name="page" value={page.toString()} />
              <Button
                type="submit"
                variant={page === pagination.currentPage ? "default" : "outline"}
                size="sm"
              >
                {page}
              </Button>
            </Form>
          ))}
        </div>
      )}
    </div>
  );
}
