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
