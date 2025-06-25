import type { Route } from "./+types/financeiro";
import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import { prisma } from "~/lib/prisma/db.server";
import { requireAdmin } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { 
  createCashFlowSchema, 
  createFinancialPendingSchema,
  updateFinancialPendingSchema,
  financialFiltersSchema,
  type FinancialFilters 
} from "~/lib/schemas/financial";
import { PlusIcon, DollarSignIcon, TrendingUpIcon, TrendingDownIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";

type ActionData = 
  | { success: true; message: string }
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  
  const url = new URL(request.url);
  const filtersResult = financialFiltersSchema.safeParse({
    type: url.searchParams.get("type") || "all",
    athleteId: url.searchParams.get("athleteId") || undefined,
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
    page: url.searchParams.get("page") || "1",
    limit: url.searchParams.get("limit") || "20",
  });

  const filters = filtersResult.success ? filtersResult.data : {
    type: "all" as const,
    page: 1,
    limit: 20,
  };

  // Build date filter for queries
  const dateFilter: any = {};
  if (filters.dateFrom) {
    dateFilter.gte = new Date(filters.dateFrom);
  }
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.lte = toDate;
  }

  // Get financial pendencies
  const pendingWhereClause: any = {};
  if (filters.athleteId) {
    pendingWhereClause.athleteId = filters.athleteId;
  }
  if (Object.keys(dateFilter).length > 0) {
    pendingWhereClause.dueDate = dateFilter;
  }

  // Get cash flow
  const cashFlowWhereClause: any = {};
  if (Object.keys(dateFilter).length > 0) {
    cashFlowWhereClause.date = dateFilter;
  }

  const [pendencies, cashFlows, athletes, summary] = await Promise.all([
    filters.type === "cashflow" ? [] : prisma.financialPending.findMany({
      where: pendingWhereClause,
      include: {
        athlete: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDENTE first
        { dueDate: "asc" },
      ],
      skip: filters.type === "pending" || filters.type === "paid" ? (filters.page - 1) * filters.limit : 0,
      take: filters.type === "pending" || filters.type === "paid" ? filters.limit : undefined,
    }),
    filters.type === "pending" || filters.type === "paid" ? [] : prisma.cashFlow.findMany({
      where: cashFlowWhereClause,
      orderBy: { date: "desc" },
      skip: filters.type === "cashflow" ? (filters.page - 1) * filters.limit : 0,
      take: filters.type === "cashflow" ? filters.limit : undefined,
    }),
    prisma.athlete.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    // Summary calculations
    Promise.all([
      prisma.financialPending.aggregate({
        where: { status: "PENDENTE" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialPending.aggregate({
        where: { status: "PAGO" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.cashFlow.aggregate({
        where: { type: "INFLOW" },
        _sum: { amount: true },
      }),
      prisma.cashFlow.aggregate({
        where: { type: "OUTFLOW" },
        _sum: { amount: true },
      }),
    ]),
  ]);

  const [pendingSum, paidSum, inflowSum, outflowSum] = summary;

  // Filter pendencies by status if needed
  const filteredPendencies = filters.type === "pending" 
    ? pendencies.filter(p => p.status === "PENDENTE")
    : filters.type === "paid"
    ? pendencies.filter(p => p.status === "PAGO")
    : pendencies;

  // Calculate pagination
  const totalCount = filters.type === "cashflow" 
    ? await prisma.cashFlow.count({ where: cashFlowWhereClause })
    : filters.type === "pending"
    ? await prisma.financialPending.count({ where: { ...pendingWhereClause, status: "PENDENTE" } })
    : filters.type === "paid"
    ? await prisma.financialPending.count({ where: { ...pendingWhereClause, status: "PAGO" } })
    : filteredPendencies.length + cashFlows.length;

  const totalPages = Math.ceil(totalCount / filters.limit);

  return { 
    pendencies: filteredPendencies,
    cashFlows,
    athletes,
    filters,
    summary: {
      pendingAmount: pendingSum._sum.amount || 0,
      pendingCount: pendingSum._count,
      paidAmount: paidSum._sum.amount || 0,
      paidCount: paidSum._count,
      totalInflow: inflowSum._sum.amount || 0,
      totalOutflow: outflowSum._sum.amount || 0,
      balance: Number(inflowSum._sum.amount || 0) - Number(outflowSum._sum.amount || 0),
    },
    pagination: { totalCount, totalPages, currentPage: filters.page }
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "createCashFlow": {
        const data = {
          description: formData.get("description"),
          amount: formData.get("amount"),
          type: formData.get("type"),
          date: formData.get("date"),
        };

        const validatedData = createCashFlowSchema.parse(data);

        await prisma.cashFlow.create({
          data: {
            ...validatedData,
            date: new Date(validatedData.date),
          },
        });

        return { success: true, message: "Movimentação financeira registrada com sucesso!" } as ActionData;
      }

      case "createPending": {
        const data = {
          athleteId: formData.get("athleteId"),
          amount: formData.get("amount"),
          dueDate: formData.get("dueDate"),
          description: formData.get("description"),
        };

        const validatedData = createFinancialPendingSchema.parse(data);

        await prisma.financialPending.create({
          data: {
            ...validatedData,
            dueDate: new Date(validatedData.dueDate),
          },
        });

        return { success: true, message: "Pendência financeira criada com sucesso!" } as ActionData;
      }

      case "updatePending": {
        const data = {
          id: formData.get("id"),
          status: formData.get("status"),
          paymentDate: formData.get("paymentDate"),
        };

        const validatedData = updateFinancialPendingSchema.parse(data);
        const { id, ...updateData } = validatedData;

        const finalData: any = { ...updateData };
        if (updateData.paymentDate) {
          finalData.paymentDate = new Date(updateData.paymentDate);
        }

        await prisma.financialPending.update({
          where: { id },
          data: finalData,
        });

        return { success: true, message: "Pendência atualizada com sucesso!" } as ActionData;
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
    { title: "Financeiro - Sistema de Basquete" },
    { name: "description", content: "Controle financeiro, pendências e fluxo de caixa" },
  ];
}

function SummaryCards({ summary }: { summary: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendências em Aberto</CardTitle>
          <AlertCircleIcon className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(summary.pendingAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.pendingCount} pendência(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valores Recebidos</CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.paidAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.paidCount} pagamento(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalInflow)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          <DollarSignIcon className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateCashFlowDialog({ actionData }: { actionData?: ActionData }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "createCashFlow";

  const fieldErrors = (actionData && 'fieldErrors' in actionData) ? actionData.fieldErrors || {} : {};

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nova Movimentação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação Financeira</DialogTitle>
          <DialogDescription>
            Registrar entrada ou saída no fluxo de caixa.
          </DialogDescription>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="createCashFlow" />
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva a movimentação financeira"
              className={fieldErrors.description ? "border-red-500" : ""}
            />
            {fieldErrors.description && (
              <p className="text-sm text-red-500">{fieldErrors.description[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select name="type">
              <SelectTrigger className={fieldErrors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFLOW">Entrada</SelectItem>
                <SelectItem value="OUTFLOW">Saída</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.type && (
              <p className="text-sm text-red-500">{fieldErrors.type[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className={fieldErrors.amount ? "border-red-500" : ""}
            />
            {fieldErrors.amount && (
              <p className="text-sm text-red-500">{fieldErrors.amount[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className={fieldErrors.date ? "border-red-500" : ""}
            />
            {fieldErrors.date && (
              <p className="text-sm text-red-500">{fieldErrors.date[0]}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreatePendingDialog({ athletes, actionData }: { athletes: any[]; actionData?: ActionData }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "createPending";

  const fieldErrors = (actionData && 'fieldErrors' in actionData) ? actionData.fieldErrors || {} : {};

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <AlertCircleIcon className="h-4 w-4 mr-2" />
          Nova Pendência
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Pendência Financeira</DialogTitle>
          <DialogDescription>
            Registrar uma nova pendência para um atleta.
          </DialogDescription>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="createPending" />
          
          <div className="space-y-2">
            <Label htmlFor="athleteId">Atleta *</Label>
            <Select name="athleteId">
              <SelectTrigger className={fieldErrors.athleteId ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o atleta" />
              </SelectTrigger>
              <SelectContent>
                {athletes.map((athlete) => (
                  <SelectItem key={athlete.id} value={athlete.id}>
                    {athlete.name} - {athlete.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.athleteId && (
              <p className="text-sm text-red-500">{fieldErrors.athleteId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className={fieldErrors.amount ? "border-red-500" : ""}
            />
            {fieldErrors.amount && (
              <p className="text-sm text-red-500">{fieldErrors.amount[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Vencimento *</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              className={fieldErrors.dueDate ? "border-red-500" : ""}
            />
            {fieldErrors.dueDate && (
              <p className="text-sm text-red-500">{fieldErrors.dueDate[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descrição opcional da pendência"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Pendência"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PendencyCard({ pending, actionData }: { pending: any; actionData?: ActionData }) {
  const navigation = useNavigation();
  const isUpdating = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "updatePending" &&
    navigation.formData?.get("id") === pending.id;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isOverdue = pending.status === "PENDENTE" && new Date(pending.dueDate) < new Date();

  return (
    <Card className={`transition-shadow hover:shadow-md ${isOverdue ? 'border-red-200' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {pending.athlete.name}
              <Badge variant={pending.status === "PAGO" ? "default" : isOverdue ? "destructive" : "secondary"}>
                {pending.status === "PAGO" ? "Pago" : isOverdue ? "Vencido" : "Pendente"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {pending.athlete.user.email}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{formatCurrency(Number(pending.amount))}</p>
            <p className="text-sm text-gray-600">
              Vencimento: {formatDate(pending.dueDate)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pending.description && (
          <p className="text-sm text-gray-600 mb-4">{pending.description}</p>
        )}
        
        {pending.status === "PENDENTE" && (
          <Form method="post" className="flex gap-2">
            <input type="hidden" name="intent" value="updatePending" />
            <input type="hidden" name="id" value={pending.id} />
            <input type="hidden" name="status" value="PAGO" />
            <input type="hidden" name="paymentDate" value={new Date().toISOString().split('T')[0]} />
            <Button
              type="submit"
              size="sm"
              disabled={isUpdating}
            >
              {isUpdating ? "Marcando..." : "Marcar como Pago"}
            </Button>
          </Form>
        )}
        
        {pending.status === "PAGO" && pending.paymentDate && (
          <p className="text-sm text-green-600">
            Pago em: {formatDate(pending.paymentDate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CashFlowCard({ cashFlow }: { cashFlow: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cashFlow.type === "INFLOW" ? (
              <TrendingUpIcon className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDownIcon className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">{cashFlow.description}</p>
              <p className="text-sm text-gray-600">{formatDate(cashFlow.date)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${
              cashFlow.type === "INFLOW" ? "text-green-600" : "text-red-600"
            }`}>
              {cashFlow.type === "INFLOW" ? "+" : "-"}{formatCurrency(Number(cashFlow.amount))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinanceiroPage({ loaderData }: Route.ComponentProps) {
  const { pendencies, cashFlows, athletes, filters, summary, pagination } = loaderData;
  const actionData = useActionData<ActionData>();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle Financeiro</h1>
          <p className="text-gray-600">
            Gerenciar pendências financeiras e fluxo de caixa
          </p>
        </div>
        <div className="flex gap-2">
          <CreatePendingDialog athletes={athletes} actionData={actionData} />
          <CreateCashFlowDialog actionData={actionData} />
        </div>
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

      <SummaryCards summary={summary} />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendências</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {pendencies.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Nenhuma pendência encontrada.</p>
                </CardContent>
              </Card>
            ) : (
              pendencies.map((pending: any) => (
                <PendencyCard 
                  key={pending.id} 
                  pending={pending} 
                  actionData={actionData} 
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid gap-4">
            {cashFlows.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Nenhuma movimentação encontrada.</p>
                </CardContent>
              </Card>
            ) : (
              cashFlows.map((cashFlow: any) => (
                <CashFlowCard 
                  key={cashFlow.id} 
                  cashFlow={cashFlow} 
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
