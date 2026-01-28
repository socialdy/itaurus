"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, PlusCircle, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MaintenanceEntryForm, MaintenanceEntryFormData } from "@/components/ui/maintenance-entry-form"
import { useSystemDefinitions } from "@/lib/system-definitions"
import { PageHeader } from "@/components/ui/page-header"
import { useSortableTable } from "@/hooks/use-sortable-table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"

type MaintenanceStatus = "OK" | "Error" | "InProgress" | "NotApplicable" | "Planned"

type MaintenanceEntry = {
  id: string
  title: string
  date: string
  status: MaintenanceStatus
  customerId?: string
  customer?: { id: string; name: string; abbreviation: string }
  systemIds?: string[] | null
  coordinatorId?: string | null
  updatedAt?: string | null
}

type DialogCustomer = { id: string; name: string; abbreviation: string }
type DialogSystem = { id: string; hostname: string; customerId: string }

const statusLabel: Record<MaintenanceStatus, string> = {
  OK: "Abgeschlossen",
  Error: "Fehler",
  InProgress: "In Arbeit",
  NotApplicable: "Nicht anwendbar",
  Planned: "Geplant",
}

export default function MaintenanceOverviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [entries, setEntries] = useState<MaintenanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | MaintenanceStatus>("all")
  const [technicianFilter, setTechnicianFilter] = useState<string>("all")
  const [customerFilter, setCustomerFilter] = useState<string>("all")
  const [specialFilter, setSpecialFilter] = useState<"none" | "overdue" | "today">("none")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MaintenanceEntry | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<MaintenanceEntry | null>(null)

  // Dialog data state - fetched on mount
  const [dialogCustomers, setDialogCustomers] = useState<DialogCustomer[]>([])
  const [dialogSystems, setDialogSystems] = useState<DialogSystem[]>([])
  const [dialogLoading, setDialogLoading] = useState(true) // Initial loading for dialog data

  const { definitions } = useSystemDefinitions()
  const technicians = (definitions.technicians || []) as string[]

  // Pagination state
  const PAGE_SIZE = 15
  const [page, setPage] = useState(1)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/maintenance")
      if (!response.ok) {
        throw new Error("Wartungseinträge konnten nicht geladen werden.")
      }
      const data = (await response.json()) as MaintenanceEntry[]
      setEntries(data)
    } catch (fetchError: unknown) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Unbekannter Fehler beim Laden der Wartungseinträge."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch main entries
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Read URL filter parameter on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam) {
      switch (filterParam) {
        case 'planned':
          setActiveFilter('Planned')
          setSpecialFilter('none')
          break
        case 'inprogress':
          setActiveFilter('InProgress')
          setSpecialFilter('none')
          break
        case 'completed':
          setActiveFilter('OK')
          setSpecialFilter('none')
          break
        case 'overdue':
          setActiveFilter('all')
          setSpecialFilter('overdue')
          break
        case 'today':
          setActiveFilter('Planned')
          setSpecialFilter('today')
          break
      }
    }
  }, [searchParams])

  // Prefetch dialog data on mount
  useEffect(() => {
    const loadDialogData = async () => {
      try {
        const [customersResponse, systemsResponse] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/systems"),
        ])

        if (customersResponse.ok && systemsResponse.ok) {
          const customersData = (await customersResponse.json()) as DialogCustomer[]
          const systemsData = (await systemsResponse.json()) as DialogSystem[]
          setDialogCustomers(customersData)
          setDialogSystems(systemsData)
        } else {
          console.error("Failed to prefetch dialog data")
        }
      } catch (error) {
        console.error("Error prefetching dialog data:", error)
      } finally {
        setDialogLoading(false)
      }
    }
    loadDialogData()
  }, [])

  const filteredEntries = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return entries.filter((entry) => {
      const matchesFilter =
        activeFilter === "all" ? true : entry.status === activeFilter
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        term.length === 0 ||
        entry.title.toLowerCase().includes(term) ||
        entry.customer?.name.toLowerCase().includes(term) ||
        entry.customer?.abbreviation.toLowerCase().includes(term) ||
        entry.coordinatorId?.toLowerCase().includes(term)
      const matchesTechnician =
        technicianFilter === "all" ? true : entry.coordinatorId === technicianFilter
      const matchesCustomer =
        customerFilter === "all" ? true : entry.customerId === customerFilter

      // Special filters: overdue and today
      let matchesSpecialFilter = true
      if (specialFilter === 'overdue') {
        const entryDate = new Date(entry.date)
        entryDate.setHours(0, 0, 0, 0)
        matchesSpecialFilter = entryDate < today && entry.status !== 'OK' && entry.status !== 'Error' && entry.status !== 'NotApplicable'
      } else if (specialFilter === 'today') {
        const entryDate = new Date(entry.date)
        matchesSpecialFilter = entryDate.toDateString() === today.toDateString()
      }

      return matchesFilter && matchesSearch && matchesTechnician && matchesCustomer && matchesSpecialFilter
    })
  }, [entries, activeFilter, searchTerm, technicianFilter, customerFilter, specialFilter])

  // Sorting
  const { sortedData, sortConfig, requestSort } = useSortableTable(filteredEntries, "date" as keyof MaintenanceEntry)

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE) || 1
  const startIdx = (page - 1) * PAGE_SIZE
  const endIdx = startIdx + PAGE_SIZE
  const paginatedEntries = sortedData.slice(startIdx, endIdx)

  const renderStatusBadge = (status: MaintenanceStatus) => {
    const colorMap: Record<MaintenanceStatus, string> = {
      OK: "bg-emerald-500/15 text-emerald-700",
      Error: "bg-red-500/15 text-red-700",
      InProgress: "bg-blue-500/15 text-blue-700",
      NotApplicable: "bg-slate-500/15 text-slate-700",
      Planned: "bg-amber-500/15 text-amber-700",
    }
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs ${colorMap[status]}`}>
        {statusLabel[status]}
      </span>
    )
  }

  const handleCreateMaintenance = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditMaintenance = (entry: MaintenanceEntry, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingEntry(entry)
  }

  const handleUpdateMaintenance = async (data: MaintenanceEntryFormData) => {
    if (!editingEntry) return

    try {
      const response = await fetch(`/api/maintenance/${editingEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customerId,
          systemIds: data.systemIds ?? [],
          coordinatorId: data.coordinatorId,
          date: data.date,
        }),
      })

      if (!response.ok) {
        throw new Error("Wartung konnte nicht aktualisiert werden.")
      }

      toast.success("Wartung erfolgreich aktualisiert.")
      setEditingEntry(null)
      await fetchEntries()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler beim Aktualisieren."
      toast.error(message)
    }
  }

  const handleDeleteMaintenance = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/maintenance/${entryToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Wartung konnte nicht gelöscht werden.")
      }

      toast.success("Wartung erfolgreich gelöscht.")
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
      await fetchEntries()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler beim Löschen."
      toast.error(message)
    }
  }

  const handleMaintenanceSubmit = async (data: MaintenanceEntryFormData) => {
    try {
      // We don't need to set dialogLoading here as it controls the form display, 
      // and we want to keep the form visible while submitting or show a submitting state if the form supports it.
      // For now, we just await the submit.
      const response = await fetch("/api/maintenance?type=entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customerId,
          systemIds: data.systemIds ?? [],
          coordinatorId: data.coordinatorId,
          date: data.date,
          status: "Planned",
        }),
      })
      if (!response.ok) {
        throw new Error("Wartung konnte nicht erstellt werden.")
      }
      toast.success("Wartung erfolgreich erstellt.")
      setIsCreateDialogOpen(false)
      // We don't clear dialog data here anymore as we want to keep it cached
      await fetchEntries()
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : "Unbekannter Fehler beim Speichern."
      toast.error(message)
    }
  }

  return (
    <div className="h-full flex-1 flex-col space-y-6 overflow-x-hidden p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Wartungen" },
        ]}
        className="mb-4"
      />

      <PageHeader
        title="Wartungsübersicht"
        description="Hier können Sie alle Wartungen einsehen, verwalten und bearbeiten."
      />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Wartungsplan</CardTitle>
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <div className="relative w-full min-w-[220px] max-w-sm lg:w-56">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Titel oder Kunde suchen..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtern nach</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => setActiveFilter("all")}>
                          Alle
                        </DropdownMenuItem>
                        {Object.entries(statusLabel).map(([key, label]) => (
                          <DropdownMenuItem
                            key={key}
                            onSelect={() => setActiveFilter(key as MaintenanceStatus)}
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Wartungskoordinator</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => setTechnicianFilter("all")}>
                          Alle
                        </DropdownMenuItem>
                        {technicians.map((tech) => (
                          <DropdownMenuItem
                            key={tech}
                            onSelect={() => setTechnicianFilter(tech)}
                          >
                            {tech}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Kunde</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                        <DropdownMenuItem onSelect={() => setCustomerFilter("all")}>
                          Alle
                        </DropdownMenuItem>
                        {dialogCustomers.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation)).map((customer) => (
                          <DropdownMenuItem
                            key={customer.id}
                            onSelect={() => setCustomerFilter(customer.id)}
                          >
                            {customer.abbreviation}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => {
                    setActiveFilter("all")
                    setTechnicianFilter("all")
                    setCustomerFilter("all")
                    setSpecialFilter("none")
                  }}>
                    Filter zurücksetzen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleCreateMaintenance} className="whitespace-nowrap">
                <PlusCircle className="mr-2 h-4 w-4" />
                Wartung erstellen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchEntries}>
                Erneut versuchen
              </Button>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Keine Wartungseinträge für die aktuelle Auswahl gefunden.
            </div>
          ) : (
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-b-2">
                  <SortableTableHead<MaintenanceEntry>
                    label="Datum"
                    sortKey="date"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                    className="px-4 py-2 text-xs md:text-sm"
                  />
                  <SortableTableHead<MaintenanceEntry>
                    label="Wartung"
                    sortKey="title"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                    className="px-4 py-2 text-xs md:text-sm"
                  />
                  <TableHead className="px-4 py-2 text-xs md:text-sm">Kunde</TableHead>
                  <TableHead className="px-4 py-2 text-xs md:text-sm">Koordinator</TableHead>
                  <SortableTableHead<MaintenanceEntry>
                    label="Status"
                    sortKey="status"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                    className="px-4 py-2 text-xs md:text-sm"
                  />
                  <TableHead className="px-4 py-2 text-xs md:text-sm text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/maintenance/${entry.id}`)}
                  >
                    <TableCell className="px-4 py-3 text-xs md:text-sm whitespace-nowrap">
                      {new Date(entry.date).toLocaleString("de-AT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs md:text-sm font-medium">
                      <div>{entry.title}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs md:text-sm">
                      {entry.customer
                        ? entry.customer.name
                        : "–"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs md:text-sm">
                      {entry.coordinatorId || "–"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs md:text-sm">{renderStatusBadge(entry.status)}</TableCell>
                    <TableCell className="px-4 py-3 text-xs md:text-sm text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleEditMaintenance(entry, e)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEntryToDelete(entry)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Zurück</Button>
        <span className="font-medium text-sm">Seite {page} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Weiter</Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue Wartung</DialogTitle>
            <DialogDescription>Plane eine neue Wartung und weise Systeme sowie Techniker zu.</DialogDescription>
          </DialogHeader>
          {dialogLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <MaintenanceEntryForm
              customers={dialogCustomers}
              systems={dialogSystems}
              technicians={technicians}
              onSubmit={handleMaintenanceSubmit}
              onCancel={() => setIsCreateDialogOpen(false)}
              submitButtonText="Wartung speichern"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wartung bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Details der Wartung.</DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <MaintenanceEntryForm
              initialData={{
                id: editingEntry.id,
                customerId: editingEntry.customerId,
                systemIds: editingEntry.systemIds || [],
                coordinatorId: editingEntry.coordinatorId || "",
                date: editingEntry.date,
              }}
              customers={dialogCustomers}
              systems={dialogSystems}
              technicians={technicians}
              onSubmit={handleUpdateMaintenance}
              onCancel={() => setEditingEntry(null)}
              submitButtonText="Änderungen speichern"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Wartung löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie die Wartung &quot;{entryToDelete?.title}&quot; löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeleteMaintenance}>
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

