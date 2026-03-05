/**
 * MinMax component.
 * @param root0
 * @param root0.max_value
 * @param root0.min_value
 * @param root0.current_value
 */
export default function MinMax({
  max_value,
  current_value,
}: {
  max_value: number;
  min_value?: number;
  current_value: number;
}) {
  return (
    <span>
      <p className={'text-[14px]'}>
        {current_value} out of {max_value}
      </p>
    </span>
  );
}
