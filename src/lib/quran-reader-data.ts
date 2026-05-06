import { clampQuranPage, findQuranJuz, findQuranPage, getQuranJuzFirstKey, getQuranPageVerseKeys, getSurahMeta, getSurahName } from "@/lib/quran-static-meta"

export const QURAN_READER_CACHE_NAME = "amaly-quran-reader-v1"
export const QURAN_NORMAL_WORDS_URL = "https://static.quranwbw.com/data/v4/words-data/arabic/1.json?version=5"
export const QURAN_MUSHAF_WORDS_URL = "https://static.quranwbw.com/data/v4/words-data/arabic/2.json?version=5"
const QURAN_MUSHAF_FONT_BASE = "https://static.quranwbw.com/data/v4/fonts/Hafs/KFGQPC-v4"
const QURAN_STATIC_ENDPOINT = "https://static.quranwbw.com/data/v4"
const QURAN_CHAPTER_HEADER_FONT_URL = `${QURAN_STATIC_ENDPOINT}/fonts/Extras/chapter-headers/NeoHeader_COLOR-Regular.woff2?version=12`
const QURAN_BISMILLAH_FONT_URL = `${QURAN_STATIC_ENDPOINT}/fonts/Extras/bismillah/qcf-bismillah-normal.woff2?version=13`

type QuranWbwMushafWords = Record<string, Record<string, [string[], number[], string[], number[], string[]?, string[]?]>>

export type QuranReaderVerse = {
  ayah: number
  key: string
  page: number
  revelation: 1 | 2
  surah: number
  surahName: string
}

export type QuranReaderWord = {
  ayah: number
  glyphText?: string
  isEndMarker?: boolean
  key: string
  text: string
  surah: number
  surahName: string
  verse: QuranReaderVerse
}

export type QuranReaderLine = {
  centered: boolean
  chapterStart?: QuranReaderChapterStart
  line: number
  words: QuranReaderWord[]
}

export type QuranReaderChapterStart = {
  firstAyah: number
  line: number
  revelation: 1 | 2
  showBismillah: boolean
  surah: number
  surahName: string
}

export type QuranReaderPage = {
  firstAyah: number
  firstSurah: number
  juz: number
  lastAyah: number
  lastSurah: number
  lines: QuranReaderLine[]
  page: number
  verses: QuranReaderVerse[]
}

export type QuranReaderNavigationItem = {
  ayah: number
  label: string
  page: number
  value: number
}

let mushafWordsPromise: Promise<QuranWbwMushafWords> | null = null
const mushafFontPromises = new Map<number, Promise<string>>()
let chapterHeaderFontPromise: Promise<string> | null = null
let bismillahFontPromise: Promise<string> | null = null

export const QURAN_BISMILLAH_CODES = {
  default: "ﲪﲫﲮﲴ",
  baqarah: "ﲚﲛﲞﲤ",
  special: "ﭗﲫﲮﲴ",
}

export const QURAN_CHAPTER_HEADER_CODES = [
  "", "ﱅ ", "ﱆ ", "ﱇ ", "ﱊ ", "ﱋ ", "ﱎ ", "ﱏ ", "ﱑ ", "ﱒ ", "ﱓ ", "ﱕ ", "ﱖ ", "ﱘ ", "ﱚ ", "ﱛ ", "ﱜ ", "ﱝ ", "ﱞ ", "ﱡ ", "ﱢ ", "ﱤ ", "ﭑ ", "ﭒ ", "ﭔ ", "ﭕ ", "ﭗ ", "ﭘ ", "ﭚ ", "ﭛ ", "ﭝ ", "ﭞ ", "ﭠ ", "ﭡ ", "ﭣ ", "ﭤ ", "ﭦ ", "ﭧ ", "ﭩ ", "ﭪ ", "ﭬ ", "ﭭ ", "ﭯ ", "ﭰ ", "ﭲ ", "ﭳ ", "ﭵ ", "ﭶ ", "ﭸ ", "ﭹ ", "ﭻ ", "ﭼ ", "ﭾ ", "ﭿ ", "ﮁ ", "ﮂ ", "ﮄ ", "ﮅ ", "ﮇ ", "ﮈ ", "ﮊ ", "ﮋ ", "ﮍ ", "ﮎ ", "ﮐ ", "ﮑ ", "ﮓ ", "ﮔ ", "ﮖ ", "ﮗ ", "ﮙ ", "ﮚ ", "ﮜ ", "ﮝ ", "ﮟ ", "ﮠ ", "ﮢ ", "ﮣ ", "ﮥ ", "ﮦ ", "ﮨ ", "ﮩ ", "ﮫ ", "ﮬ ", "ﮮ ", "ﮯ ", "ﮱ ", "﮲ ", "﮴ ", "﮵ ", "﮷ ", "﮸ ", "﮺ ", "﮻ ", "﮽ ", "﮾ ", "﯀ ", "﯁ ", "ﯓ ", "ﯔ ", "ﯖ ", "ﯗ ", "ﯙ ", "ﯚ ", "ﯜ ", "ﯝ ", "ﯟ ", "ﯠ ", "ﯢ ", "ﯣ ", "ﯥ ", "ﯦ ", "ﯨ ", "ﯩ ", "ﯫ",
]

const centeredPageLines = new Set([
  "1:9", "1:10", "1:11", "1:12", "1:13", "1:14", "1:15", "2:10", "2:11", "2:12", "2:13", "2:14", "2:15", "255:2", "528:9", "534:6", "545:6", "586:1", "593:2", "594:5", "600:10", "602:5", "602:11", "602:15", "603:10", "603:15", "604:4", "604:9", "604:14", "604:15",
])

function clampPage(page: number) {
  return clampQuranPage(page)
}

async function fetchWithCache(url: string) {
  const cache = "caches" in window ? await caches.open(QURAN_READER_CACHE_NAME) : null

  try {
    const response = await fetch(url)
    if (response.ok) {
      await cache?.put(url, response.clone())
      return response
    }
  } catch {
    // Fall through to cached data so reader still works offline after first load.
  }

  const cached = await cache?.match(url)
  if (cached) return cached
  throw new Error("Quran data is not available offline yet. Open the reader once while online to cache it.")
}

export async function loadMushafWords() {
  mushafWordsPromise ??= Promise.all([
    fetchWithCache(QURAN_NORMAL_WORDS_URL).then((response) => response.json() as Promise<QuranWbwMushafWords>),
    fetchWithCache(QURAN_MUSHAF_WORDS_URL).then((response) => response.json() as Promise<QuranWbwMushafWords>),
  ]).then(([normalWords, mushafWords]) => {
    const merged: QuranWbwMushafWords = {}

    Object.entries(mushafWords).forEach(([surah, verses]) => {
      merged[surah] = {}
      Object.entries(verses).forEach(([ayah, mushafData]) => {
        const normalData = normalWords[surah]?.[ayah]
        merged[surah][ayah] = normalData
          ? [normalData[0], mushafData[1], normalData[2], mushafData[3], mushafData[0], mushafData[2]]
          : mushafData
      })
    })

    return merged
  })
  return mushafWordsPromise
}

export function getMushafFontName(page: number) {
  return `p${clampPage(page)}`
}

export function getMushafFontUrl(page: number) {
  const paddedPage = String(clampPage(page)).padStart(3, "0")
  return `${QURAN_MUSHAF_FONT_BASE}/COLRv1/QCF4${paddedPage}_COLOR-Regular.woff2?version=12`
}

export async function loadMushafFont(page: number) {
  const safePage = clampPage(page)
  const cached = mushafFontPromises.get(safePage)
  if (cached) return cached

  const request = (async () => {
    if (typeof document === "undefined" || !("fonts" in document)) return getMushafFontName(safePage)

    const fontName = getMushafFontName(safePage)
    const font = new FontFace(fontName, `url(${getMushafFontUrl(safePage)})`)
    const loadedFont = await font.load()
    document.fonts.add(loadedFont)
    return fontName
  })()

  mushafFontPromises.set(safePage, request)
  return request
}

function loadNamedFont(name: string, url: string) {
  if (typeof document === "undefined" || !("fonts" in document)) return Promise.resolve(name)

  return new FontFace(name, `url(${url})`).load().then((font) => {
    document.fonts.add(font)
    return name
  })
}

export function loadChapterHeaderFont() {
  chapterHeaderFontPromise ??= loadNamedFont("chapter-headers", QURAN_CHAPTER_HEADER_FONT_URL)
  return chapterHeaderFontPromise
}

export function loadBismillahFont() {
  bismillahFontPromise ??= loadNamedFont("bismillah", QURAN_BISMILLAH_FONT_URL)
  return bismillahFontPromise
}

export async function getQuranReaderPage(page: number): Promise<QuranReaderPage> {
  const safePage = clampPage(page)
  const mushafWords = await loadMushafWords()
  const keys = getQuranPageVerseKeys(safePage)
  const firstKey = keys[0] ?? { surah: 1, ayah: 1 }
  const lastKey = keys[keys.length - 1] ?? firstKey
  const verses = keys.map(({ surah, ayah }) => ({
    ayah,
    key: `${surah}:${ayah}`,
    page: safePage,
    revelation: getSurahMeta(surah).revelation,
    surah,
    surahName: getSurahName(surah),
  }))
  const verseMap = new Map(verses.map((verse) => [verse.key, verse]))
  const lineMap = new Map<number, QuranReaderWord[]>()
  const chapterStartMap = new Map<number, QuranReaderChapterStart>()

  keys.forEach(({ surah, ayah }) => {
    const verse = verseMap.get(`${surah}:${ayah}`)
    const wordData = mushafWords[String(surah)]?.[String(ayah)]
    if (!verse || !wordData) return

    const [words, lines, endIcons, endLines, glyphWords, glyphEndIcons] = wordData
    if (ayah === 1 && lines[0] && !chapterStartMap.has(lines[0])) {
      chapterStartMap.set(lines[0], {
        firstAyah: ayah,
        line: lines[0],
        revelation: verse.revelation,
        showBismillah: surah !== 1 && surah !== 9,
        surah,
        surahName: verse.surahName,
      })
    }

    words.forEach((word, index) => {
      const line = lines[index]
      if (!lineMap.has(line)) lineMap.set(line, [])
      lineMap.get(line)?.push({
        ayah,
        glyphText: glyphWords?.[index],
        key: `${surah}:${ayah}:${index + 1}`,
        text: word,
        surah,
        surahName: verse.surahName,
        verse,
      })
    })

    const endIcon = endIcons[0]
    const glyphEndIcon = glyphEndIcons?.[0]
    const endLine = endLines[0]
    if (endIcon && endLine) {
      if (!lineMap.has(endLine)) lineMap.set(endLine, [])
      lineMap.get(endLine)?.push({
        ayah,
        glyphText: glyphEndIcon,
        isEndMarker: true,
        key: `${surah}:${ayah}:end`,
        text: `۝${ayah}`,
        surah,
        surahName: verse.surahName,
        verse,
      })
    }
  })
  const lineNumbers = Array.from(lineMap.keys()).sort((a, b) => a - b)
  const firstLine = lineNumbers[0] ?? 1
  const lastLine = lineNumbers[lineNumbers.length - 1] ?? 15
  const lines = Array.from({ length: lastLine - firstLine + 1 }, (_, index) => {
    const line = firstLine + index
    return {
      centered: centeredPageLines.has(`${safePage}:${line}`),
      chapterStart: chapterStartMap.get(line),
      line,
      words: lineMap.get(line) ?? [],
    }
  })

  return {
    firstAyah: firstKey.ayah,
    firstSurah: firstKey.surah,
    juz: findQuranJuz(firstKey.surah, firstKey.ayah),
    lastAyah: lastKey.ayah,
    lastSurah: lastKey.surah,
    lines,
    page: safePage,
    verses,
  }
}

export function getQuranReaderSurahNavigation(): QuranReaderNavigationItem[] {
  return Array.from({ length: 114 }, (_, index) => {
    const surah = index + 1
    const meta = getSurahMeta(surah)
    return {
      ayah: 1,
      label: meta.transliteration,
      page: findQuranPage(surah, 1),
      value: surah,
    }
  })
}

export function getQuranReaderJuzNavigation(): QuranReaderNavigationItem[] {
  return Array.from({ length: 30 }, (_, index) => {
    const juz = index + 1
    const firstKey = getQuranJuzFirstKey(juz)
    return {
      ayah: firstKey.ayah,
      label: `Juz ${juz}`,
      page: findQuranPage(firstKey.surah, firstKey.ayah),
      value: juz,
    }
  })
}
