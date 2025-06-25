import type { Route } from "./+types/partidas";
import { Form, useLoaderData, useActionData, useNavigation, Link } from "react-router";
import { prisma } from "~/lib/prisma/db.server";
import { requireUser } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { 
  createMatchSchema, 
  updateMatchSchema,
  confirmPresenceSchema,
  matchFiltersSchema,
  type MatchFilters 
} from "~/lib/schemas/match";
import { PlusIcon, PencilIcon, CalendarIcon, MapPinIcon, UsersIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

type ActionData = 
  | { success: true; message: string }
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  const url = new URL(request.url);
  const filtersResult = matchFiltersSchema.safeParse({
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
    placeId: url.searchParams.get("placeId") || undefined,
    status: url.searchParams.get("status") || "upcoming",
    page: url.searchParams.get("page") || "1",
    limit: url.searchParams.get("limit") || "20",
  });

  const filters = filtersResult.success ? filtersResult.data : {
    status: "upcoming" as const,
    page: 1,
    limit: 20,
  };

  // Build where clause based on filters
  const whereClause: any = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filters.status === "upcoming") {
    whereClause.date = { gte: today };
  } else if (filters.status === "past") {
    whereClause.date = { lt: today };
  }
  
  if (filters.placeId) {
    whereClause.placeId = filters.placeId;
  }
  
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    whereClause.date = { ...whereClause.date, gte: fromDate };
  }
  
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    whereClause.date = { ...whereClause.date, lte: toDate };
  }

  const [matches, totalCount, places] = await Promise.all([
    prisma.match.findMany({
      where: whereClause,
      include: {
        place: true,
        _count: {
          select: {
            matchConfirmations: true,
            participations: true,
          },
        },
        matchConfirmations: user.role === "ATLETA" ? {
          where: {
            athlete: {
              userId: user.id,
            },
          },
        } : true,
      },
      orderBy: [
        { date: filters.status === "past" ? "desc" : "asc" },
        { time: "asc" },
      ],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.match.count({ where: whereClause }),
    prisma.place.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  // Get current user's athlete data if they are an athlete
  let currentAthlete = null;
  if (user.role === "ATLETA") {
    currentAthlete = await prisma.athlete.findUnique({
      where: { userId: user.id },
    });
  }

  const totalPages = Math.ceil(totalCount / filters.limit);

  return { 
    matches, 
    filters, 
    places,
    currentAthlete,
    user,
    pagination: { totalCount, totalPages, currentPage: filters.page }
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "create": {
        if (user.role !== "ADMINISTRADOR") {
          return { error: "Acesso negado" } as ActionData;
        }

        const data = {
          date: formData.get("date"),
          time: formData.get("time"),
          placeId: formData.get("placeId"),
        };

        const validatedData = createMatchSchema.parse(data);

        await prisma.match.create({
          data: {
            date: new Date(validatedData.date),
            time: new Date(`2000-01-01T${validatedData.time}:00`),
            placeId: validatedData.placeId,
          },
        });

        return { success: true, message: "Partida criada com sucesso!" } as ActionData;
      }

      case "update": {
        if (user.role !== "ADMINISTRADOR") {
          return { error: "Acesso negado" } as ActionData;
        }

        const data = {
          id: formData.get("id"),
          date: formData.get("date"),
          time: formData.get("time"),
          placeId: formData.get("placeId"),
        };

        const validatedData = updateMatchSchema.parse(data);
        const { id, ...updateData } = validatedData;

        await prisma.match.update({
          where: { id },
          data: {
            date: new Date(updateData.date),
            time: new Date(`2000-01-01T${updateData.time}:00`),
            placeId: updateData.placeId,
          },
        });

        return { success: true, message: "Partida atualizada com sucesso!" } as ActionData;
      }

      case "confirmPresence": {
        const data = {
          matchId: formData.get("matchId"),
          athleteId: formData.get("athleteId"),
        };

        const validatedData = confirmPresenceSchema.parse(data);

        // Check if athlete belongs to current user (if not admin)
        if (user.role === "ATLETA") {
          const athlete = await prisma.athlete.findUnique({
            where: { id: validatedData.athleteId },
          });
          
          if (!athlete || athlete.userId !== user.id) {
            return { error: "Acesso negado" } as ActionData;
          }
        }

        // Toggle confirmation
        const existingConfirmation = await prisma.matchConfirmation.findUnique({
          where: {
            athleteId_matchId: {
              athleteId: validatedData.athleteId,
              matchId: validatedData.matchId,
            },
          },
        });

        if (existingConfirmation) {
          await prisma.matchConfirmation.delete({
            where: { id: existingConfirmation.id },
          });
          return { success: true, message: "Presença cancelada!" } as ActionData;
        } else {
          await prisma.matchConfirmation.create({
            data: {
              athleteId: validatedData.athleteId,
              matchId: validatedData.matchId,
            },
          });
          return { success: true, message: "Presença confirmada!" } as ActionData;
        }
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
    { title: "Partidas - Sistema de Basquete" },
    { name: "description", content: "Gerenciar partidas e confirmações de presença" },
  ];
}

function MatchFormFields({ match, places, actionData }: { match?: any; places: any[]; actionData?: ActionData }) {
  const fieldErrors = (actionData && 'fieldErrors' in actionData) ? actionData.fieldErrors || {} : {};

  // Format date for input
  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Format time for input
  const formatTimeForInput = (time?: Date) => {
    if (!time) return "";
    const t = new Date(time);
    return t.toTimeString().slice(0, 5);
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="date">Data *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={formatDateForInput(match?.date)}
          className={fieldErrors.date ? "border-red-500" : ""}
        />
        {fieldErrors.date && (
          <p className="text-sm text-red-500">{fieldErrors.date[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Horário *</Label>
        <Input
          id="time"
          name="time"
          type="time"
          defaultValue={formatTimeForInput(match?.time)}
          className={fieldErrors.time ? "border-red-500" : ""}
        />
        {fieldErrors.time && (
          <p className="text-sm text-red-500">{fieldErrors.time[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeId">Local *</Label>
        <Select name="placeId" defaultValue={match?.placeId || ""}>
          <SelectTrigger className={fieldErrors.placeId ? "border-red-500" : ""}>
            <SelectValue placeholder="Selecione o local" />
          </SelectTrigger>
          <SelectContent>
            {places.map((place) => (
              <SelectItem key={place.id} value={place.id}>
                {place.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.placeId && (
          <p className="text-sm text-red-500">{fieldErrors.placeId[0]}</p>
        )}
      </div>
    </>
  );
}

function CreateMatchDialog({ places, actionData }: { places: any[]; actionData?: ActionData }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "create";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nova Partida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Partida</DialogTitle>
          <DialogDescription>
            Agendar uma nova partida. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create" />
          <MatchFormFields places={places} actionData={actionData} />
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Partida"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditMatchDialog({ match, places, actionData }: { match: any; places: any[]; actionData?: ActionData }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "update" &&
    navigation.formData?.get("id") === match.id;

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
          <DialogTitle>Editar Partida</DialogTitle>
          <DialogDescription>
            Atualizar informações da partida. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="id" value={match.id} />
          <MatchFormFields match={match} places={places} actionData={actionData} />
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Atualizando..." : "Atualizar Partida"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MatchCard({ match, user, currentAthlete, places, actionData }: { 
  match: any; 
  user: any; 
  currentAthlete: any; 
  places: any[];
  actionData?: ActionData;
}) {
  const navigation = useNavigation();
  const isConfirming = navigation.state === "submitting" && 
    navigation.formData?.get("intent") === "confirmPresence" &&
    navigation.formData?.get("matchId") === match.id;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return new Date(time).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isConfirmed = user.role === "ATLETA" && 
    match.matchConfirmations.length > 0;

  const isPastMatch = new Date(match.date) < new Date();

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {formatDate(match.date)}
              {isPastMatch && <Badge variant="secondary">Finalizada</Badge>}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {match.place.name}
              </span>
              <span>às {formatTime(match.time)}</span>
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {user.role === "ADMINISTRADOR" && (
              <EditMatchDialog 
                match={match} 
                places={places}
                actionData={actionData} 
              />
            )}
            {user.role === "ATLETA" && currentAthlete && !isPastMatch && (
              <Form method="post" className="inline">
                <input type="hidden" name="intent" value="confirmPresence" />
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="athleteId" value={currentAthlete.id} />
                <Button
                  type="submit"
                  variant={isConfirmed ? "default" : "outline"}
                  size="sm"
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    "..."
                  ) : isConfirmed ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Confirmado
                    </>
                  ) : (
                    "Confirmar Presença"
                  )}
                </Button>
              </Form>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="text-center">
            <p className="font-medium text-gray-900">{match._count.matchConfirmations}</p>
            <p>Confirmações</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900">{match._count.participations}</p>
            <p>Participações</p>
          </div>
        </div>
        
        {match.place.address && (
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Endereço:</strong> {match.place.address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FiltersSection({ filters, places }: { filters: MatchFilters; places: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="get" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={filters.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximas Partidas</SelectItem>
                  <SelectItem value="past">Partidas Passadas</SelectItem>
                  <SelectItem value="all">Todas as Partidas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeId">Local</Label>
              <Select name="placeId" defaultValue={filters.placeId || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os locais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os locais</SelectItem>
                  {places.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">De</Label>
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                defaultValue={filters.dateFrom}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Até</Label>
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                defaultValue={filters.dateTo}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              Aplicar Filtros
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function PartidasPage({ loaderData }: Route.ComponentProps) {
  const { matches, filters, places, currentAthlete, user, pagination } = loaderData;
  const actionData = useActionData<ActionData>();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partidas</h1>
          <p className="text-gray-600">
            {user.role === "ADMINISTRADOR" 
              ? "Gerenciar partidas e acompanhar confirmações" 
              : "Confirmar presença nas próximas partidas"
            }
          </p>
        </div>
        {user.role === "ADMINISTRADOR" && (
          <CreateMatchDialog places={places} actionData={actionData} />
        )}
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

      <FiltersSection filters={filters} places={places} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {matches.length} de {pagination.totalCount} partidas
        </p>
        <div className="text-sm text-gray-600">
          Página {pagination.currentPage} de {pagination.totalPages}
        </div>
      </div>

      <div className="grid gap-4">
        {matches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Nenhuma partida encontrada com os critérios selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          matches.map((match: any) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              user={user}
              currentAthlete={currentAthlete}
              places={places}
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
              <input type="hidden" name="placeId" value={filters.placeId || ""} />
              <input type="hidden" name="dateFrom" value={filters.dateFrom || ""} />
              <input type="hidden" name="dateTo" value={filters.dateTo || ""} />
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
