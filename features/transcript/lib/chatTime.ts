/**
 * formatChatTime.
 * @param seconds - seconds.
 * @returns Result.
 */
export function formatChatTime(seconds: number) {
  const secs = Math.floor(seconds);
  const ms = Math.round((seconds - secs) * 1000)
    .toString()
    .padStart(3, '0')
    .slice(0, 2);
  const minutes = Math.floor(secs / 60);
  const secondsPart = (secs % 60).toString().padStart(2, '0');

  if (minutes < 60) {
    return `${minutes.toString().padStart(2, '0')}:${secondsPart}.${ms}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = (minutes % 60).toString().padStart(2, '0');

    return `${hours}:${mins}:${secondsPart}.${ms}`;
  }
}
