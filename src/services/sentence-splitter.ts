// ============================================================
//  MULTILINGUAL SENTENCE SPLITTER — ARUKAS 2
//  High-precision boundary detection for CJK & European scripts
// ============================================================

/**
 * Splits continuous text into clean, coherent sentences across all 11 languages.
 * Preserves sentence integrity without false splitting on abbreviations, decimals, or ellipsis.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  const trimmed = text.trim();

  // Normalize line breaks
  const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 1: Split on explicit line breaks if present
  const paragraphs = normalized.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  const sentences: string[] = [];

  for (const para of paragraphs) {
    // Protect decimals e.g. 18.5, 3.14
    const placeholderMap: Map<string, string> = new Map();

    let protectedPara = para.replace(/(\d+)\.(\d+)/g, (match) => {
      const ph = `__DEC_${placeholderMap.size}__`;
      placeholderMap.set(ph, match);
      return ph;
    });

    // Protect common Latin honorifics/abbreviations
    protectedPara = protectedPara.replace(/\b(Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e|vs|etc|Inc|Ltd|No)\./gi, (match) => {
      const ph = `__ABBR_${placeholderMap.size}__`;
      placeholderMap.set(ph, match);
      return ph;
    });

    // Protect ellipsis ... or ……
    protectedPara = protectedPara.replace(/\.{2,}|…+/g, (match) => {
      const ph = `__ELLIP_${placeholderMap.size}__`;
      placeholderMap.set(ph, match);
      return ph;
    });

    // Boundary regex:
    // 1. CJK sentence enders: 。 | ！ | ？
    // 2. Latin sentence enders: [.!?] followed by space or end of string
    const boundaryRegex = /([。！？]|(?<=[.!?])(?=[\s"'\)\]]|$))/g;

    const tokens = protectedPara.split(boundaryRegex);
    let currentSentence = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;

      currentSentence += token;

      if (
        token === '。' ||
        token === '！' ||
        token === '？' ||
        token === '.' ||
        token === '!' ||
        token === '?'
      ) {
        let restored = currentSentence.trim();
        for (const [ph, orig] of placeholderMap.entries()) {
          restored = restored.split(ph).join(orig);
        }
        if (restored.length > 0) {
          sentences.push(restored);
        }
        currentSentence = '';
      }
    }

    if (currentSentence.trim().length > 0) {
      let restored = currentSentence.trim();
      for (const [ph, orig] of placeholderMap.entries()) {
        restored = restored.split(ph).join(orig);
      }
      if (restored.length > 0) {
        sentences.push(restored);
      }
    }
  }

  // Fallback: If no boundary found, return single trimmed text
  if (sentences.length === 0 && trimmed.length > 0) {
    return [trimmed];
  }

  return sentences;
}
