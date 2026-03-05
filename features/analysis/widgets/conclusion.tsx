import { ConclusionItem } from '@/features/analysis/ui/conclusion-item';
import { H4 } from '@/shared/ui/typography/H4';

import type { AnalysisProps } from '@/features/analysis/model/types';

/**
 * Conclusion component.
 * @param root0
 * @param root0.conclusion
 */
export default function Conclusion({
  conclusion,
}: Pick<AnalysisProps, 'conclusion'>) {
  return (
    <div className='py-6'>
      <H4>{conclusion.display_name}</H4>

      <div
        className='grid gap-4'
        style={{
          gridTemplateColumns: `repeat(${Math.min(conclusion.value.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {conclusion.value.map((item, index) => {
          return (
            <ConclusionItem
              key={index}
              title={item.display_name}
              items={item.value}
            />
          );
        })}
      </div>
    </div>
  );
}
