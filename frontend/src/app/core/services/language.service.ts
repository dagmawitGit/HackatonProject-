import { Injectable, signal } from '@angular/core';

export type LangCode = 'en' | 'om' | 'am';

const DICT: Record<LangCode, Record<string, string>> = {
  en: {
    tagline: 'Track Every Contribution. Protect Every Round.',
    ledger: 'Digital record book for contributions and payouts. Amounts are recorded figures; no funds are sent.',
    login: 'Log in',
    register: 'Register',
    logout: 'Log out',
    dashboard: 'Dashboard',
    members: 'Members',
    round: 'Current round',
    payout: 'Payout',
    ledgerNav: 'Contribution ledger',
    history: 'Round history',
    summary: 'Summary',
    profile: 'Profile',
    notifications: 'Notifications',
    create: 'Create equb',
    start: 'Start equb',
    users: 'Users',
    equbs: 'Equbs',
    reports: 'Reports',
    audit: 'Audit logs',
    monitoring: 'Monitoring',
    pot: 'Current pot',
    paid: 'Paid',
    receiver: 'Receiver',
    status: 'Status',
  },
  om: {
    tagline: 'Gumaacha hunda hordofi. Marsaa hunda eegi.',
    ledger: 'Galmee gumaachaa fi kaffaltii ti. Maallaqa hin ergu.',
    login: 'Seeni',
    register: 'Galmaa\'i',
    logout: 'Ba\'i',
    dashboard: 'Gabatee',
    members: 'Miseensota',
    round: 'Marsaa ammaa',
    payout: 'Kaffaltii',
    ledgerNav: 'Galmee gumaachaa',
    history: 'Seenaa marsaa',
    summary: 'Cuunfaa',
    profile: 'Eenyummaa',
    notifications: 'Beeksisa',
    create: 'Equb uumi',
    start: 'Equb jalqabi',
    users: 'Fayyadamtoota',
    equbs: 'Equbota',
    reports: 'Gabaasa',
    audit: 'Galmee sakatta\'aa',
    monitoring: 'Hordoffii',
    pot: 'Qabduu ammaa',
    paid: 'Kaffalame',
    receiver: 'Fudhataa',
    status: 'Haala',
  },
  am: {
    tagline: 'እያንዳንዱን መዋጮ ተከታተል። እያንዳንዱን ዙር ጠብቅ።',
    ledger: 'የመዋጮና የክፍያ ዲጂታል መዝገብ ነው። ገንዘብ አይላክም።',
    login: 'ግባ',
    register: 'ተመዝገብ',
    logout: 'ውጣ',
    dashboard: 'ዳሽቦርድ',
    members: 'አባላት',
    round: 'የአሁኑ ዙር',
    payout: 'ክፍያ',
    ledgerNav: 'የመዋጮ መዝገብ',
    history: 'የዙር ታሪክ',
    summary: 'ማጠቃለያ',
    profile: 'መገለጫ',
    notifications: 'ማሳወቂያዎች',
    create: 'እቁብ ፍጠር',
    start: 'እቁብ ጀምር',
    users: 'ተጠቃሚዎች',
    equbs: 'እቁቦች',
    reports: 'ሪፖርቶች',
    audit: 'የኦዲት መዝገብ',
    monitoring: 'ክትትል',
    pot: 'የአሁኑ ማሰሮ',
    paid: 'የተከፈለ',
    receiver: 'ተቀባይ',
    status: 'ሁኔታ',
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<LangCode>((localStorage.getItem('ekub-lang') as LangCode) || 'en');

  t(key: string): string {
    const lang = this.lang();
    return DICT[lang][key] ?? DICT.en[key] ?? key;
  }

  set(lang: LangCode): void {
    localStorage.setItem('ekub-lang', lang);
    this.lang.set(lang);
  }
}
