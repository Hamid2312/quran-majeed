import { Surah, Ayah, QuranPage, QuranLine, TajweedWord } from '../models/Quran';
import { SURAHS } from '../constants/quran';
import { analyzeWordTajweed } from '../utils/tajweedParser';

const API_BASE = 'https://api.quran.com/api/v4';
const surahCache: Map<number, Surah> = new Map();

export async function fetchSurah(surahNumber: number): Promise<Surah> {
  if (surahCache.has(surahNumber)) {
    return surahCache.get(surahNumber)!;
  }

  let allVerses: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(`${API_BASE}/verses/by_chapter/${surahNumber}?words=true&word_fields=text_indopak,line_number,page_number&page=${page}&per_page=50`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Surah ${surahNumber}: ${response.status}`);
    }
    const json = await response.json();
    allVerses = allVerses.concat(json.verses);
    totalPages = json.pagination.total_pages;
    page++;
  } while (page <= totalPages);

  const meta = SURAHS[surahNumber - 1];
  const ayahs: Ayah[] = [];
  const pageMap: Record<number, Record<number, TajweedWord[]>> = {};

  allVerses.forEach((verseData: any) => {
    const rawWords = verseData.words;
    const ayahNumber = verseData.verse_number;
    const globalNumber = verseData.id;
    const juz = verseData.juz_number;
    const ayahPage = verseData.page_number;

    const parsedWords: TajweedWord[] = rawWords.map((w: any, index: number) => {
      // Use standard text_indopak, fallback to empty string if missing
      const text = w.text_indopak || '';
      // Determine next word for rules like Ikhfaa/Idghaam
      const nextWord = index + 1 < rawWords.length ? (rawWords[index + 1].text_indopak || '') : undefined;
      const spans = analyzeWordTajweed(text, nextWord);

      const tWord: TajweedWord = {
        id: w.id,
        text,
        spans,
        lineNumber: w.line_number,
        pageNumber: w.page_number,
        ayahNumber,
        wordIndexInAyah: index,
      };

      // Group into pages and lines
      if (!pageMap[tWord.pageNumber]) pageMap[tWord.pageNumber] = {};
      if (!pageMap[tWord.pageNumber][tWord.lineNumber]) pageMap[tWord.pageNumber][tWord.lineNumber] = [];
      
      pageMap[tWord.pageNumber][tWord.lineNumber].push(tWord);

      return tWord;
    });

    ayahs.push({
      number: ayahNumber,
      globalNumber,
      text: parsedWords.map(w => w.text).join(' '),
      words: parsedWords,
      juz,
      page: ayahPage,
    });
  });

  const pages: QuranPage[] = Object.keys(pageMap).map(Number).sort((a, b) => a - b).map(pageNum => {
    const linesMap = pageMap[pageNum];
    const lines: QuranLine[] = Object.keys(linesMap).map(Number).sort((a, b) => a - b).map(lineNum => ({
      lineNumber: lineNum,
      words: linesMap[lineNum],
    }));
    return { pageNumber: pageNum, lines };
  });

  const surah: Surah = {
    number: surahNumber,
    name: meta.name,
    nameEn: meta.nameEn,
    totalAyahs: meta.totalAyahs,
    revelationType: meta.type as 'Meccan' | 'Medinan',
    ayahs,
    pages,
  };

  surahCache.set(surahNumber, surah);
  return surah;
}

export function getAllSurahsMeta() {
  return SURAHS;
}

export function clearSurahCache() {
  surahCache.clear();
}
