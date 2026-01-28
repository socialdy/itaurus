"use client"

import { SyntheticEvent, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Search } from "lucide-react"
import Image from "next/image"

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
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { Combobox } from "@/components/ui/combobox"
import { useSortableTable } from "@/hooks/use-sortable-table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"

type SystemEntry = {
  id: string
  hostname: string
  description?: string | null
  ipAddress?: string | null
  hardwareType?: string | null
  operatingSystem?: string | null
  serverApplicationType?: string | null
  maintenanceInterval?: string | null
  maintenanceTechnician?: string | null
  installedSoftware?: string[] | null
  customerId?: string | null
  customer?: { id: string; name: string; abbreviation: string }
}

type Filters = {
  operatingSystem: string
  hardwareType: string
  maintenanceInterval: string
  serverApplicationType: string
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

const handleIconError = (event: SyntheticEvent<HTMLImageElement>) => {
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

export default function SystemsPage() {
  const [systems, setSystems] = useState<SystemEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [filters, setFilters] = useState<Filters>({
    operatingSystem: "all",
    hardwareType: "all",
    maintenanceInterval: "all",
    serverApplicationType: "all",
  })
  const PAGE_SIZE = 15
  const [page, setPage] = useState(1)

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

  const normalizedSearch = search.trim().toLowerCase()

  const optionData = useMemo(() => {
    const customers = new Map<string, string>()
    const operatingSystems = new Set<string>()
    const hardwareTypes = new Set<string>()
    const maintenanceIntervals = new Set<string>()
    const serverApps = new Set<string>()

    systems.forEach((system) => {
      const customerKey = system.customer?.id ?? system.customerId
      if (customerKey) {
        // Use abbreviation instead of full name
        customers.set(customerKey, system.customer?.abbreviation || system.customer?.name || system.hostname)
      }
      if (system.operatingSystem) operatingSystems.add(system.operatingSystem)
      if (system.hardwareType) hardwareTypes.add(system.hardwareType)
      if (system.maintenanceInterval && system.maintenanceInterval !== "null") maintenanceIntervals.add(system.maintenanceInterval)
      if (system.serverApplicationType && !["APPLICATION", "Application"].includes(system.serverApplicationType)) {
        serverApps.add(system.serverApplicationType)
      }
    })

    const toOption = (value: string) => ({ value, label: formatLabel(value) })

    // Sort customers alphabetically by abbreviation
    const sortedCustomers = Array.from(customers.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return {
      customers: sortedCustomers,
      operatingSystems: Array.from(operatingSystems).map(toOption),
      hardwareTypes: Array.from(hardwareTypes).map(toOption),
      maintenanceIntervals: Array.from(maintenanceIntervals).map(toOption),
      serverApps: Array.from(serverApps).map(toOption),
    }
  }, [systems])

  const filteredSystems = useMemo(() => {
    return systems.filter((system) => {
      if (selectedCustomer !== "all") {
        const matchesCustomer =
          system.customer?.id === selectedCustomer || system.customerId === selectedCustomer
        if (!matchesCustomer) {
          return false
        }
      }
      if (filters.operatingSystem !== "all") {
        const normalizedOs = formatDisplayOs(system.operatingSystem)
        if (normalizedOs !== filters.operatingSystem) {
          return false
        }
      }
      if (filters.hardwareType !== "all" && system.hardwareType !== filters.hardwareType) {
        return false
      }
      if (
        filters.maintenanceInterval !== "all" &&
        system.maintenanceInterval !== filters.maintenanceInterval
      ) {
        return false
      }
      if (
        filters.serverApplicationType !== "all"
      ) {
        const isAndereFilter = ["OTHERS", "Others", "OTHER", "Other"].includes(filters.serverApplicationType);
        if (isAndereFilter) {
          const isAndereType = ["OTHERS", "Others", "OTHER", "Other", "APPLICATION", "Application"].includes(system.serverApplicationType || "");
          if (!isAndereType) {
            return false
          }
        } else if (system.serverApplicationType !== filters.serverApplicationType) {
          return false
        }
      }

      if (!normalizedSearch) {
        return true
      }

      const matchesSearch =
        system.hostname.toLowerCase().includes(normalizedSearch) ||
        system.customer?.name.toLowerCase().includes(normalizedSearch) ||
        system.customer?.abbreviation.toLowerCase().includes(normalizedSearch) ||
        system.installedSoftware?.some((software) =>
          software.toLowerCase().includes(normalizedSearch)
        )

      return matchesSearch
    })
  }, [systems, filters, normalizedSearch, selectedCustomer])

  // Sorting
  const { sortedData, sortConfig, requestSort } = useSortableTable(filteredSystems, "hostname" as keyof SystemEntry)

  const resetFilters = () => {
    setFilters({
      operatingSystem: "all",
      hardwareType: "all",
      maintenanceInterval: "all",
      serverApplicationType: "all",
    })
    setSelectedCustomer("all")
  }

  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE) || 1
  const startIdx = (page - 1) * PAGE_SIZE
  const paginatedSystems = sortedData.slice(startIdx, startIdx + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filters, selectedCustomer])

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Systeme" },
        ]}
        className="mb-4"
      />

      <PageHeader
        title="Systeme"
        description="Hier sieht man alle Systeme und deren Informationen."
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="customer-select">
          Kunde filtern
        </label>
        <div className="w-full max-w-sm">
          <Combobox
            options={[
              { value: "all", label: "Alle Kunden" },
              ...optionData.customers.map(({ value, label }) => ({ value, label }))
            ]}
            value={selectedCustomer}
            onChange={(value) => {
              if (typeof value === "string") {
                setSelectedCustomer(value)
              }
            }}
            placeholder="Kunde auswählen..."
            emptyStateMessage="Keine Kunden gefunden."
            searchPlaceholder="Kunden suchen..."
          />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Alle Systeme</CardTitle>
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <div className="relative w-full min-w-[220px] max-w-sm lg:w-56">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Systeme suchen..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
                              setFilters((prev) => ({
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
                        {optionData.hardwareTypes.map(({ value }) => (
                          <DropdownMenuItem
                            key={value}
                            onSelect={() =>
                              setFilters((prev) => ({ ...prev, hardwareType: value }))
                            }
                          >
                            {formatHardwareType(value)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Funktion</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {optionData.serverApps.map(({ value }) => (
                          <DropdownMenuItem
                            key={value}
                            onSelect={() =>
                              setFilters((prev) => ({ ...prev, serverApplicationType: value }))
                            }
                          >
                            {formatLabel(value)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Wartungsintervall</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {optionData.maintenanceIntervals.map(({ value, label }) => (
                          <DropdownMenuItem
                            key={value}
                            onSelect={() =>
                              setFilters((prev) => ({ ...prev, maintenanceInterval: value }))
                            }
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={resetFilters}>
                    Filter zurücksetzen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
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
          ) : sortedData.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Keine Systeme gefunden.
            </div>
          ) : (
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <SortableTableHead<SystemEntry>
                    label="Hostname"
                    sortKey="hostname"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                  />
                  <TableHead>Programme</TableHead>
                  <SortableTableHead<SystemEntry>
                    label="OS"
                    sortKey="operatingSystem"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                  />
                  <SortableTableHead<SystemEntry>
                    label="Betriebsart"
                    sortKey="hardwareType"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                  />
                  <SortableTableHead<SystemEntry>
                    label="Funktion"
                    sortKey="serverApplicationType"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                  />
                  <SortableTableHead<SystemEntry>
                    label="Intervall"
                    sortKey="maintenanceInterval"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                    className=""
                  />
                  <SortableTableHead<SystemEntry>
                    label="Techniker"
                    sortKey="maintenanceTechnician"
                    currentSortKey={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={requestSort}
                    className=""
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSystems.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell className="align-top">
                      <div className="font-medium">{system.hostname}</div>
                      {system.ipAddress ? (
                        <p className="text-xs text-muted-foreground">{system.ipAddress}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      {renderInstalledSoftware(system.installedSoftware)}
                    </TableCell>
                    <TableCell className="align-top">{formatDisplayOs(system.operatingSystem)}</TableCell>
                    <TableCell className="align-top">{formatHardwareType(system.hardwareType)}</TableCell>
                    <TableCell className="align-top">
                      {formatLabel(system.serverApplicationType)}
                    </TableCell>
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
          )}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Zurück
            </Button>
            <span className="text-sm font-medium">
              Seite {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Weiter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
