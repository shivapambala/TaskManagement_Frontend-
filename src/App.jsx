import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import { Spinner } from './components/ui';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Issues = lazy(() => import('./pages/Issues'));
const Board = lazy(() => import('./pages/Board'));
const Sprints = lazy(() => import('./pages/Sprints'));
const Reports = lazy(() => import('./pages/Reports'));
const Team = lazy(() => import('./pages/Team'));
const Workflows = lazy(() => import('./pages/Workflows'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="issues" element={<Issues />} />
            <Route path="board" element={<Board />} />
            <Route path="sprints" element={<Sprints />} />
            <Route path="reports" element={<Reports />} />
            <Route path="team" element={<Team />} />
            <Route path="workflows" element={<Workflows />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
