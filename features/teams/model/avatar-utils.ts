const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-pink-500',
];

/**
 * initials — generate avatar initials from a name.
 * @param name - Full name.
 * @returns Up to 2 uppercase initials.
 */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => {
      return w[0];
    })
    .join('')
    .toUpperCase();
}

/**
 * avatarColor — deterministic Tailwind bg class from name hash.
 * @param name - Member name.
 * @returns Tailwind bg class string.
 */
export function avatarColor(name: string): string {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.codePointAt(i)!) % AVATAR_COLORS.length;
  }

  return AVATAR_COLORS[hash];
}
