import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route('atletas', 'routes/athletes.tsx')] satisfies RouteConfig;
