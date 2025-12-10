"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"

type MaintenanceStatus = "OK" | "Error" | "InProgress" | "NotApplicable" | "Planned"

type MaintenanceDetail = {
  id: string
  title: string
  date: string
  status: MaintenanceStatus
  notes?: string | null
  customer?: { id: string; name: string; abbreviation: string }
  systems?: Array<{ id: string; hostname: string }>
  technicians?: Array<{ id: string; name: string }>
}

const statusTone: Record<MaintenanceStatus, string> = {
  OK: "bg-emerald-500/15 text-emerald-700",
  Error: "bg-red-500/15 text-red-700",
  InProgress: "bg-blue-500/15 text-blue-700",
  NotApplicable: "bg-slate-500/15 text-slate-700",
  Planned: "bg-amber-500/15 text-amber-700",
}

export default function MaintenanceDetailPage() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const maintenanceId = params?.id

  const [entry, setEntry] = useState<MaintenanceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!maintenanceId) return
    let isMounted = true

    const fetchEntry = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/maintenance/${maintenanceId}`)
        if (!response.ok) {
          throw new Error("Wartungseintrag konnte nicht geladen werden.")
        }
        const data = (await response.json()) as MaintenanceDetail
        if (isMounted) {
          setEntry({
            ...data,
            systems: data.systems ?? [],
            technicians: data.technicians ?? [],
          })
        }
      } catch (fetchError: unknown) {
        if (!isMounted) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unbekannter Fehler beim Laden des Wartungseintrags."
        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchEntry()
    return () => {
      isMounted = false
    }
  }, [maintenanceId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-base font-medium text-destructive">
          {error ?? "Der Wartungseintrag wurde nicht gefunden."}
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/maintenance")}>
          Zur Übersicht
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Wartungen", href: "/dashboard/maintenance" },
          { name: entry.title },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button variant="ghost" className="px-2" onClick={() => router.push("/dashboard/maintenance")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{entry.title}</h1>
          <p className="text-sm text-muted-foreground">
            {entry.customer
              ? `${entry.customer.name} (${entry.customer.abbreviation})`
              : "Keinem Kunden zugewiesen"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Allgemeine Informationen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Zeit, Status und Kurzbeschreibung
            </p>
          </div>
          <Badge className={statusTone[entry.status]}>{entry.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Zeitpunkt</p>
              <p className="text-sm font-medium">
                {new Date(entry.date).toLocaleString("de-AT", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Kunde</p>
              <p className="text-sm font-medium">
                {entry.customer
                  ? `${entry.customer.name} (${entry.customer.abbreviation})`
                  : "Keine Zuordnung"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Notizen</p>
            <p className="text-sm font-medium whitespace-pre-line">
              {entry.notes?.trim() || "Keine zusätzlichen Anmerkungen"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Betroffene Systeme</CardTitle>
          </CardHeader>
          <CardContent>
            {entry.systems && entry.systems.length > 0 ? (
              <Table>
                <TableBody>
                  {entry.systems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell className="font-medium">{system.hostname}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keine Systeme verknüpft.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Techniker</CardTitle>
          </CardHeader>
          <CardContent>
            {entry.technicians && entry.technicians.length > 0 ? (
              <Table>
                <TableBody>
                  {entry.technicians.map((technician) => (
                    <TableRow key={technician.id}>
                      <TableCell className="font-medium">{technician.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keine Techniker zugewiesen.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

