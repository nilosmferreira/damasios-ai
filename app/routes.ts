import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  
  // Protected routes with layout
  layout("routes/app-layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("atletas", "routes/athletes.tsx"),
    route("partidas", "routes/partidas.tsx"),
    route("financeiro", "routes/financeiro.tsx"),
    route("minhas-pendencias", "routes/minhas-pendencias.tsx"),
  ]),
] satisfies RouteConfig;
