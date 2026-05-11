import { TajweedRuleId, QALQALAH_LETTERS, IKHFAA_LETTERS, IDGHAAM_LETTERS, IDGHAAM_GHUNNAH_LETTERS } from '../constants/tajweed';
import { TajweedSpan, TajweedWord } from '../models/Quran';

// Arabic Unicode ranges
const ARABIC_VOWELS = /[\u064B-\u065F\u0670]/g;   // harakat
const SHADDA = '\u0651';
const NOON = '\u0646';
const MEEM = '\u0645';
const TANWEEN_CHARS = ['\u064B', '\u064C', '\u064D']; // tanween fath/damm/kasr

/** Strip harakat for letter-level rule detection */
function stripHarakat(text: string): string {
  return text.replace(ARABIC_VOWELS, '');
}

/** Check if a character (stripped) is a Qalqalah letter */
function isQalqalah(char: string): boolean {
  return QALQALAH_LETTERS.includes(char);
}

/** Detect Ghunnah: Noon or Meem with shadda */
function hasGhunnah(word: string): boolean {
  for (let i = 0; i < word.length - 1; i++) {
    const c = word[i];
    const next = word[i + 1];
    if ((c === NOON || c === MEEM) && next === SHADDA) return true;
  }
  return false;
}

/** Detect Madd: long vowel alef ا / waw و / yaa ي preceded by its matching short vowel */
function hasMadd(word: string): boolean {
  return /[\u0627\u0648\u064A]/.test(word); // simplified: presence of alef, waw, or yaa
}

/** Detect Tanween+Noon for Ikhfaa, Idghaam */
function hasTanween(word: string): boolean {
  return TANWEEN_CHARS.some(t => word.includes(t));
}

/**
 * Apply a rule-based Tajweed analysis to a single Arabic word.
 * Returns an array of TajweedSpans describing color regions.
 *
 * NOTE: This is a simplified heuristic engine. For production accuracy,
 * replace with a pre-tagged XML/JSON Tajweed dataset from tanzil.net.
 */
export function analyzeWordTajweed(word: string, nextWord?: string): TajweedSpan[] {
  const spans: TajweedSpan[] = [];

  // Whole-word Ghunnah
  if (hasGhunnah(word)) {
    spans.push({ start: 0, end: word.length, rule: 'ghunnah' });
    return spans; // dominant rule
  }

  // Madd (whole word)
  if (hasMadd(word)) {
    spans.push({ start: 0, end: word.length, rule: 'madd' });
  }

  // Qalqalah — last bare consonant
  const stripped = stripHarakat(word);
  const lastChar = stripped[stripped.length - 1];
  if (isQalqalah(lastChar)) {
    spans.push({ start: word.length - 1, end: word.length, rule: 'qalqalah' });
  }

  // Tanween → check next word first letter for Idghaam / Ikhfaa
  if (hasTanween(word) && nextWord) {
    const nextStripped = stripHarakat(nextWord);
    const firstNext = nextStripped[0];
    if (IDGHAAM_GHUNNAH_LETTERS.includes(firstNext)) {
      spans.push({ start: 0, end: word.length, rule: 'idghaam' });
    } else if (IKHFAA_LETTERS.includes(firstNext)) {
      spans.push({ start: 0, end: word.length, rule: 'ikhfaa' });
    }
  }

  return spans.length > 0 ? spans : [{ start: 0, end: word.length, rule: 'none' }];
}


