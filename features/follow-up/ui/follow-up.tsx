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
    <pre className='bg-scheduled p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap break-words'>
      {JSON.stringify(parsed, null, 2)}
    </pre>
  );
}
