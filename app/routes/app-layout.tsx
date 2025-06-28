import type { Route } from "./+types/app-layout";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma/db.server";
import { AppLayout } from "~/components/layouts/app-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  // Buscar dados do atleta se o usuário for atleta
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!userData) {
    throw new Response("User not found", { status: 404 });
  }

  return {
    user: {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      athlete: userData.athlete,
    },
  };
}

export default function AppLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AppLayout user={loaderData.user} />;
}
