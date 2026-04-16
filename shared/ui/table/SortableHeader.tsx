import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export type SortOrder = 'asc' | 'desc';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: SortOrder;
  onSort: (field: string) => void;
}

/**
 * SortableHeader — clickable table column header with sort direction indicator.
 * @param props - component props.
 * @returns JSX element.
 */
export function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSort === field;

  function renderSortIcon() {
    if (!isActive) {
      return <ChevronsUpDown className='h-3.5 w-3.5 opacity-40' />;
    }

    if (currentOrder === 'asc') {
      return <ChevronUp className='h-3.5 w-3.5' />;
    }

    return <ChevronDown className='h-3.5 w-3.5' />;
  }

  return (
    <button
      type='button'
      onClick={() => {
        onSort(field);
      }}
      className='flex items-center gap-1 hover:text-foreground'
    >
      {label}
      <span className='inline-flex h-3.5 w-3.5 items-center justify-center'>
        {renderSortIcon()}
      </span>
    </button>
  );
}
