import type { Route } from "./+types/dashboard";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma/db.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { 
  UsersIcon, 
  CalendarIcon, 
  DollarSignIcon, 
  TrophyIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UserXIcon
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);

  if (user.role === UserRole.ADMINISTRADOR) {
    // Dashboard do Administrador
    const [
      totalAthletes,
      activeAthletes,
      totalMatches,
      upcomingMatches,
      pendingPayments,
      monthlyRevenue,
      recentActivity
    ] = await Promise.all([
      // Total de atletas
      prisma.athlete.count(),
      
      // Atletas ativos
      prisma.athlete.count({ where: { isActive: true } }),
      
      // Total de partidas
      prisma.match.count(),
      
      // Partidas futuras
      prisma.match.count({
        where: {
          date: { gte: now }
        }
      }),
      
      // Pendências em aberto
      prisma.financialPending.aggregate({
        where: { status: "PENDENTE" },
        _sum: { amount: true },
        _count: true
      }),
      
      // Receita do mês
      prisma.cashFlow.aggregate({
        where: {
          type: "INFLOW",
          date: { gte: startMonth, lte: endMonth }
        },
        _sum: { amount: true }
      }),
      
      // Atividade recente (últimos 7 dias)
      prisma.match.findMany({
        where: {
          date: { 
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: now
          }
        },
        include: {
          place: true,
          _count: {
            select: {
              participations: true,
              matchConfirmations: true
            }
          }
        },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    return {
      userRole: user.role,
      stats: {
        totalAthletes,
        activeAthletes,
        inactiveAthletes: totalAthletes - activeAthletes,
        totalMatches,
        upcomingMatches,
        pendingPayments: {
          count: pendingPayments._count,
          amount: pendingPayments._sum.amount || 0
        },
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
      },
      recentActivity
    };
  } else {
    // Dashboard do Atleta
    const athlete = await prisma.athlete.findUnique({
      where: { userId: user.id },
      include: {
        matchConfirmations: {
          include: {
            match: {
              include: { place: true }
            }
          },
          where: {
            match: { date: { gte: now } }
          },
          orderBy: { match: { date: 'asc' } },
          take: 5
        },
        participations: {
          include: {
            match: {
              include: { place: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        financialPendencies: {
          where: { status: "PENDENTE" },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!athlete) {
      throw new Response("Athlete not found", { status: 404 });
    }

    return {
      userRole: user.role,
      athlete: {
        ...athlete,
        totalParticipations: athlete.participations.length,
        totalPendingAmount: athlete.financialPendencies.reduce(
          (sum, pending) => sum + Number(pending.amount), 
          0
        )
      }
    };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Sistema de Basquete" },
    { name: "description", content: "Painel principal do sistema de controle financeiro" },
  ];
}

function AdminDashboard({ stats, recentActivity }: { 
  stats: any; 
  recentActivity: any[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de controle financeiro
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atletas</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAthletes}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-green-600">
                <UserCheckIcon className="w-3 h-3 mr-1" />
                {stats.activeAthletes} ativos
              </Badge>
              {stats.inactiveAthletes > 0 && (
                <Badge variant="outline" className="text-red-600">
                  <UserXIcon className="w-3 h-3 mr-1" />
                  {stats.inactiveAthletes} inativos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingMatches} próximas partidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {Number(stats.pendingPayments.amount).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments.count} pendências em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {Number(stats.monthlyRevenue).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "MMMM yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atividade recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas partidas realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma atividade recente
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((match) => (
                <div key={match.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{match.place.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(match.date), "dd/MM/yyyy", { locale: ptBR })} às {match.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {match._count.participations} participantes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match._count.matchConfirmations} confirmações
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="font-medium">Gerenciar Atletas</h3>
              <p className="text-sm text-muted-foreground">Cadastrar e editar atletas</p>
            </div>
          </div>
          <Button asChild className="w-full mt-3">
            <a href="/atletas">Acessar</a>
          </Button>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="font-medium">Agendar Partida</h3>
              <p className="text-sm text-muted-foreground">Criar nova partida</p>
            </div>
          </div>
          <Button asChild className="w-full mt-3">
            <a href="/partidas">Acessar</a>
          </Button>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <DollarSignIcon className="h-8 w-8 text-orange-500" />
            <div>
              <h3 className="font-medium">Controle Financeiro</h3>
              <p className="text-sm text-muted-foreground">Gerenciar finanças</p>
            </div>
          </div>
          <Button asChild className="w-full mt-3">
            <a href="/financeiro">Acessar</a>
          </Button>
        </Card>
      </div>
    </div>
  );
}

function AthleteDashboard({ athlete }: { athlete: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {athlete.name}!</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Cards de estatísticas do atleta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Partidas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{athlete.matchConfirmations.length}</div>
            <p className="text-xs text-muted-foreground">
              Partidas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participações</CardTitle>
            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{athlete.totalParticipations}</div>
            <p className="text-xs text-muted-foreground">
              Total de jogos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {athlete.totalPendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {athlete.financialPendencies.length} pendências
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Próximas partidas confirmadas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Partidas</CardTitle>
          <CardDescription>Partidas que você confirmou presença</CardDescription>
        </CardHeader>
        <CardContent>
          {athlete.matchConfirmations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma partida confirmada
            </p>
          ) : (
            <div className="space-y-4">
              {athlete.matchConfirmations.map((confirmation: any) => (
                <div key={confirmation.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{confirmation.match.place.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(confirmation.match.date), "dd/MM/yyyy", { locale: ptBR })} às {confirmation.match.time}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Confirmado
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pendências financeiras */}
      {athlete.financialPendencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5 text-orange-500" />
              Pendências Financeiras
            </CardTitle>
            <CardDescription>Valores em aberto para pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {athlete.financialPendencies.map((pending: any) => (
                <div key={pending.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">R$ {Number(pending.amount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {format(new Date(pending.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    Pendente
                  </Badge>
                </div>
              ))}
            </div>
            <Button asChild className="w-full mt-4">
              <a href="/minhas-pendencias">Ver Todas as Pendências</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="font-medium">Confirmar Presença</h3>
              <p className="text-sm text-muted-foreground">Ver próximas partidas</p>
            </div>
          </div>
          <Button asChild className="w-full mt-3">
            <a href="/partidas">Acessar</a>
          </Button>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <DollarSignIcon className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="font-medium">Minhas Finanças</h3>
              <p className="text-sm text-muted-foreground">Ver pendências</p>
            </div>
          </div>
          <Button asChild className="w-full mt-3">
            <a href="/minhas-pendencias">Acessar</a>
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  if (loaderData.userRole === UserRole.ADMINISTRADOR) {
    return <AdminDashboard stats={loaderData.stats} recentActivity={loaderData.recentActivity} />;
  } else {
    return <AthleteDashboard athlete={loaderData.athlete} />;
  }
}
