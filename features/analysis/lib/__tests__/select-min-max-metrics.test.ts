import { selectMinMaxMetric } from '@/features/analysis/lib/select-min-max-metrics';

import type { MetricGroup } from '@/features/analysis/model/types';

/**
 *
 * @param current_value
 * @param submetrics
 */
const makeGroup = (
  current_value: number,
  submetrics: { current_value: number }[] = [],
): MetricGroup => {
  return {
    current_value,
    display_name: `Group ${current_value}`,
    frontend_component_type: 'progress',
    max_value: 10,
    min_value: 0,
    submetrics: submetrics.map((s, i) => {
      return {
        current_value: s.current_value,
        display_name: `Sub ${i}`,
        frontend_component_type: 'progress',
        max_value: 10,
        min_value: 0,
      };
    }),
  };
};

describe('selectMinMaxMetric', () => {
  it('returns null for both when metrics array is empty', () => {
    expect(selectMinMaxMetric([])).toEqual({ minItem: null, maxItem: null });
  });

  it('returns same item for min and max when there is one group and no submetrics', () => {
    const group = makeGroup(5);

    const result = selectMinMaxMetric([group]);

    expect(result.minItem).toBe(result.maxItem);
    expect(result.minItem?.current_value).toBe(5);
  });

  it('finds min and max across multiple groups', () => {
    const groups = [makeGroup(3), makeGroup(7), makeGroup(1)];

    const { minItem, maxItem } = selectMinMaxMetric(groups);

    expect(minItem?.current_value).toBe(1);
    expect(maxItem?.current_value).toBe(7);
  });

  it('considers submetrics in min/max calculation', () => {
    const groups = [makeGroup(5, [{ current_value: 1 }, { current_value: 9 }])];

    const { minItem, maxItem } = selectMinMaxMetric(groups);

    expect(minItem?.current_value).toBe(1);
    expect(maxItem?.current_value).toBe(9);
  });

  it('skips NaN current_value entries', () => {
    const groups = [makeGroup(Number.NaN), makeGroup(5)];

    const { minItem, maxItem } = selectMinMaxMetric(groups);

    expect(minItem?.current_value).toBe(5);
    expect(maxItem?.current_value).toBe(5);
  });

  it('skips Infinity current_value entries', () => {
    const groups = [makeGroup(Infinity), makeGroup(4)];

    const { minItem, maxItem } = selectMinMaxMetric(groups);

    expect(minItem?.current_value).toBe(4);
    expect(maxItem?.current_value).toBe(4);
  });

  it('handles negative current_value', () => {
    const groups = [makeGroup(-3), makeGroup(2)];

    const { minItem, maxItem } = selectMinMaxMetric(groups);

    expect(minItem?.current_value).toBe(-3);
    expect(maxItem?.current_value).toBe(2);
  });

  it('all-NaN groups return null for both', () => {
    const groups = [makeGroup(Number.NaN), makeGroup(Number.NaN)];

    const { minItem, maxItem } = selectMinMaxMetric(groups);

    expect(minItem).toBeNull();
    expect(maxItem).toBeNull();
  });
});
