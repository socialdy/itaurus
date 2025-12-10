import { useState, useMemo } from "react"

export type SortDirection = "asc" | "desc" | null

export interface SortConfig<T> {
    key: keyof T | null
    direction: SortDirection
}

export function useSortableTable<T>(data: T[], initialSortKey?: keyof T) {
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
        key: initialSortKey || null,
        direction: null,
    })

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) {
            return data
        }

        const sorted = [...data].sort((a, b) => {
            const aValue = a[sortConfig.key!]
            const bValue = b[sortConfig.key!]

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0
            if (aValue == null) return 1
            if (bValue == null) return -1

            // Handle different types
            if (typeof aValue === "string" && typeof bValue === "string") {
                return sortConfig.direction === "asc"
                    ? aValue.localeCompare(bValue, undefined, { sensitivity: "base" })
                    : bValue.localeCompare(aValue, undefined, { sensitivity: "base" })
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
            }

            if (typeof aValue === "boolean" && typeof bValue === "boolean") {
                return sortConfig.direction === "asc"
                    ? (aValue === bValue ? 0 : aValue ? 1 : -1)
                    : (aValue === bValue ? 0 : bValue ? 1 : -1)
            }

            // For dates and other types, convert to string
            const aStr = String(aValue)
            const bStr = String(bValue)
            return sortConfig.direction === "asc"
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr)
        })

        return sorted
    }, [data, sortConfig])

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = "asc"

        if (sortConfig.key === key) {
            if (sortConfig.direction === "asc") {
                direction = "desc"
            } else if (sortConfig.direction === "desc") {
                direction = null
            }
        }

        setSortConfig({ key: direction ? key : null, direction })
    }

    return { sortedData, sortConfig, requestSort }
}
