"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type MaintenanceStatus = "OK" | "Error" | "InProgress" | "NotApplicable" | "Planned"

type MaintenanceEntry = {
  id: string
  title: string
  date: string
  status: MaintenanceStatus
  customer?: { id: string; name: string; abbreviation: string }
}

const statusLabel: Record<MaintenanceStatus, string> = {
  OK: "Abgeschlossen",
  Error: "Fehler",
  InProgress: "In Arbeit",
  NotApplicable: "Nicht anwendbar",
  Planned: "Geplant",
}

export default function MaintenanceOverviewPage() {
  const [entries, setEntries] = useState<MaintenanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | MaintenanceStatus>("all")

  useEffect(() => {
    let isMounted = true
    const fetchEntries = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/maintenance")
        if (!response.ok) {
          throw new Error("Wartungseinträge konnten nicht geladen werden.")
        }
        const data = (await response.json()) as MaintenanceEntry[]
        if (isMounted) {
          setEntries(data)
        }
      } catch (fetchError: unknown) {
        if (!isMounted) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unbekannter Fehler beim Laden der Wartungseinträge."
        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchEntries()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesFilter =
        activeFilter === "all" ? true : entry.status === activeFilter
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        term.length === 0 ||
        entry.title.toLowerCase().includes(term) ||
        entry.customer?.name.toLowerCase().includes(term) ||
        entry.customer?.abbreviation.toLowerCase().includes(term)
      return matchesFilter && matchesSearch
    })
  }, [entries, activeFilter, searchTerm])

  const stats = useMemo(() => {
    const planned = entries.filter((entry) => entry.status === "Planned").length
    const inProgress = entries.filter((entry) => entry.status === "InProgress").length
    const completed = entries.filter((entry) => entry.status === "OK").length
    return { planned, inProgress, completed }
  }, [entries])

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

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Wartungen" },
        ]}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wartungsübersicht</h1>
          <p className="text-sm text-muted-foreground">
            Alle geplanten und laufenden Wartungsarbeiten im Überblick.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Input
              placeholder="Wartung oder Kunde suchen..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Geplant</p>
            <CardTitle className="text-3xl">{stats.planned}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>Termine für kommende Wochen</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">
              In Bearbeitung
            </p>
            <CardTitle className="text-3xl">{stats.inProgress}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Aktuell laufende Wartungseinträge</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">
              Abgeschlossen
            </p>
            <CardTitle className="text-3xl">{stats.completed}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>Erfolgreich abgeschlossene Einsätze</span>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as typeof activeFilter)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Alle Einträge</TabsTrigger>
          <TabsTrigger value="Planned">Geplant</TabsTrigger>
          <TabsTrigger value="InProgress">In Arbeit</TabsTrigger>
          <TabsTrigger value="OK">Abgeschlossen</TabsTrigger>
        </TabsList>
        <TabsContent value={activeFilter} className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Wartungsplan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gefiltert nach Status und Suchbegriff
                </p>
              </div>
              <Badge variant="outline">{filteredEntries.length} Einträge</Badge>
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
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Keine Wartungseinträge für die aktuelle Auswahl gefunden.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(entry.date).toLocaleString("de-AT", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </TableCell>
                          <TableCell className="font-medium">{entry.title}</TableCell>
                          <TableCell>
                            {entry.customer
                              ? `${entry.customer.name} (${entry.customer.abbreviation})`
                              : "–"}
                          </TableCell>
                          <TableCell className="text-right">
                            {renderStatusBadge(entry.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

