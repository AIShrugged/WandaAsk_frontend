/**
 * countScoreHint.
 * @param percentage - percentage.
 * @returns Result.
 */
function countScoreHint(percentage: number) {
  if (percentage >= 85) {
    return 'Экспертный уровень исполнения методологии Stayfitt.';
  }

  if (percentage >= 70) {
    return 'Уверенная встреча с заметными точками усиления.';
  }

  if (percentage >= 55) {
    return 'Стабильный результат: важно доработать ключевые блоки.';
  }

  if (percentage >= 40) {
    return 'Требуется адресная работа над структурой и аргументацией.';
  }

  return 'Необходима серьёзная проработка всех этапов разговора.';
}

/**
 * clampPercentage.
 * @param value - value.
 * @returns Result.
 */
function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.min(100, value));
}

/**
 * renderScoreDescription.
 * @param totalScore
 * @param maxTotalScore
 */
export function renderScoreDescription(
  totalScore: number,
  maxTotalScore: number,
) {
  const cappedScore = Math.min(totalScore, maxTotalScore);

  const percentage = clampPercentage((cappedScore / maxTotalScore) * 100);

  return countScoreHint(percentage);
}
