import type { ReactElement, ReactNode } from 'react';
import { Children, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface NavigationOptions {
  replace?: boolean;
  state?: unknown;
}

interface RouterContextValue {
  path: string;
  navigate: (to: string, options?: NavigationOptions) => void;
  state: unknown;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export const RouterProvider = ({ children }: { children: ReactNode }) => {
  const [path, setPath] = useState(() => window.location.pathname);
  const [state, setState] = useState<unknown>(window.history.state);

  const navigate = useCallback((to: string, options?: NavigationOptions) => {
    if (options?.replace) {
      window.history.replaceState(options.state ?? null, '', to);
    } else {
      window.history.pushState(options?.state ?? null, '', to);
    }
    setPath(to);
    setState(options?.state ?? null);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setPath(window.location.pathname);
      setState(event.state);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const value = useMemo(() => ({ path, navigate, state }), [navigate, path, state]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

interface RouteProps {
  path: string;
  element: ReactNode;
}

const matchPath = (routePath: string, currentPath: string) => {
  if (routePath === currentPath) return true;

  const routeSegments = routePath.split('/').filter(Boolean);
  const pathSegments = currentPath.split('/').filter(Boolean);

  if (routeSegments.length !== pathSegments.length) return false;

  return routeSegments.every((segment, index) => segment.startsWith(':') || segment === pathSegments[index]);
};

export const Routes = ({ children }: { children: ReactNode }) => {
  const { path } = useRouter();
  const routeElements = Children.toArray(children) as ReactElement<RouteProps>[];

  let fallback: ReactElement<RouteProps> | null = null;

  for (const route of routeElements) {
    if (route.props.path === '*') {
      fallback = route;
      continue;
    }

    if (matchPath(route.props.path, path)) {
      return <>{route.props.element}</>;
    }
  }

  if (fallback) {
    return <>{fallback.props.element}</>;
  }

  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Route = (_props: RouteProps) => null;

export const Navigate = ({ to, replace, state }: { to: string; replace?: boolean; state?: unknown }) => {
  const { navigate } = useRouter();

  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);

  return null;
};

export const Link = ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};

export const useLocation = () => {
  const { path, state } = useRouter();
  return { pathname: path, state };
};

export const useNavigate = () => {
  const { navigate } = useRouter();
  return navigate;
};
