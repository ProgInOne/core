// Structural guards for untrusted JSON (content, AI output, learner answers) that run before zod.

/** Default nesting limit for untrusted input. */
export const MAX_INPUT_DEPTH = 64;

/**
 * Returns false when `value` nests deeper than `maxDepth`. Iterative, so hostile input cannot
 * overflow the stack before zod (which recurses) sees it.
 */
export function withinDepth(value: unknown, maxDepth = MAX_INPUT_DEPTH): boolean {
  const stack: [unknown, number][] = [[value, 0]];
  let visited = 0;
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === undefined) break;
    const [current, depth] = top;
    if (depth > maxDepth) return false;
    if (++visited > 2_000_000) return false;
    if (current !== null && typeof current === 'object') {
      for (const child of Object.values(current)) stack.push([child, depth + 1]);
    }
  }
  return true;
}

/**
 * True when any object in `value` has an own `__proto__` key. `JSON.parse` creates such keys and
 * zod's record parser would turn them into a prototype assignment, so boundaries reject them.
 */
export function hasProtoKey(value: unknown): boolean {
  const stack: unknown[] = [value];
  let visited = 0;
  while (stack.length > 0) {
    const current = stack.pop();
    if (++visited > 2_000_000) return true;
    if (current !== null && typeof current === 'object') {
      if (Object.hasOwn(current, '__proto__')) return true;
      for (const child of Object.values(current)) stack.push(child);
    }
  }
  return false;
}
