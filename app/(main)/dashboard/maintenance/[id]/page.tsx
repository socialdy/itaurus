"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { AlertCircle, FileText, Save, Search, Building2, User, MapPin, Mail, Phone, Users, RotateCw } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SystemCard } from "@/components/maintenance/system-card"
import { MultiSystemBulkUpdateBar } from "@/components/maintenance/multi-system-bulk-update-bar"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { useSystemDefinitions } from "@/lib/system-definitions"
import { MaintenanceEntryForm, MaintenanceEntryFormData } from "@/components/ui/maintenance-entry-form"

type MaintenanceStatus = "OK" | "Error" | "InProgress" | "NotApplicable" | "Planned"

const STATUS_LABELS: Record<string, string> = {
  "OK": "OK",
  "Error": "Fehler",
  "InProgress": "In Arbeit",
  "NotApplicable": "N/A",
  "NotDone": "Offen",
}

type ContactPerson = {
  id: string
  name: string
  email: string
  phone: string
}

type MaintenanceDetail = {
  id: string
  title: string
  date: string
  status: MaintenanceStatus
  notes?: string | null
  instructions?: string | null
  customerId: string
  customer?: {
    id: string;
    name: string;
    abbreviation: string;
    address?: string;
    city?: string;
    postalCode?: string;
    serviceManager?: string;
    maintenanceNotes?: string;
    businessEmail?: string;
    businessPhone?: string;
    website?: string;
    contactPeople?: ContactPerson[];
  }
  systemIds?: string[] | null
  technicianIds?: string[] | null
  systemNotes?: Record<string, string>
  systemTechnicianAssignments?: Record<string, string[]>
  systemTrackableItems?: Record<string, Record<string, string | undefined>>
}

type ApiSystem = {
  id: string
  hostname: string
  description?: string | null
  ipAddress?: string | null
  hardwareType?: string | null
  operatingSystem?: string | null
  serverApplicationType?: string | null
  maintenanceInterval?: string | null
  installedSoftware?: string[] | null
}

interface Filters {
  hardwareType: string | null;
  serverApplicationType: string | null;
  technicianId: string | null;
  operatingSystem: string | null;
  checkStatus: string | null;
}

const formatLabel = (value?: string | null) => {
  if (!value || value === "NONE") return ""
  if (value === "SQL") return "SQL-Server"
  if (value === "Exchange" || value === "EXCHANGE") return "Exchange-Server"
  if (value === "Backup" || value === "BACKUP") return "Backup-Server"
  if (value === "File" || value === "FILE") return "File-Server"
  if (value === "OTHERS" || value === "Others" || value === "OTHER" || value === "Other") return "Andere"
  if (value === "APPLICATION" || value === "Application") return "Andere"
  return value.replace(/_/g, " ")
}

export default function MaintenanceDetailPage() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const maintenanceId = params?.id
  const { technicians, hardwareTypes } = useSystemDefinitions()

  const [entry, setEntry] = useState<MaintenanceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systems, setSystems] = useState<ApiSystem[]>([])
  const [systemsLoading, setSystemsLoading] = useState(false)
  const [maintenanceNotes, setMaintenanceNotes] = useState<string>("")
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Ref to access latest entry state in callbacks without dependency
  const entryRef = useRef(entry)
  useEffect(() => { entryRef.current = entry }, [entry])



  // Filtering state
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({
    hardwareType: null,
    serverApplicationType: null,
    technicianId: null,
    operatingSystem: null,
    checkStatus: null,
  });

  // Refresh state
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // System selection state for bulk updates
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(new Set())

  const availableServerApps = useMemo(() => {
    const apps = new Set<string>();
    systems.forEach(s => {
      if (s.serverApplicationType && !["APPLICATION", "Application"].includes(s.serverApplicationType)) {
        apps.add(s.serverApplicationType)
      }
    });

    return Array.from(apps).map(value => ({
      value,
      label: formatLabel(value)
    }));
  }, [systems]);

  const handleReport = () => {
    window.open(`/api/maintenance/${maintenanceId}/report`, "_blank")
  }

  const fetchEntry = useCallback(async (silent = false) => {
    if (!maintenanceId) return
    if (!silent) setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`)
      if (!response.ok) {
        throw new Error("Wartungseintrag konnte nicht geladen werden.")
      }
      const data = (await response.json()) as MaintenanceDetail


      if (silent) {
        setEntry(prev => {
          if (!prev) return data
          return {
            ...data,
            // Preserve potentially edited text fields from local state during background refresh
            // to prevent overwriting user input while typing
            systemNotes: prev.systemNotes,
            instructions: prev.instructions,
          }
        })
      } else {
        setEntry(data)
        if (data.customer?.maintenanceNotes) {
          setMaintenanceNotes(data.customer.maintenanceNotes)
        }
      }
    } catch (fetchError: unknown) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Unbekannter Fehler beim Laden des Wartungseintrags."
      setError(message)
    } finally {
      if (!silent) setLoading(false)
      setIsRefreshing(false)
      setLastRefreshed(new Date())
    }
  }, [maintenanceId])

  useEffect(() => {
    fetchEntry()
  }, [fetchEntry])

  useEffect(() => {
    if (!entry?.customerId) return

    let isMounted = true

    const fetchSystems = async () => {
      setSystemsLoading(true)
      try {
        const params = new URLSearchParams({ customerId: entry.customerId })
        const response = await fetch(`/api/systems?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Systeme konnten nicht geladen werden.")
        }
        const data = (await response.json()) as ApiSystem[]
        const byId = new Map(data.map((system) => [system.id, system]))

        const orderedSystems = entry.systemIds?.length
          ? entry.systemIds
            .map((id) => byId.get(id))
            .filter((system): system is ApiSystem => Boolean(system))
          : data

        if (isMounted) {
          setSystems(orderedSystems)
        }
      } catch (fetchError: unknown) {
        if (!isMounted) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unbekannter Fehler beim Laden der Systeme."
        toast.error(message)
      } finally {
        if (isMounted) {
          setSystemsLoading(false)
        }
      }
    }

    fetchSystems()
    return () => {
      isMounted = false
    }
  }, [entry?.customerId, entry?.systemIds])


  const handleManualRefresh = async () => {
    if (!maintenanceId) return
    setIsRefreshing(true)
    try {
      // Sync systems first
      await fetch(`/api/maintenance/${maintenanceId}/sync`, { method: "POST" })
    } catch (e) {
      console.error("Sync warning:", e)
    }
    // Then reload data
    fetchEntry()
  }

  // Auto-assign technician if only one exists
  useEffect(() => {
    if (technicians.length === 1 && systems.length > 0 && entry) {
      const singleTechId = technicians[0].id;
      const updates: Record<string, string[]> = {};
      let hasUpdates = false;

      systems.forEach(sys => {
        const currentAssign = entry.systemTechnicianAssignments?.[sys.id];
        if (!currentAssign || currentAssign.length === 0) {
          updates[sys.id] = [singleTechId];
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        const updatedAssignments = { ...entry.systemTechnicianAssignments, ...updates };
        setEntry(prev => prev ? ({ ...prev, systemTechnicianAssignments: updatedAssignments }) : null);

        // Persist changes
        fetch(`/api/maintenance/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemTechnicianAssignments: updatedAssignments,
          }),
        }).catch(() => toast.error("Fehler bei der automatischen Techniker-Zuweisung"));
      }
    }
  }, [technicians, systems, entry, entry?.id]);



  const handleAssignTechnician = useCallback(async (systemId: string, technicianId: string) => {
    const currentEntry = entryRef.current
    if (!currentEntry || !maintenanceId) return

    const deltaAssignments = {
      [systemId]: technicianId ? [technicianId] : [],
    }

    setEntry(prev => {
      if (!prev) return null
      return {
        ...prev,
        systemTechnicianAssignments: {
          ...prev.systemTechnicianAssignments,
          ...deltaAssignments
        }
      }
    })

    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemTechnicianAssignments: deltaAssignments,
        }),
      })

      if (!response.ok) throw new Error("Failed to update technician assignment")
      toast.success("Techniker zugewiesen")
    } catch {
      toast.error("Fehler beim Zuweisen des Technikers")
      fetchEntry()
    }
  }, [maintenanceId, fetchEntry])

  const handleUpdateSystemNote = useCallback(async (systemId: string, note: string) => {
    const currentEntry = entryRef.current
    if (!currentEntry || !maintenanceId) return

    const deltaNotes = {
      [systemId]: note,
    }

    setEntry(prev => {
      if (!prev) return null
      return {
        ...prev,
        systemNotes: {
          ...prev.systemNotes,
          ...deltaNotes
        }
      }
    })

    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemNotes: deltaNotes,
        }),
      })

      if (!response.ok) throw new Error("Failed to update note")
      toast.success("Notiz gespeichert")
    } catch {
      toast.error("Fehler beim Speichern der Notiz")
      fetchEntry()
    }
  }, [maintenanceId, fetchEntry])

  const handleBulkUpdateTrackableItems = useCallback(async (systemId: string, updates: Record<string, string>) => {
    const currentEntry = entryRef.current
    if (!currentEntry || !maintenanceId) return

    const currentSystemItems = currentEntry.systemTrackableItems?.[systemId] || {}
    const updatedSystemItems = { ...currentSystemItems, ...updates }
    const deltaTrackableItems = {
      [systemId]: updatedSystemItems,
    }

    setEntry(prev => {
      if (!prev) return null
      return {
        ...prev,
        systemTrackableItems: {
          ...prev.systemTrackableItems,
          ...deltaTrackableItems
        }
      }
    })

    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemTrackableItems: deltaTrackableItems,
        }),
      })

      if (!response.ok) throw new Error("Failed to update status")
    } catch {
      toast.error("Fehler beim Speichern des Status")
      fetchEntry()
    }
  }, [maintenanceId, fetchEntry])

  const handleBulkAssignTechnician = useCallback(async (technicianId: string) => {
    const currentEntry = entryRef.current
    if (!currentEntry || !maintenanceId || selectedSystems.size === 0) return

    const deltaAssignments: Record<string, string[]> = {}

    selectedSystems.forEach(systemId => {
      deltaAssignments[systemId] = technicianId ? [technicianId] : []
    })

    setEntry(prev => {
      if (!prev) return null
      return {
        ...prev,
        systemTechnicianAssignments: {
          ...prev.systemTechnicianAssignments,
          ...deltaAssignments
        }
      }
    })

    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemTechnicianAssignments: deltaAssignments,
        }),
      })

      if (!response.ok) throw new Error("Failed to update technician assignment")
      toast.success(`Techniker für ${selectedSystems.size} Systeme zugewiesen`)
      setSelectedSystems(new Set())
    } catch {
      toast.error("Fehler beim Zuweisen des Technikers")
      fetchEntry()
    }
  }, [maintenanceId, fetchEntry, selectedSystems])

  const handleSystemSelectionChange = useCallback((systemId: string, selected: boolean) => {
    setSelectedSystems(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(systemId)
      } else {
        newSet.delete(systemId)
      }
      return newSet
    })
  }, [])

  const handleToggleSelectAll = () => {
    if (selectedSystems.size === filteredSystems.length) {
      setSelectedSystems(new Set())
    } else {
      setSelectedSystems(new Set(filteredSystems.map(s => s.id)))
    }
  }

  const handleCrossSystemBulkUpdate = async (status: string) => {
    if (!entry || selectedSystems.size === 0) return

    const deltaTrackableItems: Record<string, Record<string, string>> = {}

    // Update ALL trackable items for each selected system (delta only)
    selectedSystems.forEach(systemId => {
      const currentSystemItems = entry.systemTrackableItems?.[systemId] || {}
      // Set all trackable items to the selected status
      deltaTrackableItems[systemId] = {
        ...currentSystemItems,
        system_load: status,
        vmware_tools: status,
        os_updates: status,
        app_updates: status,
        reboots: status,
        sql_update: status,
        exchange_update: status,
        event_log: status,
        services: status,
        final_check: status,
      }
    })

    // Optimistic update
    setEntry(prev => {
      if (!prev) return null
      return {
        ...prev,
        systemTrackableItems: {
          ...prev.systemTrackableItems,
          ...deltaTrackableItems
        }
      }
    })

    try {
      const response = await fetch(`/api/maintenance/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemTrackableItems: deltaTrackableItems,
        }),
      })

      if (!response.ok) throw new Error("Failed to update status")
      toast.success(`Alle Felder für ${selectedSystems.size} Systeme auf "${STATUS_LABELS[status] || status}" gesetzt`)
      setSelectedSystems(new Set()) // Clear selection after successful update
    } catch {
      toast.error("Fehler beim Speichern des Status")
      fetchEntry()
    }
  }

  const handleSaveMaintenanceNotes = async () => {
    if (!entry?.customer?.id) return

    try {
      const response = await fetch(`/api/customers/${entry.customer.id}/maintenance-notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceNotes: maintenanceNotes,
        }),
      })

      if (!response.ok) throw new Error("Failed to save notes")
      toast.success("Wartungsnotizen gespeichert")
    } catch {
      toast.error("Fehler beim Speichern der Notizen")
    }
  }

  const handleEditSubmit = async (data: MaintenanceEntryFormData) => {
    if (!entry) return

    try {
      const response = await fetch(`/api/maintenance/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: data.customerId,
          systemIds: data.systemIds ?? [],
          technicianIds: data.technicianIds ?? [],
          date: data.date,
        }),
      })

      if (!response.ok) {
        throw new Error("Wartung konnte nicht aktualisiert werden.")
      }

      toast.success("Wartung erfolgreich aktualisiert.")
      setIsEditOpen(false)
      await fetchEntry()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler beim Aktualisieren."
      toast.error(message)
    }
  }

  const resetFilters = () => {
    setFilters({ hardwareType: null, serverApplicationType: null, technicianId: null, operatingSystem: null, checkStatus: null });
  };

  const filteredSystems = useMemo(() => {
    return systems.filter(system => {
      const matchesSearch =
        system.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        system.ipAddress?.includes(searchQuery) ||
        system.operatingSystem?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filters.hardwareType && system.hardwareType !== filters.hardwareType) return false;
      if (filters.serverApplicationType && system.serverApplicationType !== filters.serverApplicationType) return false;
      if (filters.technicianId) {
        const assignedTechs = entry?.systemTechnicianAssignments?.[system.id] || [];
        if (filters.technicianId === "unassigned") {
          if (assignedTechs.length > 0) return false;
        } else {
          if (!assignedTechs.includes(filters.technicianId)) return false;
        }
      }
      if (filters.operatingSystem) {
        const os = system.operatingSystem?.toLowerCase() || "";
        if (filters.operatingSystem === "Windows" && !os.includes("win")) return false;
        if (filters.operatingSystem === "Linux" && !(os.includes("linux") || os.includes("debian") || os.includes("ubuntu"))) return false;
        if (filters.operatingSystem === "Other" && (os.includes("win") || os.includes("linux") || os.includes("debian") || os.includes("ubuntu"))) return false;
      }
      if (filters.checkStatus) {
        const systemItems = entry?.systemTrackableItems?.[system.id] || {};
        const hasMatchingStatus = Object.values(systemItems).some(
          status => status === filters.checkStatus
        );
        if (!hasMatchingStatus) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort Ascending (A-Z) by hostname
      return a.hostname.localeCompare(b.hostname)
    });
  }, [systems, searchQuery, filters, entry?.systemTechnicianAssignments, entry?.systemTrackableItems]);

  // Derive technicians available for this maintenance
  const maintenanceTechnicians = useMemo(() => {
    if (!entry?.technicianIds || entry.technicianIds.length === 0) return []
    return technicians.filter(tech => entry.technicianIds?.includes(tech.id))
  }, [entry?.technicianIds, technicians])

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
      {/* Header Section */}
      <div className="space-y-4">
        <Breadcrumb
          segments={[
            { name: "Dashboard", href: "/dashboard" },
            { name: "Wartungen", href: "/dashboard/maintenance" },
            { name: entry.title },
          ]}
        />

        {/* Modern Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Customer Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleManualRefresh}
                className={isRefreshing ? "animate-spin" : ""}
                title={`Zuletzt aktualisiert: ${lastRefreshed.toLocaleTimeString()}`}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 p-4 rounded-lg border bg-card">
              {/* Customer Name */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-base">{entry.customer?.name}</div>
                  <div className="text-xs text-muted-foreground">{entry.customer?.abbreviation}</div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2.5">
                {/* Service Manager */}
                {entry.customer?.serviceManager && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Service Manager:</span>
                    <span className="font-medium">{entry.customer.serviceManager}</span>
                  </div>
                )}

                {/* Address */}
                {(entry.customer?.city || entry.customer?.address) && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Adresse:</span>
                    <span className="font-medium">
                      {entry.customer.address}, {entry.customer.postalCode} {entry.customer.city}
                    </span>
                  </div>
                )}

                {/* Email */}
                {entry.customer?.businessEmail && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">E-Mail:</span>
                    <a
                      href={`mailto:${entry.customer.businessEmail}`}
                      className="font-medium hover:text-primary transition-colors hover:underline"
                    >
                      {entry.customer.businessEmail}
                    </a>
                  </div>
                )}

                {/* Phone */}
                {entry.customer?.businessPhone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Telefon:</span>
                    <a
                      href={`tel:${entry.customer.businessPhone}`}
                      className="font-medium hover:text-primary transition-colors hover:underline"
                    >
                      {entry.customer.businessPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Contact People & Report Button */}
          <div className="space-y-4">
            {/* Contact People */}
            {entry.customer?.contactPeople && entry.customer.contactPeople.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Ansprechpartner</span>
                </div>
                <div className="space-y-2">
                  {entry.customer.contactPeople.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-medium text-sm">{contact.name}</div>
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contact.email}</span>
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Report Button and Status Button - Always at bottom right */}
            <div className="flex justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Status ändern
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Wartungsstatus</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Planned' }),
                        })
                        if (!response.ok) throw new Error('Failed to update status')
                        await fetchEntry()
                        toast.success('Status auf "Geplant" gesetzt')
                      } catch {
                        toast.error('Fehler beim Aktualisieren des Status')
                      }
                    }}
                  >
                    Geplant
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'InProgress' }),
                        })
                        if (!response.ok) throw new Error('Failed to update status')
                        await fetchEntry()
                        toast.success('Status auf "In Arbeit" gesetzt')
                      } catch {
                        toast.error('Fehler beim Aktualisieren des Status')
                      }
                    }}
                  >
                    In Arbeit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'OK' }),
                        })
                        if (!response.ok) throw new Error('Failed to update status')
                        await fetchEntry()
                        toast.success('Status auf "Abgeschlossen" gesetzt')
                      } catch {
                        toast.error('Fehler beim Aktualisieren des Status')
                      }
                    }}
                  >
                    Abgeschlossen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Error' }),
                        })
                        if (!response.ok) throw new Error('Failed to update status')
                        await fetchEntry()
                        toast.success('Status auf "Fehler" gesetzt')
                      } catch {
                        toast.error('Fehler beim Aktualisieren des Status')
                      }
                    }}
                  >
                    Fehler
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        const response = await fetch(`/api/maintenance/${maintenanceId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'NotApplicable' }),
                        })
                        if (!response.ok) throw new Error('Failed to update status')
                        await fetchEntry()
                        toast.success('Status auf "Nicht anwendbar" gesetzt')
                      } catch {
                        toast.error('Fehler beim Aktualisieren des Status')
                      }
                    }}
                  >
                    Nicht anwendbar
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleReport} className="bg-primary shadow-sm hover:bg-primary/90">
                <FileText className="mr-2 h-4 w-4" />
                Bericht erstellen
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wartung bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Details der Wartung.</DialogDescription>
          </DialogHeader>
          {entry && (
            <MaintenanceEntryForm
              initialData={{
                id: entry.id,
                customerId: entry.customerId,
                systemIds: entry.systemIds || [],
                technicianIds: entry.technicianIds || [],
                date: entry.date,
              }}
              customers={entry.customer ? [{
                id: entry.customer.id,
                name: entry.customer.name,
                abbreviation: entry.customer.abbreviation
              }] : []}
              systems={systems.map(s => ({ ...s, customerId: entry.customerId }))}
              technicians={technicians.map(t => t.id)}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditOpen(false)}
              submitButtonText="Änderungen speichern"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Separator */}
      <div className="border-t" />

      {/* Systems Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            Systemstatus
            <Badge variant="secondary" className="ml-2 rounded-full px-2.5">
              {filteredSystems.length}
            </Badge>
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                className="pl-9 h-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3">
                  Filter

                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filtern nach</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Betriebssystem Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Betriebssystem</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {["Windows", "Linux", "Andere"].map((label) => (
                        <DropdownMenuItem
                          key={label}
                          onSelect={() => setFilters(prev => ({ ...prev, operatingSystem: label }))}
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Betriebsart Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Betriebsart</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {hardwareTypes.map(type => (
                        <DropdownMenuItem
                          key={type.id}
                          onSelect={() => setFilters(prev => ({ ...prev, hardwareType: type.value }))}
                        >
                          {type.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Funktion Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Funktion</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {availableServerApps.map(type => (
                        <DropdownMenuItem
                          key={type.value}
                          onSelect={() => setFilters(prev => ({ ...prev, serverApplicationType: type.value }))}
                        >
                          {type.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Technician Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Techniker</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, technicianId: "unassigned" }))}>
                        Nicht zugewiesen
                      </DropdownMenuItem>
                      {technicians.map(tech => (
                        <DropdownMenuItem
                          key={tech.id}
                          onSelect={() => setFilters(prev => ({ ...prev, technicianId: tech.id }))}
                        >
                          {tech.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Check Status Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Status der Checks</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, checkStatus: "OK" }))}>
                        OK
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, checkStatus: "Error" }))}>
                        Fehler
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, checkStatus: "InProgress" }))}>
                        In Arbeit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, checkStatus: "NotDone" }))}>
                        Offen
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, checkStatus: "NotApplicable" }))}>
                        N/A
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setFilters({ hardwareType: null, serverApplicationType: null, technicianId: null, operatingSystem: null, checkStatus: null })}
                >
                  Filter zurücksetzen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {systemsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredSystems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredSystems.map(system => {
              // Filter technicians to only show those assigned to this maintenance
              const availableTechnicians = entry.technicianIds && entry.technicianIds.length > 0
                ? technicians.filter(tech => entry.technicianIds?.includes(tech.id))
                : technicians;

              return (
                <div key={system.id} className="h-full">
                  <SystemCard
                    system={system}
                    technicians={availableTechnicians}
                    assignedTechnicianId={entry.systemTechnicianAssignments?.[system.id]?.[0]}
                    onAssignTechnician={handleAssignTechnician}
                    trackableItems={entry.systemTrackableItems?.[system.id] || {}}

                    onBulkUpdateTrackableItems={handleBulkUpdateTrackableItems}
                    systemNote={entry.systemNotes?.[system.id] || ""}
                    onUpdateSystemNote={handleUpdateSystemNote}
                    isSystemSelected={selectedSystems.has(system.id)}
                    onSystemSelectionChange={handleSystemSelectionChange}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">Keine Systeme gefunden.</p>
            <Button variant="link" onClick={() => { setSearchQuery(""); resetFilters(); }}>
              Filter zurücksetzen
            </Button>
          </div>
        )}
      </div>

      {/* Customer Maintenance Notes */}
      <div className="space-y-4 pt-4 border-t">
        <h2 className="text-lg font-semibold tracking-tight">Wartungsnotizen</h2>
        <SimpleEditor
          content={maintenanceNotes}
          onContentChange={setMaintenanceNotes}
        />
        <div className="flex justify-end">
          <Button onClick={handleSaveMaintenanceNotes} disabled={!entry.customer?.id}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </div>
      </div>

      {/* Multi-System Bulk Update Bar */}
      {selectedSystems.size > 0 && (
        <MultiSystemBulkUpdateBar
          selectedCount={selectedSystems.size}
          allSelected={selectedSystems.size === filteredSystems.length && filteredSystems.length > 0}
          technicians={maintenanceTechnicians.length > 0 ? maintenanceTechnicians : technicians}
          onToggleSelectAll={handleToggleSelectAll}
          onBulkUpdate={handleCrossSystemBulkUpdate}
          onBulkAssignTechnician={handleBulkAssignTechnician}
          onClearSelection={() => setSelectedSystems(new Set())}
        />
      )}
    </div>
  )
}

