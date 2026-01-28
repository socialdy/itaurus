"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { AlertCircle, Building2, Mail, Phone, MapPin, User, Server, Clock, CheckCircle2, Search, Trash2, MoreHorizontal, Pencil } from "lucide-react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useSortableTable } from "@/hooks/use-sortable-table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"

type ContactPerson = {
    id?: string
    name: string
    email: string
    phone: string
}

type SystemSummary = {
    id: string
    hostname: string
    ipAddress?: string | null
    hardwareType?: string | null
    operatingSystem?: string | null
    serverApplicationType?: string | null
    deviceType?: string | null
    maintenanceInterval?: string | null
    maintenanceTechnician?: string | null
    installedSoftware?: string[] | null
}

type MaintenanceEntry = {
    id: string
    title: string
    date: string
    status: "OK" | "Error" | "InProgress" | "NotApplicable" | "Planned"
    systemIds?: string[] | null
    coordinatorId?: string | null
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

const PAGE_SIZE = 15

// Formatting helpers from systems page
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

const formatDisplayOs = (value?: string | null) => {
    if (!value) return "–"
    const upper = value.toUpperCase()
    if (upper.startsWith("WIN")) return "Windows"
    if (upper.includes("DEBIAN") || upper.includes("LINUX") || upper.includes("UBUNTU")) return "Linux"
    return "Andere"
}

const formatHardwareType = (value?: string | null) => {
    if (!value) return "–"
    if (value.toUpperCase() === "PHYSICAL") return "physisch"
    if (value.toUpperCase() === "VIRTUAL") return "virtuell"
    return formatLabel(value)
}

const SOFTWARE_ICON_KEYWORDS: { regex: RegExp; path: string }[] = [
    { regex: /pdf[-_ ]?x(change)?|pdfxchange/i, path: "/icons/software/pdf_exchange.png" },
    { regex: /winscp/i, path: "/icons/software/winscp.svg" },
    { regex: /adobe.?reader/i, path: "/icons/software/adobe_reader.png" },
    { regex: /adobe.?acrobat/i, path: "/icons/software/adobe_acrobat.png" },
    { regex: /^dc$|double ?commander/i, path: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Double_Commander_logo.png" },
    { regex: /ultra ?vnc/i, path: "/icons/software/ultra_vnc.jpg" },
    { regex: /team.?viewer|viewver/i, path: "https://upload.wikimedia.org/wikipedia/commons/9/98/TeamViewer_logo.png" },
    { regex: /teams/i, path: "/icons/software/teams.png" },
    { regex: /office|m365|word|excel/i, path: "/icons/software/office365.png" },
    { regex: /chrome/i, path: "/icons/software/chrome.png" },
    { regex: /firefox/i, path: "/icons/software/firefox.png" },
    { regex: /veeam/i, path: "/icons/software/veeam.png" },
    { regex: /vlc/i, path: "/icons/software/vlc.svg" },
    { regex: /pdf24/i, path: "/icons/software/pdf24.png" },
    { regex: /filezilla/i, path: "/icons/software/filezilla.png" },
    { regex: /exchange/i, path: "/icons/software/exchange.png" },
    { regex: /mysql/i, path: "/icons/software/mysql.png" },
    { regex: /sql/i, path: "/icons/software/sql.png" },
    { regex: /7-?zip/i, path: "/icons/software/7zip.svg" },
    { regex: /java/i, path: "/icons/software/java.png" },
    { regex: /foxit|foxxit/i, path: "/icons/software/foxxit.png" },
    { regex: /notepad/i, path: "/icons/software/notepad.svg" },
    { regex: /sumatra/i, path: "/icons/software/sumatra_pdf.png" },
    { regex: /edge/i, path: "/icons/software/edge.png" },
    { regex: /outlook/i, path: "/icons/software/outlook.png" },
    { regex: /eset/i, path: "/icons/software/eset.png" },
]

const slugifySoftwareName = (name: string) =>
    name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")

const getSoftwareIconCandidates = (name: string) => {
    const keywordMatch = SOFTWARE_ICON_KEYWORDS.find(({ regex }) => regex.test(name))
    if (keywordMatch) {
        return [keywordMatch.path]
    }
    const slug = slugifySoftwareName(name)
    return [`/icons/software/${slug}.png`, `/icons/software/${slug}.svg`]
}

const handleIconError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget
    const candidates = target.dataset.iconCandidates?.split("|") ?? []
    const currentIndex = Number(target.dataset.iconIndex ?? "0")
    if (currentIndex < candidates.length - 1) {
        const nextIndex = currentIndex + 1
        target.dataset.iconIndex = String(nextIndex)
        target.src = candidates[nextIndex]
    } else {
        target.style.display = "none"
    }
}

const renderInstalledSoftware = (software?: string[] | null) => {
    if (!software || software.length === 0) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {software.map((name) => {
                const candidates = getSoftwareIconCandidates(name)
                return (
                    <Badge key={name} variant="secondary" className="flex items-center gap-1 text-xs">
                        <span className="relative h-4 w-4 overflow-hidden rounded-sm bg-white">
                            <Image
                                src={candidates[0]}
                                alt={name}
                                width={16}
                                height={16}
                                className="h-4 w-4 object-contain"
                                onError={handleIconError}
                                unoptimized
                            />
                        </span>
                        {name}
                    </Badge>
                )
            })}
        </div>
    )
}

export default function CustomerDetailsPage() {
    const router = useRouter()
    const params = useParams<{ id?: string }>()
    const customerId = params?.id

    const [customer, setCustomer] = useState<CustomerDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Pagination State
    const [systemsPage, setSystemsPage] = useState(1)
    const [openPage, setOpenPage] = useState(1)
    const [pastPage, setPastPage] = useState(1)

    // Systems tab search and filters
    const [systemsSearch, setSystemsSearch] = useState("")
    const [systemsFilters, setSystemsFilters] = useState({
        operatingSystem: "all",
        hardwareType: "all",
        serverApplicationType: "all",
        maintenanceInterval: "all",
    })

    // Open maintenance search and filters
    const [openMaintenanceSearch, setOpenMaintenanceSearch] = useState("")
    const [openMaintenanceStatusFilter, setOpenMaintenanceStatusFilter] = useState<"all" | "Planned" | "InProgress">("all")
    const [openMaintenanceTechnicianFilter, setOpenMaintenanceTechnicianFilter] = useState<string>("all")

    // Past maintenance search and filters
    const [pastMaintenanceSearch, setPastMaintenanceSearch] = useState("")
    const [pastMaintenanceStatusFilter, setPastMaintenanceStatusFilter] = useState<"all" | "OK" | "Error" | "NotApplicable">("all")
    const [pastMaintenanceTechnicianFilter, setPastMaintenanceTechnicianFilter] = useState<string>("all")

    // Delete and edit state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [entryToDelete, setEntryToDelete] = useState<MaintenanceEntry | null>(null)

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

    const fetchCustomerData = useCallback(async () => {
        if (!customerId) return
        try {
            const response = await fetch(`/api/customers/${customerId}`)
            if (!response.ok) throw new Error("Kunde konnte nicht geladen werden.")
            const data = (await response.json()) as CustomerApiResponse
            setCustomer({
                ...data,
                contactPersons: data.contactPeople ?? data.contactPersons ?? [],
                systems: data.systems ?? [],
                maintenanceEntries: data.maintenanceEntries ?? [],
            })
        } catch (error) {
            console.error("Error fetching customer:", error)
        }
    }, [customerId])

    const maintenanceStats = useMemo(() => {
        if (!customer) {
            return {
                open: [] as MaintenanceEntry[],
                past: [] as MaintenanceEntry[],
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
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const past = customer.maintenanceEntries.filter(
            (entry) => entry.status === "OK" || entry.status === "Error" ||
                (entry.status === "NotApplicable" && new Date(entry.date) < now)
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return { open, past }
    }, [customer])

    // Systems filtering and pagination
    const filteredSystems = useMemo(() => {
        if (!customer) return []

        const normalizedSearch = systemsSearch.trim().toLowerCase()

        return customer.systems.filter((system) => {
            // Apply filters
            if (systemsFilters.operatingSystem !== "all") {
                const normalizedOs = formatDisplayOs(system.operatingSystem)
                if (normalizedOs !== systemsFilters.operatingSystem) {
                    return false
                }
            }
            if (systemsFilters.hardwareType !== "all" && system.hardwareType !== systemsFilters.hardwareType) {
                return false
            }
            if (systemsFilters.serverApplicationType !== "all") {
                const isAndereFilter = ["OTHERS", "Others", "OTHER", "Other"].includes(systemsFilters.serverApplicationType);
                if (isAndereFilter) {
                    const isAndereType = ["OTHERS", "Others", "OTHER", "Other", "APPLICATION", "Application"].includes(system.serverApplicationType || "");
                    if (!isAndereType) {
                        return false
                    }
                } else if (system.serverApplicationType !== systemsFilters.serverApplicationType) {
                    return false
                }
            }
            if (systemsFilters.maintenanceInterval !== "all" && system.maintenanceInterval !== systemsFilters.maintenanceInterval) {
                return false
            }

            // Apply search
            if (!normalizedSearch) {
                return true
            }

            const matchesSearch =
                system.hostname.toLowerCase().includes(normalizedSearch) ||
                system.ipAddress?.toLowerCase().includes(normalizedSearch) ||
                system.installedSoftware?.some((software) =>
                    software.toLowerCase().includes(normalizedSearch)
                )

            return matchesSearch
        })
    }, [customer, systemsSearch, systemsFilters])

    // Sorting for systems
    const { sortedData: sortedSystems, sortConfig: systemsSortConfig, requestSort: requestSystemsSort } = useSortableTable(filteredSystems, "hostname" as keyof SystemSummary)

    const paginatedSystems = useMemo(() => {
        const start = (systemsPage - 1) * PAGE_SIZE
        return sortedSystems.slice(start, start + PAGE_SIZE)
    }, [sortedSystems, systemsPage])

    const systemsTotalPages = Math.ceil(sortedSystems.length / PAGE_SIZE) || 1

    // Reset page when filters/search change
    useEffect(() => {
        setSystemsPage(1)
    }, [systemsSearch, systemsFilters])

    useEffect(() => {
        setOpenPage(1)
    }, [openMaintenanceSearch, openMaintenanceStatusFilter, openMaintenanceTechnicianFilter])

    useEffect(() => {
        setPastPage(1)
    }, [pastMaintenanceSearch, pastMaintenanceStatusFilter, pastMaintenanceTechnicianFilter])

    const availableOpenTechnicians = useMemo(() => {
        const technicians = new Set<string>()
        maintenanceStats.open.forEach(entry => {
            if (entry.coordinatorId) technicians.add(entry.coordinatorId)
        })
        return Array.from(technicians).sort()
    }, [maintenanceStats.open])

    const availablePastTechnicians = useMemo(() => {
        const technicians = new Set<string>()
        maintenanceStats.past.forEach(entry => {
            if (entry.coordinatorId) technicians.add(entry.coordinatorId)
        })
        return Array.from(technicians).sort()
    }, [maintenanceStats.past])

    // Sorting for open maintenance
    const filteredOpenMaintenance = useMemo(() => {
        let filtered = maintenanceStats.open
        if (openMaintenanceSearch.trim()) {
            const searchLower = openMaintenanceSearch.trim().toLowerCase()
            filtered = filtered.filter(entry => entry.title.toLowerCase().includes(searchLower))
        }
        if (openMaintenanceStatusFilter !== "all") {
            filtered = filtered.filter(entry => entry.status === openMaintenanceStatusFilter)
        }
        if (openMaintenanceTechnicianFilter !== "all") {
            filtered = filtered.filter(entry => entry.coordinatorId === openMaintenanceTechnicianFilter)
        }
        return filtered
    }, [maintenanceStats.open, openMaintenanceSearch, openMaintenanceStatusFilter, openMaintenanceTechnicianFilter])

    const { sortedData: sortedOpenMaintenance, sortConfig: openSortConfig, requestSort: requestOpenSort } = useSortableTable(filteredOpenMaintenance, "date" as keyof MaintenanceEntry)

    const paginatedOpenMaintenanceData = useMemo(() => {
        const start = (openPage - 1) * PAGE_SIZE
        return sortedOpenMaintenance.slice(start, start + PAGE_SIZE)
    }, [sortedOpenMaintenance, openPage])

    const openTotalPages = Math.ceil(maintenanceStats.open.length / PAGE_SIZE)

    // Sorting for past maintenance
    const filteredPastMaintenance = useMemo(() => {
        let filtered = maintenanceStats.past
        if (pastMaintenanceSearch.trim()) {
            const searchLower = pastMaintenanceSearch.trim().toLowerCase()
            filtered = filtered.filter(entry => entry.title.toLowerCase().includes(searchLower))
        }
        if (pastMaintenanceStatusFilter !== "all") {
            filtered = filtered.filter(entry => entry.status === pastMaintenanceStatusFilter)
        }
        if (pastMaintenanceTechnicianFilter !== "all") {
            filtered = filtered.filter(entry => entry.coordinatorId === pastMaintenanceTechnicianFilter)
        }
        return filtered
    }, [maintenanceStats.past, pastMaintenanceSearch, pastMaintenanceStatusFilter, pastMaintenanceTechnicianFilter])

    const { sortedData: sortedPastMaintenance, sortConfig: pastSortConfig, requestSort: requestPastSort } = useSortableTable(filteredPastMaintenance, "date" as keyof MaintenanceEntry)

    const paginatedPastMaintenanceData = useMemo(() => {
        const start = (pastPage - 1) * PAGE_SIZE
        return sortedPastMaintenance.slice(start, start + PAGE_SIZE)
    }, [sortedPastMaintenance, pastPage])

    const pastTotalPages = Math.ceil(maintenanceStats.past.length / PAGE_SIZE)


    const renderStatusBadge = (status: MaintenanceEntry["status"]) => {
        const toneMap: Record<MaintenanceEntry["status"], string> = {
            OK: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
            Error: "bg-red-500/15 text-red-700 border-red-200",
            InProgress: "bg-blue-500/15 text-blue-700 border-blue-200",
            NotApplicable: "bg-slate-500/15 text-slate-700 border-slate-200",
            Planned: "bg-amber-500/15 text-amber-700 border-amber-200",
        }
        return (
            <Badge variant="outline" className={`${toneMap[status]} border`}>
                {statusLabelMap[status]}
            </Badge>
        )
    }

    const handleDeleteMaintenance = async () => {
        if (!entryToDelete) return
        try {
            const response = await fetch(`/api/maintenance/${entryToDelete.id}`, { method: "DELETE" })
            if (!response.ok) throw new Error("Wartung konnte nicht gelöscht werden.")
            toast.success("Wartung erfolgreich gelöscht.")
            setDeleteDialogOpen(false)
            setEntryToDelete(null)
            await fetchCustomerData()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unbekannter Fehler beim Löschen."
            toast.error(message)
        }
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

    return (
        <div className="space-y-6 p-6">
            <Breadcrumb
                segments={[
                    { name: "Dashboard", href: "/dashboard" },
                    { name: "Kunden", href: "/dashboard/customers" },
                    { name: customer.name },
                ]}
            />

            {/* Header & Customer Info Combined */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {customer.name} <span className="text-muted-foreground font-normal">({customer.abbreviation})</span>
                    </h1>
                </div>

                <Card className="border-none shadow-none bg-transparent p-0">
                    <CardContent className="p-0">
                        <div className="grid gap-8 md:grid-cols-3">
                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4" />
                                    Anschrift
                                </h3>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    {customer.address && <p>{customer.address}</p>}
                                    {(customer.postalCode || customer.city) && (
                                        <p>{customer.postalCode} {customer.city}</p>
                                    )}
                                    {customer.country && <p>{customer.country}</p>}
                                    {!customer.address && !customer.city && <p>Keine Adresse hinterlegt</p>}
                                </div>
                            </div>

                            {/* Communication */}
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4" />
                                    Kontakt
                                </h3>
                                <div className="space-y-1.5 text-sm">
                                    {customer.businessEmail ? (
                                        <a href={`mailto:${customer.businessEmail}`} className="block text-muted-foreground hover:text-primary transition-colors truncate">
                                            {customer.businessEmail}
                                        </a>
                                    ) : (
                                        <p className="text-muted-foreground">Keine E-Mail</p>
                                    )}
                                    {customer.businessPhone ? (
                                        <a href={`tel:${customer.businessPhone}`} className="block text-muted-foreground hover:text-primary transition-colors">
                                            {customer.businessPhone}
                                        </a>
                                    ) : (
                                        <p className="text-muted-foreground">Kein Telefon</p>
                                    )}
                                    {customer.website ? (
                                        <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-primary transition-colors truncate">
                                            {customer.website}
                                        </a>
                                    ) : null}
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4" />
                                    Vertragsdaten
                                </h3>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground">Service Manager:</span>
                                        <span className="font-medium">{customer.serviceManager || "-"}</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-muted-foreground">SLA Status:</span>
                                        <Badge variant={customer.sla ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
                                            {customer.sla ? "Aktiv" : "Inaktiv"}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground">Abrechnung:</span>
                                        <span className="font-medium">{customer.billingCode || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Ansprechpartner
                </h2>
                {customer.contactPersons.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 italic">
                        Keine Ansprechpartner hinterlegt.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {customer.contactPersons.map((person, idx) => (
                            <Card key={person.email || idx} className="hover:border-primary/50 transition-colors">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                                        {person.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{person.name}</p>
                                        <div className="mt-1 space-y-0.5">
                                            {person.email && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                    <a href={`mailto:${person.email}`} className="text-primary hover:underline truncate">
                                                        {person.email}
                                                    </a>
                                                </div>
                                            )}
                                            {person.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                    <a href={`tel:${person.phone}`} className="text-primary hover:underline truncate">
                                                        {person.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabbed Section: Systems & Maintenance */}
            <div className="space-y-4">
                <Tabs defaultValue="systems" className="w-full">
                    <TabsList className="w-full flex h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto">
                        <TabsTrigger
                            value="systems"
                            className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all gap-2 py-2"
                        >
                            <Server className="h-4 w-4" />
                            <span className="truncate">Systeme ({customer.systems.length})</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="open"
                            className="flex-1 min-w-[180px] rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all gap-2 py-2"
                        >
                            <Clock className="h-4 w-4" />
                            <span className="truncate">Offene Wartungen ({maintenanceStats.open.length})</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="past"
                            className="flex-1 min-w-[200px] rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all gap-2 py-2"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="truncate">Vergangene Wartungen ({maintenanceStats.past.length})</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Systems Tab */}
                    <TabsContent value="systems" className="mt-6">
                        {customer.systems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border rounded-xl border-dashed">
                                <Server className="h-12 w-12 mb-4 opacity-20" />
                                <p>Keine Systeme vorhanden.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Search and Filters */}
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                    <div className="relative w-full min-w-[220px] max-w-sm lg:w-56">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Systeme suchen..."
                                            value={systemsSearch}
                                            onChange={(event) => setSystemsSearch(event.target.value)}
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
                                                <DropdownMenuSubTrigger>Betriebssystem</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {["Windows", "Linux", "Andere"].map((label) => (
                                                            <DropdownMenuItem
                                                                key={label}
                                                                onSelect={() =>
                                                                    setSystemsFilters((prev) => ({
                                                                        ...prev,
                                                                        operatingSystem: label,
                                                                    }))
                                                                }
                                                            >
                                                                {label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Betriebsart</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {["physisch", "virtuell"].map((label) => (
                                                            <DropdownMenuItem
                                                                key={label}
                                                                onSelect={() =>
                                                                    setSystemsFilters((prev) => ({
                                                                        ...prev,
                                                                        hardwareType: label === "physisch" ? "PHYSICAL" : "VIRTUAL",
                                                                    }))
                                                                }
                                                            >
                                                                {label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Funktion</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {["SQL", "Exchange", "Backup", "File", "Andere"].map((label) => (
                                                            <DropdownMenuItem
                                                                key={label}
                                                                onSelect={() =>
                                                                    setSystemsFilters((prev) => ({
                                                                        ...prev,
                                                                        serverApplicationType: label === "Andere" ? "OTHERS" : label.toUpperCase(),
                                                                    }))
                                                                }
                                                            >
                                                                {label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setSystemsFilters({
                                                        operatingSystem: "all",
                                                        hardwareType: "all",
                                                        serverApplicationType: "all",
                                                        maintenanceInterval: "all",
                                                    })
                                                }
                                            >
                                                Filter zurücksetzen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <SortableTableHead<SystemSummary>
                                                    label="Hostname"
                                                    sortKey="hostname"
                                                    currentSortKey={systemsSortConfig.key}
                                                    currentDirection={systemsSortConfig.direction}
                                                    onSort={requestSystemsSort}
                                                />
                                                <TableHead>Programme</TableHead>
                                                <SortableTableHead<SystemSummary>
                                                    label="OS"
                                                    sortKey="operatingSystem"
                                                    currentSortKey={systemsSortConfig.key}
                                                    currentDirection={systemsSortConfig.direction}
                                                    onSort={requestSystemsSort}
                                                />
                                                <SortableTableHead<SystemSummary>
                                                    label="Betriebsart"
                                                    sortKey="hardwareType"
                                                    currentSortKey={systemsSortConfig.key}
                                                    currentDirection={systemsSortConfig.direction}
                                                    onSort={requestSystemsSort}
                                                />
                                                <SortableTableHead<SystemSummary>
                                                    label="Funktion"
                                                    sortKey="serverApplicationType"
                                                    currentSortKey={systemsSortConfig.key}
                                                    currentDirection={systemsSortConfig.direction}
                                                    onSort={requestSystemsSort}
                                                />
                                                <SortableTableHead<SystemSummary>
                                                    label="Intervall"
                                                    sortKey="maintenanceInterval"
                                                    currentSortKey={systemsSortConfig.key}
                                                    currentDirection={systemsSortConfig.direction}
                                                    onSort={requestSystemsSort}
                                                    className=""
                                                />
                                                <SortableTableHead<SystemSummary>
                                                    label="Techniker"
                                                    sortKey="maintenanceTechnician"
                                                    currentSortKey={systemsSortConfig.key}
                                                    currentDirection={systemsSortConfig.direction}
                                                    onSort={requestSystemsSort}
                                                    className=""
                                                />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedSystems.map((system) => (
                                                <TableRow key={system.id}>
                                                    <TableCell className="align-top font-medium">
                                                        <div>{system.hostname}</div>
                                                        {system.ipAddress && (
                                                            <div className="text-xs text-muted-foreground">{system.ipAddress}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        {renderInstalledSoftware(system.installedSoftware)}
                                                    </TableCell>
                                                    <TableCell className="align-top">{formatDisplayOs(system.operatingSystem)}</TableCell>
                                                    <TableCell className="align-top">{formatHardwareType(system.hardwareType)}</TableCell>
                                                    <TableCell className="align-top">{formatLabel(system.serverApplicationType)}</TableCell>
                                                    <TableCell className="align-top">
                                                        {system.maintenanceInterval && system.maintenanceInterval !== "null" ? system.maintenanceInterval : ""}
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        {system.maintenanceTechnician && system.maintenanceTechnician !== "null" ? system.maintenanceTechnician : ""}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination for Systems */}
                                {systemsTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSystemsPage((p) => Math.max(1, p - 1))}
                                            disabled={systemsPage === 1}
                                        >
                                            Zurück
                                        </Button>
                                        <span className="text-sm font-medium">
                                            Seite {systemsPage} von {systemsTotalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSystemsPage((p) => Math.min(systemsTotalPages, p + 1))}
                                            disabled={systemsPage === systemsTotalPages}
                                        >
                                            Weiter
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* Open Maintenance Tab */}
                    <TabsContent value="open" className="mt-6">
                        {maintenanceStats.open.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border rounded-xl border-dashed">
                                <Clock className="h-12 w-12 mb-4 opacity-20" />
                                <p>Keine offenen Wartungen.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                    <div className="relative w-full min-w-[220px] max-w-sm lg:w-56">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Wartungen suchen..."
                                            value={openMaintenanceSearch}
                                            onChange={(event) => setOpenMaintenanceSearch(event.target.value)}
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
                                                        <DropdownMenuItem onSelect={() => setOpenMaintenanceStatusFilter("all")}>
                                                            Alle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setOpenMaintenanceStatusFilter("Planned")}>
                                                            Geplant
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setOpenMaintenanceStatusFilter("InProgress")}>
                                                            In Bearbeitung
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Techniker</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onSelect={() => setOpenMaintenanceTechnicianFilter("all")}>
                                                            Alle
                                                        </DropdownMenuItem>
                                                        {availableOpenTechnicians.map(tech => (
                                                            <DropdownMenuItem key={tech} onSelect={() => setOpenMaintenanceTechnicianFilter(tech)}>
                                                                {tech}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => {
                                                setOpenMaintenanceStatusFilter("all")
                                                setOpenMaintenanceTechnicianFilter("all")
                                            }}>
                                                Filter zurücksetzen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <SortableTableHead<MaintenanceEntry>
                                                    label="Titel"
                                                    sortKey="title"
                                                    currentSortKey={openSortConfig.key}
                                                    currentDirection={openSortConfig.direction}
                                                    onSort={requestOpenSort}
                                                />
                                                <SortableTableHead<MaintenanceEntry>
                                                    label="Datum"
                                                    sortKey="date"
                                                    currentSortKey={openSortConfig.key}
                                                    currentDirection={openSortConfig.direction}
                                                    onSort={requestOpenSort}
                                                />
                                                <SortableTableHead<MaintenanceEntry>
                                                    label="Status"
                                                    sortKey="status"
                                                    currentSortKey={openSortConfig.key}
                                                    currentDirection={openSortConfig.direction}
                                                    onSort={requestOpenSort}
                                                />
                                                <TableHead>Koordinator</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedOpenMaintenanceData.map((entry) => (
                                                <TableRow
                                                    key={entry.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => router.push(`/dashboard/maintenance/${entry.id}`)}
                                                >
                                                    <TableCell className="font-medium">{entry.title}</TableCell>
                                                    <TableCell>
                                                        {new Date(entry.date).toLocaleDateString("de-DE", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                        })}
                                                    </TableCell>
                                                    <TableCell>{renderStatusBadge(entry.status)}</TableCell>
                                                    <TableCell>
                                                        {entry.coordinatorId || "–"}
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Menü öffnen</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/maintenance/${entry.id}`)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Bearbeiten
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => {
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
                                </div>

                                {/* Pagination for Open Maintenance */}
                                {openTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setOpenPage((p) => Math.max(1, p - 1))}
                                            disabled={openPage === 1}
                                        >
                                            Zurück
                                        </Button>
                                        <span className="text-sm font-medium">
                                            Seite {openPage} von {openTotalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setOpenPage((p) => Math.min(openTotalPages, p + 1))}
                                            disabled={openPage === openTotalPages}
                                        >
                                            Weiter
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* Past Maintenance Tab */}
                    <TabsContent value="past" className="mt-6">
                        {maintenanceStats.past.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border rounded-xl border-dashed">
                                <CheckCircle2 className="h-12 w-12 mb-4 opacity-20" />
                                <p>Keine vergangenen Wartungen.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                    <div className="relative w-full min-w-[220px] max-w-sm lg:w-56">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Wartungen suchen..."
                                            value={pastMaintenanceSearch}
                                            onChange={(event) => setPastMaintenanceSearch(event.target.value)}
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
                                                        <DropdownMenuItem onSelect={() => setPastMaintenanceStatusFilter("all")}>
                                                            Alle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setPastMaintenanceStatusFilter("OK")}>
                                                            Abgeschlossen
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setPastMaintenanceStatusFilter("Error")}>
                                                            Fehler
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setPastMaintenanceStatusFilter("NotApplicable")}>
                                                            Nicht anwendbar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Techniker</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onSelect={() => setPastMaintenanceTechnicianFilter("all")}>
                                                            Alle
                                                        </DropdownMenuItem>
                                                        {availablePastTechnicians.map(tech => (
                                                            <DropdownMenuItem key={tech} onSelect={() => setPastMaintenanceTechnicianFilter(tech)}>
                                                                {tech}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => {
                                                setPastMaintenanceStatusFilter("all")
                                                setPastMaintenanceTechnicianFilter("all")
                                            }}>
                                                Filter zurücksetzen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <SortableTableHead<MaintenanceEntry>
                                                    label="Titel"
                                                    sortKey="title"
                                                    currentSortKey={pastSortConfig.key}
                                                    currentDirection={pastSortConfig.direction}
                                                    onSort={requestPastSort}
                                                />
                                                <SortableTableHead<MaintenanceEntry>
                                                    label="Datum"
                                                    sortKey="date"
                                                    currentSortKey={pastSortConfig.key}
                                                    currentDirection={pastSortConfig.direction}
                                                    onSort={requestPastSort}
                                                />
                                                <SortableTableHead<MaintenanceEntry>
                                                    label="Status"
                                                    sortKey="status"
                                                    currentSortKey={pastSortConfig.key}
                                                    currentDirection={pastSortConfig.direction}
                                                    onSort={requestPastSort}
                                                />
                                                <TableHead>Koordinator</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedPastMaintenanceData.map((entry) => (
                                                <TableRow
                                                    key={entry.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => router.push(`/dashboard/maintenance/${entry.id}`)}
                                                >
                                                    <TableCell className="font-medium">{entry.title}</TableCell>
                                                    <TableCell>
                                                        {new Date(entry.date).toLocaleDateString("de-DE", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                        })}
                                                    </TableCell>
                                                    <TableCell>{renderStatusBadge(entry.status)}</TableCell>
                                                    <TableCell>
                                                        {entry.coordinatorId || "–"}
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Menü öffnen</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/maintenance/${entry.id}`)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Bearbeiten
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => {
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
                                </div>

                                {/* Pagination for Past Maintenance */}
                                {pastTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-4 py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPastPage((p) => Math.max(1, p - 1))}
                                            disabled={pastPage === 1}
                                        >
                                            Zurück
                                        </Button>
                                        <span className="text-sm font-medium">
                                            Seite {pastPage} von {pastTotalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPastPage((p) => Math.min(pastTotalPages, p + 1))}
                                            disabled={pastPage === pastTotalPages}
                                        >
                                            Weiter
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Wartung löschen</DialogTitle>
                        <DialogDescription>
                            Sind Sie sicher, dass Sie die Wartung &quot;{entryToDelete?.title}&quot; löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
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
