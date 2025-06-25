import type { Route } from "./+types/dashboard";
import { Link, Form } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Calendar, DollarSign, Settings, LogOut } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  return { user };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Sistema de Basquete" },
    { name: "description", content: "Painel principal do sistema de controle financeiro" },
  ];
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const isAdmin = user.role === "ADMINISTRADOR";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Basquete</h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, {user.email} ({user.role})
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/admin/users">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Usuários
                  </Button>
                </Link>
              )}
              
              <Form action="/logout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card Atletas */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/atletas" className="block">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atletas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <CardDescription>
                  Gerenciar atletas do sistema
                </CardDescription>
              </CardContent>
            </Link>
          </Card>

          {/* Card Partidas */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/partidas" className="block">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Partidas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <CardDescription>
                  {isAdmin ? "Gerenciar partidas" : "Confirmar presença"}
                </CardDescription>
              </CardContent>
            </Link>
          </Card>

          {/* Card Financeiro */}
          {isAdmin && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/financeiro" className="block">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Financeiro</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ --</div>
                  <CardDescription>
                    Controle de caixa e pendências
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          )}

          {/* Card Minhas Pendências (para atletas) */}
          {!isAdmin && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/minhas-pendencias" className="block">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Minhas Pendências</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ --</div>
                  <CardDescription>
                    Suas pendências financeiras
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          )}
        </div>

        {/* Seção de Ações Rápidas */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {isAdmin ? (
              <>
                <Link to="/atletas/novo">
                  <Button className="w-full" variant="outline">
                    Cadastrar Atleta
                  </Button>
                </Link>
                
                <Link to="/partidas/nova">
                  <Button className="w-full" variant="outline">
                    Nova Partida
                  </Button>
                </Link>
                
                <Link to="/financeiro/entrada">
                  <Button className="w-full" variant="outline">
                    Registrar Entrada
                  </Button>
                </Link>
                
                <Link to="/financeiro/saida">
                  <Button className="w-full" variant="outline">
                    Registrar Saída
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/partidas">
                  <Button className="w-full" variant="outline">
                    Ver Próximas Partidas
                  </Button>
                </Link>
                
                <Link to="/minhas-pendencias">
                  <Button className="w-full" variant="outline">
                    Minhas Pendências
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
