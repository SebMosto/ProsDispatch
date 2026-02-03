import CreateClientForm from '../../components/clients/CreateClientForm';
import { Link } from '../../lib/router';

const CreateClientPage = () => {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">Clients</p>
          <h1 className="text-2xl font-semibold text-slate-900">Create Client</h1>
          <p className="text-sm text-slate-600">Add a new client to the registry.</p>
        </div>
        <Link className="text-sm font-semibold text-slate-800 underline-offset-2 hover:underline" to="/clients">
          Back to Clients
        </Link>
      </header>

      <CreateClientForm />
    </main>
  );
};

export default CreateClientPage;
