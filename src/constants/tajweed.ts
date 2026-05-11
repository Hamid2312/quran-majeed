import { Colors } from './colors';

export type TajweedRuleId =
  | 'ghunnah'
  | 'madd'
  | 'idghaam'
  | 'ikhfaa'
  | 'qalqalah'
  | 'iqlaab'
  | 'hamzaWasl'
  | 'none';

export interface TajweedRuleDefinition {
  id: TajweedRuleId;
  label: string;
  labelAr: string;
  color: string;
  description: string;
}

export const TAJWEED_RULES: Record<TajweedRuleId, TajweedRuleDefinition> = {
  ghunnah: {
    id: 'ghunnah',
    label: 'Ghunnah',
    labelAr: 'غنة',
    color: Colors.tajweedGhunnah,
    description: 'Nasal sound on ن or م',
  },
  madd: {
    id: 'madd',
    label: 'Madd',
    labelAr: 'مد',
    color: Colors.tajweedMadd,
    description: 'Elongation of vowel sounds',
  },
  idghaam: {
    id: 'idghaam',
    label: 'Idghaam',
    labelAr: 'إدغام',
    color: Colors.tajweedIdghaam,
    description: 'Merging of letters',
  },
  ikhfaa: {
    id: 'ikhfaa',
    label: 'Ikhfaa',
    labelAr: 'إخفاء',
    color: Colors.tajweedIkhfaa,
    description: 'Concealment / hidden sound',
  },
  qalqalah: {
    id: 'qalqalah',
    label: 'Qalqalah',
    labelAr: 'قلقلة',
    color: Colors.tajweedQalqalah,
    description: 'Echo / vibration sound',
  },
  iqlaab: {
    id: 'iqlaab',
    label: 'Iqlaab',
    labelAr: 'إقلاب',
    color: Colors.tajweedIqlaab,
    description: 'Conversion of ن to م sound',
  },
  hamzaWasl: {
    id: 'hamzaWasl',
    label: 'Hamzat Wasl',
    labelAr: 'همزة الوصل',
    color: Colors.tajweedHamzaWasl,
    description: 'Connecting Hamza (silent when mid-speech)',
  },
  none: {
    id: 'none',
    label: 'Normal',
    labelAr: '',
    color: Colors.textArabic,
    description: 'No special rule',
  },
};

// Letters that trigger Qalqalah
export const QALQALAH_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];

// Letters that allow Idghaam (without Ghunnah)
export const IDGHAAM_LETTERS = ['ل', 'ر'];

// Letters that allow Idghaam (with Ghunnah)
export const IDGHAAM_GHUNNAH_LETTERS = ['ي', 'ن', 'م', 'و'];

// Ikhfaa letters
export const IKHFAA_LETTERS = ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'];
