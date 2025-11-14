"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, HardDrive, Layers, ServerCog } from "lucide-react"

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

type SystemEntry = {
  id: string
  hostname: string
  hardwareType?: string | null
  deviceType?: string | null
  operatingSystem?: string | null
  maintenanceInterval?: string | null
  customer?: { id: string; name: string; abbreviation: string }
}

export default function SystemsPage() {
  const [systems, setSystems] = useState<SystemEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let isMounted = true
    const fetchSystems = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/systems")
        if (!response.ok) {
          throw new Error("Systemdaten konnten nicht geladen werden.")
        }
        const data = (await response.json()) as SystemEntry[]
        if (isMounted) {
          setSystems(data)
        }
      } catch (fetchError: unknown) {
        if (!isMounted) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unbekannter Fehler beim Laden der Systeme."
        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSystems()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredSystems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return systems
    }
    return systems.filter((system) => {
      return (
        system.hostname.toLowerCase().includes(term) ||
        system.deviceType?.toLowerCase().includes(term) ||
        system.customer?.name.toLowerCase().includes(term) ||
        system.customer?.abbreviation.toLowerCase().includes(term)
      )
    })
  }, [systems, search])

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Systeme" },
        ]}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Systeminventar</h1>
          <p className="text-sm text-muted-foreground">
            Übersicht aller verwalteten Systeme je Kunde.
          </p>
        </div>
        <Input
          placeholder="Hostname oder Kunde suchen..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Gesamt</p>
            <CardTitle className="text-3xl">{systems.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <ServerCog className="h-4 w-4" />
            <span>Registrierte Systeme</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Server</p>
            <CardTitle className="text-3xl">
              {systems.filter((system) => system.deviceType === "SERVER").length}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span>Server-basierte Installationen</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Kunden</p>
            <CardTitle className="text-3xl">
              {
                new Set(
                  systems
                    .map((system) => system.customer?.id)
                    .filter(Boolean) as string[]
                ).size
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Aktive Kundeninstallationen</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Systemliste</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gefiltert nach Hostnamen, Gerätetyp oder Kunde
            </p>
          </div>
          <Badge variant="outline">{filteredSystems.length} Systeme</Badge>
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
          ) : filteredSystems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Keine Systeme gefunden.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostname</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Gerätetyp</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead className="text-right">Intervall</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSystems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell className="font-medium">{system.hostname}</TableCell>
                      <TableCell>
                        {system.customer
                          ? `${system.customer.name} (${system.customer.abbreviation})`
                          : "–"}
                      </TableCell>
                      <TableCell>{system.deviceType || "–"}</TableCell>
                      <TableCell>{system.operatingSystem || "–"}</TableCell>
                      <TableCell className="text-right">
                        {system.maintenanceInterval || "–"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

