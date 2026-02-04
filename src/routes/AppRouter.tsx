import { useRoutes, Navigate } from 'react-router-dom';
import { publicRoutes } from './PublicRouter';
import { providerRoutes } from './ProviderRouter';
import { clientRoutes } from './ClientRouter';

export const AppRouter = () => {
  const routes = useRoutes([
    ...publicRoutes,
    ...providerRoutes,
    ...clientRoutes,
    { path: '*', element: <Navigate to="/" replace /> }
  ]);
  return routes;
};
