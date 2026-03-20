import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../lib/auth';
import { getProfileUpdateSchema, ProfileUpdateSchema } from '../schemas/profile';
import type { z } from 'zod';
import { PageLoader } from '../components/ui/PageLoader';
import { profileRepository } from '../repositories/profileRepository';

type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile, subscriptionStatus, trialDaysRemaining } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasSaveAttempted, setHasSaveAttempted] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [notifState, setNotifState] = useState({
    jobApprovals: true,
    invoicePaid: true,
    overdue: true,
    marketing: false,
  });

  // Memoize schema to prevent re-creation on every render
  const schema = useMemo(() => getProfileUpdateSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (profile) {
      const fullName = profile.full_name?.trim() ?? '';
      const [first = '', ...rest] = fullName.split(/\s+/);
      setFirstName(first);
      setLastName(rest.join(' '));
      reset({
        full_name: profile.full_name ?? '',
        business_name: profile.business_name ?? '',
      });
    }
    setLoading(false);
  }, [user, profile, reset]);

  const onSubmit = async (data: ProfileUpdateInput) => {
    if (!user) return;
    setHasSaveAttempted(true);
    setSaving(true);
    setMessage(null);
    try {
      const combinedFullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ').trim();
      const { error } = await profileRepository.update(user.id, {
        ...data,
        full_name: combinedFullName || data.full_name,
      });

      if (error) {
        throw error;
      }

      // Refresh the profile in AuthContext so other pages get updated data
      await refreshProfile();
      setMessage({ type: 'success', text: t('settings.profile.success') });
    } catch {
      setMessage({ type: 'error', text: t('settings.profile.error') });
    } finally {
      setSaving(false);
    }
  };

  const isFrench = (i18n?.language ?? 'en').startsWith('fr');
  const subscriptionLabel = subscriptionStatus ? t(`billing.status.${subscriptionStatus}`) : t('billing.status.trialing');
  const stripeConnected = Boolean(profile?.stripe_connect_id || profile?.stripe_connect_onboarded);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-5 text-[19px] font-bold text-[#0F172A]">{t('settings.title')}</h1>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{t('settings.profile.title')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#0F172A] bg-white shadow-brutal">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-[160px_1fr_auto] items-center gap-3 border-b border-[#F1F5F9] px-[18px] py-[13px]">
              <label htmlFor="firstName" className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748B]">{t('settings.fields.firstName')}</label>
              <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-9 w-full rounded-[7px] border-[1.5px] border-[#CBD5E1] bg-[hsl(220_20%_97%)] px-3 text-[13px] text-[#0F172A]" />
              <div />
            </div>
            <div className="grid grid-cols-[160px_1fr_auto] items-center gap-3 border-b border-[#F1F5F9] px-[18px] py-[13px]">
              <label htmlFor="lastName" className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748B]">{t('settings.fields.lastName')}</label>
              <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-9 w-full rounded-[7px] border-[1.5px] border-[#CBD5E1] bg-[hsl(220_20%_97%)] px-3 text-[13px] text-[#0F172A]" />
              <div />
            </div>
            <div className="grid grid-cols-[160px_1fr_auto] items-center gap-3 border-b border-[#F1F5F9] px-[18px] py-[13px]">
              <label htmlFor="business_name" className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748B]">{t('settings.profile.businessName')}</label>
              <input id="business_name" type="text" {...register('business_name')} className="h-9 w-full rounded-[7px] border-[1.5px] border-[#CBD5E1] bg-[hsl(220_20%_97%)] px-3 text-[13px] text-[#0F172A]" />
              <div />
            </div>
            <div className="grid grid-cols-[160px_1fr_auto] items-center gap-3 px-[18px] py-[13px]">
              <div />
              <div />
              <button type="submit" disabled={saving} className="h-[30px] rounded-[5px] border border-[#0F172A] bg-[#FF5C1B] px-3 text-[11px] font-bold text-[#1F1308]">
                {saving ? t('settings.profile.saving') : t('settings.profile.save')}
              </button>
            </div>
            {(errors.full_name || errors.business_name || (hasSaveAttempted && message)) ? (
              <div className={`mx-[18px] mb-[13px] rounded-md px-3 py-2 text-xs ${message?.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {errors.full_name?.message || errors.business_name?.message || message?.text}
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{t('settings.sections.language')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#0F172A] bg-white shadow-brutal">
          <div className="grid grid-cols-[160px_1fr_auto] items-center gap-3 px-[18px] py-[13px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748B]">{t('settings.sections.interfaceLanguage')}</div>
            <div className="inline-flex">
              <button type="button" onClick={() => i18n.changeLanguage('en').catch(() => {})} className={`h-[34px] border-[1.5px] border-[#0F172A] px-4 text-xs font-semibold ${!isFrench ? 'bg-[#0F172A] text-white' : 'bg-white text-[#64748B]'}`}>EN</button>
              <button type="button" onClick={() => i18n.changeLanguage('fr').catch(() => {})} className={`h-[34px] border-[1.5px] border-l-0 border-[#0F172A] px-4 text-xs font-semibold ${isFrench ? 'bg-[#0F172A] text-white' : 'bg-white text-[#64748B]'}`}>FR</button>
            </div>
            <div />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{t('settings.sections.notifications')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#0F172A] bg-white shadow-brutal">
          {([
            ['jobApprovals', t('settings.notifications.jobApprovals.title'), t('settings.notifications.jobApprovals.description')],
            ['invoicePaid', t('settings.notifications.invoicePaid.title'), t('settings.notifications.invoicePaid.description')],
            ['overdue', t('settings.notifications.overdue.title'), t('settings.notifications.overdue.description')],
            ['marketing', t('settings.notifications.marketing.title'), t('settings.notifications.marketing.description')],
          ] as const).map(([key, title, description]) => {
            const isOn = notifState[key];
            return (
              <div key={key} className="flex items-center justify-between border-b border-[#F1F5F9] px-[18px] py-[13px] last:border-b-0">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748B]">{title}</div>
                  <div className={`text-xs ${isOn ? 'text-[#374151]' : 'text-[#94A3B8]'}`}>{description}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  onClick={() => setNotifState((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`relative h-[22px] w-[40px] rounded-full ${isOn ? 'bg-[#0F172A]' : 'bg-[#CBD5E1]'}`}
                >
                  <span className={`absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{t('settings.sections.billing')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#0F172A] bg-white shadow-brutal">
          <div className="flex items-center justify-between gap-3 px-[18px] py-4">
            <div>
              <div className="text-[15px] font-bold text-[#0F172A]">{t('billing.title')}</div>
              <div className="text-xs text-[#64748B]">{subscriptionLabel}{subscriptionStatus === 'trialing' ? ` • ${trialDaysRemaining}d` : ''}</div>
            </div>
            <a href="/settings/billing" className="rounded-[6px] border-[1.5px] border-[#0F172A] px-3 py-1.5 text-[11px] font-bold text-[#0F172A] shadow-brutal">{t('billing.manage')}</a>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{t('settings.sections.stripe')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#0F172A] bg-white shadow-brutal">
          <div className="flex items-center justify-between gap-3 px-[18px] py-4">
            <div>
              <div className="text-[13px] font-bold text-[#0F172A]">{stripeConnected ? t('settings.stripe.connected') : t('settings.stripe.incomplete')}</div>
              <div className="text-xs text-[#94A3B8]">{profile?.stripe_connect_id ?? t('settings.stripe.cta')}</div>
            </div>
            <a href="/settings/stripe" className="h-[30px] rounded-[5px] border-[1.5px] border-[#FF5C1B] px-3 py-1.5 text-[11px] font-bold text-[#FF5C1B]">{stripeConnected ? t('settings.stripe.managePayouts') : t('settings.stripe.retry')}</a>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{t('settings.sections.passwordSecurity')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#0F172A] bg-white shadow-brutal">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] px-[18px] py-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748B]">{t('settings.profile.email')}</div>
              <div className="text-[13px] text-[#0F172A]">{user?.email ?? ''}</div>
            </div>
            <button type="button" className="h-[30px] rounded-[5px] border-[1.5px] border-[#FF5C1B] px-3 text-[11px] font-bold text-[#FF5C1B]">{t('settings.actions.change')}</button>
          </div>
          <div className="flex items-center justify-between px-[18px] py-[13px]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748B]">{t('settings.sections.password')}</div>
              <div className="text-xs text-[#94A3B8]">{t('settings.password.lastChanged')}</div>
            </div>
            <button type="button" className="h-[30px] rounded-[5px] border-[1.5px] border-[#FF5C1B] px-3 text-[11px] font-bold text-[#FF5C1B]">{t('settings.actions.reset')}</button>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{t('settings.sections.privacy')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#0F172A] bg-white shadow-brutal">
          <div className="px-[18px] py-[14px]">
            <p className="mb-3 text-xs leading-relaxed text-[#64748B]">{t('settings.privacy.body')}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-[6px] border-[1.5px] border-[#0F172A] px-3 py-1.5 text-[11px] font-bold text-[#0F172A] shadow-brutal">{t('settings.privacy.export')}</button>
              <button type="button" className="rounded-[6px] border-[1.5px] border-[#0F172A] px-3 py-1.5 text-[11px] font-bold text-[#0F172A] shadow-brutal">{t('settings.privacy.policy')}</button>
              <button type="button" className="rounded-[6px] border-[1.5px] border-[#0F172A] px-3 py-1.5 text-[11px] font-bold text-[#0F172A] shadow-brutal">{t('settings.privacy.contact')}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 pl-[2px] text-[10px] font-bold uppercase tracking-[1px] text-[#EF4444]">{t('settings.sections.danger')}</p>
        <div className="overflow-hidden rounded-[10px] border-2 border-[#EF4444] bg-white shadow-brutal-red">
          <div className="flex items-center justify-between gap-3 px-[18px] py-[14px]">
            <div>
              <div className="text-[13px] font-semibold text-[#0F172A]">{t('settings.danger.title')}</div>
              <div className="mt-0.5 text-[11px] text-[#94A3B8]">{t('settings.danger.description')}</div>
            </div>
            <button type="button" className="rounded-[6px] border-[1.5px] border-[#EF4444] bg-transparent px-3 py-1.5 text-[11px] font-bold text-[#EF4444]">{t('settings.danger.delete')}</button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default SettingsPage;
