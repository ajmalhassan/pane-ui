/**
 * Every string, number, and boolean leaf reachable from a value, recursively.
 *
 * This is the walker three separate guards were each carrying their own copy
 * of: the approved-metric tripwire in `lib/content/projects.ts`, the
 * forbidden-fact guard in `tests/unit/ProfileContent.test.ts`, and the
 * no-invented-copy guard in `tests/unit/ResumePage.test.tsx`. Two of the three
 * were identical and the third had quietly lost the number and boolean cases,
 * so the shipped tripwire walked a smaller tree than the tests that were
 * supposed to describe it.
 *
 * What every caller wants is the same thing, and it is why the recursion
 * matters rather than a list of fields: a fact added to `content/profile.ts` or
 * `content/projects.ts` is inside the guard the moment it exists. A
 * hand-maintained list of field references can be added to and not updated;
 * this cannot.
 *
 * Numbers and booleans are stringified rather than skipped because a fact can
 * be authored as one -- a count of engineers, a flag that puts a numeral on a
 * tile face -- and a guard that only reads `typeof value === "string"` would
 * hold an opinion about the type an approved fact is written in.
 *
 * Ordering follows `Object.values`, which is insertion order for string keys.
 * No caller depends on it: every one of them either searches the result or
 * turns it into a `Set`.
 */
export function everyString(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean")
    return [String(value)];
  if (Array.isArray(value)) return value.flatMap(everyString);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(everyString);

  return [];
}
