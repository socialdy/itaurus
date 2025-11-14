"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ContactPerson = {
  id?: string
  name: string
  email: string
  phone: string
}

type SystemSummary = {
  id: string
  hostname: string
  hardwareType?: string | null
  deviceType?: string | null
  maintenanceInterval?: string | null
}

type MaintenanceEntry = {
  id: string
  title: string
  date: string
  status: "OK" | "Error" | "InProgress" | "NotApplicable" | "Planned"
}

type CustomerDetail = {
  id: string
  abbreviation: string
  name: string
  businessEmail?: string | null
  businessPhone?: string | null
  website?: string | null
  contactPersons: ContactPerson[]
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  category?: string | null
  billingCode?: string | null
  serviceManager?: string | null
  sla?: boolean | null
  systems: SystemSummary[]
  maintenanceEntries: MaintenanceEntry[]
}

type CustomerApiResponse = CustomerDetail & {
  contactPeople?: ContactPerson[]
}

const statusLabelMap: Record<MaintenanceEntry["status"], string> = {
  OK: "Abgeschlossen",
  Error: "Fehler",
  InProgress: "In Bearbeitung",
  NotApplicable: "Nicht anwendbar",
  Planned: "Geplant",
}

export default function CustomerDetailsPage() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const customerId = params?.id

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customerId) return
    let isSubscribed = true

    const fetchCustomer = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/customers/${customerId}`)
        if (!response.ok) {
          throw new Error("Kunde konnte nicht geladen werden.")
        }
        const data = (await response.json()) as CustomerApiResponse
        if (!isSubscribed) return
        setCustomer({
          ...data,
          contactPersons: data.contactPeople ?? data.contactPersons ?? [],
          systems: data.systems ?? [],
          maintenanceEntries: data.maintenanceEntries ?? [],
        })
      } catch (fetchError: unknown) {
        if (!isSubscribed) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unbekannter Fehler beim Laden des Kunden."
        setError(message)
      } finally {
        if (isSubscribed) {
          setLoading(false)
        }
      }
    }

    fetchCustomer()

    return () => {
      isSubscribed = false
    }
  }, [customerId])

  const maintenanceStats = useMemo(() => {
    if (!customer) {
      return {
        open: [] as MaintenanceEntry[],
        completed: [] as MaintenanceEntry[],
      }
    }
    const now = new Date()
    const open = customer.maintenanceEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return (
        entry.status === "Planned" ||
        entry.status === "InProgress" ||
        entryDate >= now
      )
    })
    const completed = customer.maintenanceEntries.filter(
      (entry) => entry.status === "OK"
    )
    return { open, completed }
  }, [customer])

  const renderStatusBadge = (status: MaintenanceEntry["status"]) => {
    const toneMap: Record<MaintenanceEntry["status"], string> = {
      OK: "bg-emerald-500/15 text-emerald-700",
      Error: "bg-red-500/15 text-red-700",
      InProgress: "bg-blue-500/15 text-blue-700",
      NotApplicable: "bg-slate-500/15 text-slate-700",
      Planned: "bg-amber-500/15 text-amber-700",
    }
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs ${toneMap[status]}`}>
        {statusLabelMap[status]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-base font-medium text-destructive">
          {error ?? "Der Kunde wurde nicht gefunden."}
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/customers")}>
          Zur Kundenübersicht
        </Button>
      </div>
    )
  }

  const fullAddress =
    [customer.address, customer.postalCode, customer.city, customer.country]
      .filter(Boolean)
      .join(", ") || "Keine Angaben"

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Kunden", href: "/dashboard/customers" },
          { name: customer.name },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="px-2"
          onClick={() => router.push("/dashboard/customers")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {customer.name} ({customer.abbreviation})
          </h1>
          <p className="text-sm text-muted-foreground">
            Übersicht der Systeme, Ansprechpartner und Wartungen
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">SLA</p>
            <CardTitle className="text-2xl">
              {customer.sla ? "Aktiv" : "Inaktiv"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Service Level ist {customer.sla ? "vereinbart" : "nicht aktiv"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Systeme</p>
            <CardTitle className="text-2xl">{customer.systems.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Zugeordnete produktive Systeme
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">
              Offene Wartungen
            </p>
            <CardTitle className="text-2xl">
              {maintenanceStats.open.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Geplante oder laufende Wartungseinträge
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">
              Abgeschlossen
            </p>
            <CardTitle className="text-2xl">
              {maintenanceStats.completed.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Erfolgreich dokumentierte Wartungen
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kundeninformationen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Abrechnungscode
              </p>
              <p className="text-sm font-medium">
                {customer.billingCode || "Nicht hinterlegt"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Service Manager
              </p>
              <p className="text-sm font-medium">
                {customer.serviceManager || "Nicht zugewiesen"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Adresse</p>
              <p className="text-sm font-medium">{fullAddress}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">E-Mail</p>
              <p className="text-sm font-medium">
                {customer.businessEmail || "Keine Angabe"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Telefon</p>
              <p className="text-sm font-medium">
                {customer.businessPhone || "Keine Angabe"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Website</p>
              <p className="text-sm font-medium">
                {customer.website || "Keine Angabe"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ansprechpartner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.contactPersons.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Keine Ansprechpartner hinterlegt.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {customer.contactPersons.map((person) => (
                <div key={person.email} className="space-y-1 rounded-lg border p-4">
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {person.email || "Keine E-Mail"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {person.phone || "Keine Telefonnummer"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Systeme</CardTitle>
            <p className="text-sm text-muted-foreground">
              Überblick über registrierte Kundenumgebungen
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.systems.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Keine Systeme vorhanden.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostname</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Gerätetyp</TableHead>
                    <TableHead>Wartungsintervall</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.systems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell className="font-medium">
                        {system.hostname}
                      </TableCell>
                      <TableCell>{system.hardwareType || "N/A"}</TableCell>
                      <TableCell>{system.deviceType || "N/A"}</TableCell>
                      <TableCell>
                        {system.maintenanceInterval || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wartungseinträge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.maintenanceEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Keine Wartungen vorhanden.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Eintrag</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.maintenanceEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.date).toLocaleString("de-AT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>{entry.title}</TableCell>
                      <TableCell>{renderStatusBadge(entry.status)}</TableCell>
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

