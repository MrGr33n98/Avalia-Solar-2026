export type ProfileDraft = Record<string, unknown>;

export function buildProfilePatch<T extends ProfileDraft>(original: T, draft: T): Partial<T> {
  return Object.keys(draft).reduce<Partial<T>>((patch, key) => {
    if (!Object.is(original[key], draft[key])) {
      patch[key as keyof T] = draft[key] as T[keyof T];
    }
    return patch;
  }, {});
}
