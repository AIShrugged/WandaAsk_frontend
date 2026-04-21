export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => {
      return part[0] ?? '';
    })
    .join('')
    .toUpperCase();
}
