import type { Route } from "./+types/athletes";
import { prisma } from "~/lib/prisma/db.server";

export async function loader() {
  const athletes = await prisma.athlete.findMany({
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return { athletes };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Athletes - Sport Management" },
    { name: "description", content: "Manage athletes and their information" },
  ];
}

export default function AthletesPage({ loaderData }: Route.ComponentProps) {
  const { athletes } = loaderData;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Athletes</h1>
      
      <div className="grid gap-4">
        {athletes.map((athlete) => (
          <div
            key={athlete.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{athlete.name}</h3>
                <p className="text-gray-600">{athlete.user.email}</p>
                <p className="text-sm text-gray-500">
                  {athlete.billingType} • {athlete.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              
              <div className="text-right text-sm text-gray-500">
                <p>{athlete._count.participations} participations</p>
                <p>{athlete._count.matchConfirmations} confirmations</p>
                <p>{athlete._count.financialPendencies} pending payments</p>
              </div>
            </div>
            
            {athlete.preferredPositions.length > 0 && (
              <div className="mt-2">
                <span className="text-sm font-medium">Positions: </span>
                {athlete.preferredPositions.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
