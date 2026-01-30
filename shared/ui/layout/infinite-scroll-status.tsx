type Props = {
  itemCount: number;
};

export function InfiniteScrollStatus({ itemCount }: Props) {
  return (
    <div className='text-center text-gray-500'>
      Loaded: {itemCount} items
    </div>
  );
}
