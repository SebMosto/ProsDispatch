import ClientList from '../../components/clients/ClientList';
import { Link } from '../../lib/router';

const ClientsListPage = () => {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">Clients</p>
          <h1 className="text-2xl font-semibold text-slate-900">Client Registry</h1>
          <p className="text-sm text-slate-600">View customers and their primary properties.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            to="/clients/new"
          >
            New Client
          </Link>
        </div>
      </header>

      <ClientList />
    </main>
  );
};

export default ClientsListPage;
