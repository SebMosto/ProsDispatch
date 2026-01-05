import type { ReactNode } from 'react';

export type QueryKey = unknown[];

export interface UseQueryOptions<TData, TError> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  staleTime?: number;
}

export interface UseQueryResult<TData, TError> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export interface UseMutationOptions<TData, TError, TVariables, TContext = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onError?: (error: TError, variables: TVariables, context?: TContext) => void;
  onSuccess?: (data: TData, variables: TVariables, context?: TContext) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context?: TContext) => void;
}

export interface UseMutationResult<TData, TError, TVariables, TContext = unknown> {
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  error: TError | null;
  client: QueryClient;
}

export class QueryClient {
  constructor();
  getQueriesData<TData>(queryKey: QueryKey): Array<[QueryKey, TData | undefined]>;
  setQueryData<TData>(queryKey: QueryKey, updater: TData | ((current: TData | undefined) => TData)): TData | undefined;
  getQueryData<TData>(queryKey: QueryKey): TData | undefined;
  invalidateQueries(options: { queryKey: QueryKey }): Promise<void>;
  cancelQueries(options?: { queryKey?: QueryKey }): Promise<void>;
}

export const QueryClientProvider: ({ client, children }: { client?: QueryClient; children: ReactNode }) => JSX.Element;

export function useQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>,
): UseQueryResult<TData, TError>;

export function useMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext>;

export const useQueryClient: () => QueryClient;
export const useIsMutating: () => number;
export const hashQueryKey: (queryKey: QueryKey) => string;
