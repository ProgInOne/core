import { FormatError, type EditorLanguageSupport } from '../editor/language.ts';

/**
 * A stand-in language for editor tests: no highlighting, and a formatter that collapses spaces and
 * rejects code containing `= ;` (as a syntax error on its line).
 */
export const FAKE_LANGUAGE: EditorLanguageSupport = {
  id: 'fake',
  matchesPath: (path) => /\.(js|html|css)$/.test(path),
  extension: () => [],
  format: (code) => {
    const bad = code.split('\n').findIndex((line) => line.includes('= ;'));
    if (bad >= 0) return Promise.reject(new FormatError(bad + 1));
    return Promise.resolve(`${code.replace(/ {2,}/g, ' ').trim()}\n`);
  },
};

/** A tab-indented language without a formatter (shaped like Go). */
export const TAB_LANGUAGE: EditorLanguageSupport = {
  id: 'tabbed',
  matchesPath: (path) => path.endsWith('.go'),
  extension: () => [],
  indentUnit: '\t',
  tabSize: 4,
};
