import MethodologyItem from '@/features/methodology/ui/methodology-item';

import type { MethodologyProps } from '@/features/methodology/model/types';

export default function MethodologyList({
  methodologies,
}: {
  methodologies: MethodologyProps[];
}) {
  return (
    <>
      {methodologies.map(methodology => (
        <MethodologyItem key={methodology.id} methodology={methodology} />
      ))}
    </>
  );
}
