import type {
  AnalysisProps,
  MetricGroup,
  MetricItem,
} from '@/features/analysis/model/types';

export interface MinMaxResult {
  minItem: MetricItem | null;
  maxItem: MetricItem | null;
}

export function selectMinMaxMetric(
  metrics: AnalysisProps['metrics'],
): MinMaxResult {
  let minItem: MetricItem | null = null;
  let maxItem: MetricItem | null = null;

  for (const group of metrics) {
    // Проверяем MetricGroup
    updateMinMax(group);

    // Проверяем все submetrics
    for (const submetric of group.submetrics) {
      updateMinMax(submetric);
    }
  }

  function updateMinMax(item: MetricGroup | MetricItem): void {
    const val = item.current_value;

    if (!Number.isFinite(val)) return;

    if (minItem === null || val < minItem.current_value) {
      minItem = item;
    }

    if (maxItem === null || val > maxItem.current_value) {
      maxItem = item;
    }
  }

  return { minItem, maxItem };
}
