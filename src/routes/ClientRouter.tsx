import { Route, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../lib/auth';

// Client/Homeowner routes placeholder
export const ClientRoutes = () => (
  <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
    {/* Add client routes here */}
  </Route>
);
