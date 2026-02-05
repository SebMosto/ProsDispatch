import { Routes, Route, Navigate } from '../lib/router';
import { PublicRoutes } from './PublicRouter';
import { ProviderRoutes } from './ProviderRouter';
import { ClientRoutes } from './ClientRouter';

export const AppRouter = () => {
  return (
    <Routes>
      {PublicRoutes()}
      {ProviderRoutes()}
      {ClientRoutes()}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
