import type { Route } from "./+types/minhas-pendencias";
import { useLoaderData } from "react-router";
import { prisma } from "~/lib/prisma/db.server";
import { requireUser } from "~/lib/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { AlertCircleIcon, CheckCircleIcon, DollarSignIcon } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  // Only athletes can access this page
  if (user.role !== "ATLETA") {
    throw new Response("Acesso negado", { status: 403 });
  }

  // Get athlete data
  const athlete = await prisma.athlete.findUnique({
    where: { userId: user.id },
  });

  if (!athlete) {
    throw new Response("Atleta não encontrado", { status: 404 });
  }

  // Get athlete's financial pendencies
  const [pendencies, summary] = await Promise.all([
    prisma.financialPending.findMany({
      where: { athleteId: athlete.id },
      orderBy: [
        { status: "asc" }, // PENDENTE first
        { dueDate: "asc" },
      ],
    }),
    prisma.financialPending.aggregate({
      where: { athleteId: athlete.id },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  // Calculate pending and paid amounts
  const pendingAmount = pendencies
    .filter(p => p.status === "PENDENTE")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const paidAmount = pendencies
    .filter(p => p.status === "PAGO")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingCount = pendencies.filter(p => p.status === "PENDENTE").length;
  const paidCount = pendencies.filter(p => p.status === "PAGO").length;

  return { 
    athlete,
    pendencies,
    summary: {
      totalAmount: Number(summary._sum.amount || 0),
      totalCount: summary._count,
      pendingAmount,
      paidAmount,
      pendingCount,
      paidCount,
    }
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Minhas Pendências - Sistema de Basquete" },
    { name: "description", content: "Visualizar suas pendências financeiras" },
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <CardTitle className="text-sm font-medium">Valores Pagos</CardTitle>
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
          <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
          <DollarSignIcon className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.totalAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.totalCount} registro(s)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PendencyCard({ pending }: { pending: any }) {
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
              <DollarSignIcon className="h-5 w-5" />
              {formatCurrency(Number(pending.amount))}
              <Badge variant={pending.status === "PAGO" ? "default" : isOverdue ? "destructive" : "secondary"}>
                {pending.status === "PAGO" ? "Pago" : isOverdue ? "Vencido" : "Pendente"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Vencimento: {formatDate(pending.dueDate)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pending.description && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700">Descrição:</p>
            <p className="text-sm text-gray-600">{pending.description}</p>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Criado em:</strong> {formatDate(pending.createdAt)}</p>
          {pending.status === "PAGO" && pending.paymentDate && (
            <p className="text-green-600">
              <strong>Pago em:</strong> {formatDate(pending.paymentDate)}
            </p>
          )}
        </div>

        {pending.status === "PENDENTE" && isOverdue && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <AlertCircleIcon className="h-4 w-4 inline mr-1" />
              Esta pendência está vencida. Entre em contato com a administração para regularizar a situação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MinhasPendenciasPage({ loaderData }: Route.ComponentProps) {
  const { athlete, pendencies, summary } = loaderData;

  const pendingItems = pendencies.filter((p: any) => p.status === "PENDENTE");
  const paidItems = pendencies.filter((p: any) => p.status === "PAGO");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Pendências</h1>
          <p className="text-gray-600">
            Acompanhe suas pendências financeiras, {athlete.name}
          </p>
        </div>
      </div>

      <SummaryCards summary={summary} />

      {pendencies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma pendência encontrada
            </h3>
            <p className="text-gray-500">
              Você não possui pendências financeiras no momento. Parabéns!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingItems.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircleIcon className="h-5 w-5 text-orange-600" />
                Pendências em Aberto ({pendingItems.length})
              </h2>
              <div className="grid gap-4">
                {pendingItems.map((pending: any) => (
                  <PendencyCard key={pending.id} pending={pending} />
                ))}
              </div>
            </div>
          )}

          {paidItems.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                Histórico de Pagamentos ({paidItems.length})
              </h2>
              <div className="grid gap-4">
                {paidItems.map((pending: any) => (
                  <PendencyCard key={pending.id} pending={pending} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {summary.pendingCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <DollarSignIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Informações sobre Pagamentos
                </h3>
                <p className="text-sm text-blue-800">
                  Para quitar suas pendências, entre em contato com a administração do sistema.
                  Você pode fazer isso através do dashboard principal ou diretamente com os responsáveis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
