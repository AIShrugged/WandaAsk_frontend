/**
 * FollowUp component.
 * @param props - Component props.
 * @param props.data
 */
export default async function FollowUp({ data }: { data: string }) {
  if (!data) {
    return <div>No data</div>;
  }

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    return <div>Error</div>;
  }

  return (
    <pre className='bg-muted p-4 rounded-[var(--radius-card)] overflow-x-auto text-sm font-mono whitespace-pre-wrap break-words text-foreground'>
      {JSON.stringify(parsed, null, 2)}
    </pre>
  );
}
