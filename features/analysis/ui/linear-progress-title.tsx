export default function LinearProgressTitle({ title }: { title: string }) {
  if (!title) return;

  return (
    <div>
      <p className={'text-[16px] font-bold'}>{title}</p>
    </div>
  );
}
