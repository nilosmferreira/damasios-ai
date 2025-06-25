import type { Route } from "./+types/home";
import { redirect } from "react-router";
import { getUser } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  
  if (user) {
    return redirect("/dashboard");
  } else {
    return redirect("/login");
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sistema de Basquete" },
    { name: "description", content: "Sistema de controle financeiro para basquete" },
  ];
}

export default function Home() {
  // Esta página nunca será renderizada devido ao redirect no loader
  return null;
}
