import { renderScoreDescription } from '@/features/analysis/lib/score';

describe('renderScoreDescription', () => {
  it('returns low-score hint when percentage is 0', () => {
    expect(renderScoreDescription(0, 100)).toBe(
      'Необходима серьёзная проработка всех этапов разговора.',
    );
  });

  it('returns low-score hint when percentage is below 40', () => {
    expect(renderScoreDescription(39, 100)).toBe(
      'Необходима серьёзная проработка всех этапов разговора.',
    );
  });

  it('returns below-average hint at exactly 40%', () => {
    expect(renderScoreDescription(40, 100)).toBe(
      'Требуется адресная работа над структурой и аргументацией.',
    );
  });

  it('returns below-average hint between 40 and 55', () => {
    expect(renderScoreDescription(54, 100)).toBe(
      'Требуется адресная работа над структурой и аргументацией.',
    );
  });

  it('returns stable hint at exactly 55%', () => {
    expect(renderScoreDescription(55, 100)).toBe(
      'Стабильный результат: важно доработать ключевые блоки.',
    );
  });

  it('returns stable hint between 55 and 70', () => {
    expect(renderScoreDescription(69, 100)).toBe(
      'Стабильный результат: важно доработать ключевые блоки.',
    );
  });

  it('returns confident hint at exactly 70%', () => {
    expect(renderScoreDescription(70, 100)).toBe(
      'Уверенная встреча с заметными точками усиления.',
    );
  });

  it('returns confident hint between 70 and 85', () => {
    expect(renderScoreDescription(84, 100)).toBe(
      'Уверенная встреча с заметными точками усиления.',
    );
  });

  it('returns expert hint at exactly 85%', () => {
    expect(renderScoreDescription(85, 100)).toBe(
      'Экспертный уровень исполнения методологии Stayfitt.',
    );
  });

  it('returns expert hint at 100%', () => {
    expect(renderScoreDescription(100, 100)).toBe(
      'Экспертный уровень исполнения методологии Stayfitt.',
    );
  });

  it('caps totalScore at maxTotalScore before calculating', () => {
    // 150 / 100 would be 150%, capped to 100% → expert
    expect(renderScoreDescription(150, 100)).toBe(
      'Экспертный уровень исполнения методологии Stayfitt.',
    );
  });

  it('returns low-score hint when maxTotalScore is 0 (division by zero → NaN → clamped to 0)', () => {
    expect(renderScoreDescription(0, 0)).toBe(
      'Необходима серьёзная проработка всех этапов разговора.',
    );
  });

  it('works with non-integer max values', () => {
    // 7.5 / 10 = 75% → confident
    expect(renderScoreDescription(7.5, 10)).toBe(
      'Уверенная встреча с заметными точками усиления.',
    );
  });
});
