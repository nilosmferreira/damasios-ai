import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("admin/users", "routes/admin.users.tsx"),
  route("atletas", "routes/athletes.tsx"),
] satisfies RouteConfig;
