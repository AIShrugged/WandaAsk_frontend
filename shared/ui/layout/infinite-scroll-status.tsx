type Props = {
  itemCount: number;
};

/**
 * InfiniteScrollStatus component.
 * @param props - Component props.
 * @param props.itemCount
 */
export function InfiniteScrollStatus({ itemCount }: Props) {
  return (
    <div className='text-center text-gray-500'>Loaded: {itemCount} items</div>
  );
}
