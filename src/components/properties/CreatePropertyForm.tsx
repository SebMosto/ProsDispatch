import { Controller } from 'react-hook-form';
import SyncBadge from '../system/SyncBadge';
import AddressAutocomplete from '../ui/AddressAutocomplete';
import { CANADIAN_PROVINCES } from '../../schemas/mvp1/property';
import { useCreatePropertyForm, TEXT } from './useCreatePropertyForm';

interface CreatePropertyFormProps {
  clientId?: string;
}

const CreatePropertyForm = ({ clientId }: CreatePropertyFormProps) => {
  const {
    formMethods,
    syncState,
    submitError,
    submitSuccess,
    applyAddressSelection,
    onSubmit,
  } = useCreatePropertyForm({ clientId });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formMethods;

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{TEXT.title}</h2>
          <p className="text-sm text-slate-600">{TEXT.subtitle}</p>
        </div>
        <SyncBadge state={syncState} />
      </header>

      {submitSuccess ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {submitSuccess}
        </p>
      ) : null}
      {submitError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="client_id">
            {TEXT.clientId}
          </label>
          <input
            id="client_id"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('client_id')}
          />
          {errors.client_id?.message ? <p className="text-xs text-red-600">{errors.client_id.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="address_line1">
            {TEXT.addressLine1}
          </label>
          <Controller
            control={control}
            name="address_line1"
            render={({ field }) => (
              <AddressAutocomplete
                id="address_line1"
                value={field.value}
                onChange={field.onChange}
                onSelect={applyAddressSelection}
                placeholder="123 Main St"
              />
            )}
          />
          {errors.address_line1?.message ? <p className="text-xs text-red-600">{errors.address_line1.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="address_line2">
            {TEXT.addressLine2}
          </label>
          <input
            id="address_line2"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('address_line2')}
          />
          {errors.address_line2?.message ? <p className="text-xs text-red-600">{errors.address_line2.message}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="city">
              {TEXT.city}
            </label>
            <input
              id="city"
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('city')}
            />
            {errors.city?.message ? <p className="text-xs text-red-600">{errors.city.message}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-800" htmlFor="province">
              {TEXT.province}
            </label>
            <select
              id="province"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              {...register('province')}
            >
              {CANADIAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.province?.message ? <p className="text-xs text-red-600">{errors.province.message}</p> : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="postal_code">
            {TEXT.postalCode}
          </label>
          <input
            id="postal_code"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('postal_code')}
          />
          {errors.postal_code?.message ? <p className="text-xs text-red-600">{errors.postal_code.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-800" htmlFor="nickname">
            {TEXT.nickname}
          </label>
          <input
            id="nickname"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            {...register('nickname')}
          />
          {errors.nickname?.message ? <p className="text-xs text-red-600">{errors.nickname.message}</p> : null}
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? TEXT.loading : TEXT.action}
        </button>
      </form>
    </section>
  );
};

export default CreatePropertyForm;
