import { TableHead } from "@/components/ui/table"
import { ArrowUp, ArrowDown } from "lucide-react"
import { SortDirection } from "@/hooks/use-sortable-table"
import { cn } from "@/lib/utils"

interface SortableTableHeadProps<T> {
    label: string
    sortKey: keyof T
    currentSortKey: keyof T | null
    currentDirection: SortDirection
    onSort: (key: keyof T) => void
    className?: string
}

export function SortableTableHead<T>({
    label,
    sortKey,
    currentSortKey,
    currentDirection,
    onSort,
    className,
}: SortableTableHeadProps<T>) {
    const isActive = currentSortKey === sortKey

    return (
        <TableHead
            className={cn(
                "cursor-pointer select-none hover:bg-accent/50 transition-colors",
                className
            )}
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-2">
                <span>{label}</span>
                {isActive && currentDirection && (
                    currentDirection === "asc" ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : (
                        <ArrowDown className="h-4 w-4" />
                    )
                )}
            </div>
        </TableHead>
    )
}
