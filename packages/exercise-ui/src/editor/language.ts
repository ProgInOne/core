import type { Extension } from '@codemirror/state';

/**
 * What the code editor needs to know about one language. Each language repository passes its own
 * (D-096): JavaScript gives CodeMirror's JS/HTML/CSS modes and Prettier, Go its Go mode and
 * formatter. The editor itself knows no language.
 */
export interface EditorLanguageSupport {
  /** Stable key (`js`, `html`, `go`), also used to tell whether the language changed. */
  id: string;
  /** Whether a learner file belongs to this language (by path, e.g. `/\.go$/`). */
  matchesPath: (path: string) => boolean;
  /** CodeMirror extension: syntax highlighting, indentation rules, language data. */
  extension: () => Extension;
  /** Indentation inserted by Tab and auto-indent: two spaces by default, `'\t'` for tabs. */
  indentUnit?: string;
  /** Tab width in columns. Default 2. */
  tabSize?: number;
  /**
   * Formats a whole document (the "포맷" command, `⇧⌥F`). Loaded lazily by the language so heavy
   * formatters stay out of the initial bundle. Rejects with {@link FormatError} for code that does
   * not parse. Without it, the editor offers no formatting for this language.
   */
  format?: (code: string) => Promise<string>;
}

/** Formatting failed because the code does not parse. `line` is 1-based when known. */
export class FormatError extends Error {
  readonly line: number | undefined;
  constructor(line: number | undefined) {
    super(
      line === undefined
        ? '코드를 읽을 수 없어 정리하지 못했어요(문법 오류). 코드를 확인해 보세요.'
        : `코드를 읽을 수 없어 정리하지 못했어요(문법 오류). ${line}번째 줄 근처를 확인해 보세요.`,
    );
    this.name = 'FormatError';
    this.line = line;
  }
}

/** The first language whose `matchesPath` accepts `path`, or `null`. */
export function languageForPath(
  languages: readonly EditorLanguageSupport[],
  path: string,
): EditorLanguageSupport | null {
  return languages.find((language) => language.matchesPath(path)) ?? null;
}

/** Plain text: no highlighting, no formatter. Used for files no language claims. */
export const PLAIN_TEXT: EditorLanguageSupport = {
  id: 'text',
  matchesPath: () => true,
  extension: () => [],
};
