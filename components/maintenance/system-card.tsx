"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Check, X, AlertTriangle, Ban, Minus,
    Monitor, Server, Database, Mail, FileText, Box,
    RefreshCw, Power, Activity
} from "lucide-react"
import Image from "next/image"
import { SyntheticEvent } from "react"
import { cn } from "@/lib/utils"

interface SystemCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    system: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    technicians: any[];
    assignedTechnicianId: string | undefined;
    onAssignTechnician: (systemId: string, technicianId: string) => void;
    trackableItems: Record<string, string | undefined>;
    onBulkUpdateTrackableItems: (systemId: string, updates: Record<string, string>) => void;
    systemNote: string;
    onUpdateSystemNote: (systemId: string, note: string) => void;
    isSystemSelected?: boolean;
    onSystemSelectionChange?: (systemId: string, selected: boolean) => void;
}

const TRACKABLE_ITEMS = [
    { id: "system_load", label: "Auslastung", icon: Activity },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { id: "vmware_tools", label: "VMWare Tools", icon: Box, condition: (sys: any) => sys.hardwareType === 'VIRTUAL' },
    { id: "os_updates", label: "OS Updates", icon: RefreshCw },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { id: "app_updates", label: "Software", icon: Box, condition: (sys: any) => sys.installedSoftware && sys.installedSoftware.length > 0 },
    { id: "reboots", label: "Reboots", icon: Power },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { id: "sql_update", label: "SQL", icon: Database, condition: (sys: any) => sys.serverApplicationType === 'SQL' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { id: "exchange_update", label: "Exchange", icon: Mail, condition: (sys: any) => sys.serverApplicationType === 'EXCHANGE' },
    { id: "event_log", label: "Events", icon: FileText },
    { id: "services", label: "Dienste", icon: Server },
    { id: "final_check", label: "Endkontrolle", icon: Check },
];

const STATUS_OPTIONS = [
    { value: "OK", label: "OK", icon: Check, color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200 hover:bg-emerald-200/80" },
    { value: "Error", label: "Fehler", icon: X, color: "text-red-700", bg: "bg-red-100 border-red-200 hover:bg-red-200/80" },
    { value: "InProgress", label: "In Arbeit", icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-100 border-amber-200 hover:bg-amber-200/80" },
    { value: "NotApplicable", label: "N/A", icon: Ban, color: "text-slate-500", bg: "bg-slate-100 border-slate-200 hover:bg-slate-200/80" },
    { value: "NotDone", label: "Offen", icon: Minus, color: "text-slate-600", bg: "bg-white border-slate-200 hover:bg-slate-50" },
];

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

const getOsIcon = (os: string) => {
    if (!os) return { icon: Monitor, label: "Unknown" };
    const lower = os.toLowerCase();
    if (lower.includes('win')) return { icon: Monitor, label: "Windows" };
    if (lower.includes('linux') || lower.includes('debian') || lower.includes('ubuntu') || lower.includes('centos') || lower.includes('redhat')) return { icon: Server, label: "Linux" };
    return { icon: Monitor, label: os };
}

export const SystemCard = React.memo(function SystemCard({
    system,
    technicians,
    assignedTechnicianId,
    onAssignTechnician,
    trackableItems,
    onBulkUpdateTrackableItems,
    systemNote,
    onUpdateSystemNote,
    isSystemSelected = false,
    onSystemSelectionChange,
}: SystemCardProps) {

    const filteredItems = TRACKABLE_ITEMS.filter(item => !item.condition || item.condition(system));
    const { icon: OsIcon, label: osLabel } = getOsIcon(system.operatingSystem);
    const isVirtual = system.hardwareType === 'VIRTUAL';
    const isSql = system.serverApplicationType === 'SQL';
    const isExchange = system.serverApplicationType === 'EXCHANGE';

    const [note, setNote] = React.useState(systemNote || "");
    const [isNoteDirty, setIsNoteDirty] = React.useState(false);
    const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = React.useState<string>("OK");

    React.useEffect(() => {
        setNote(systemNote || "");
    }, [systemNote]);

    const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNote(e.target.value);
        setIsNoteDirty(true);
    };

    const handleNoteBlur = () => {
        if (isNoteDirty) {
            onUpdateSystemNote(system.id, note);
            setIsNoteDirty(false);
        }
    };

    const toggleItemSelection = (itemId: string) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId);
        } else {
            newSelection.add(itemId);
        }
        setSelectedItems(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredItems.map(item => item.id)));
        }
    };

    const applyBulkAction = () => {
        const updates: Record<string, string> = {};
        selectedItems.forEach(itemId => {
            updates[itemId] = bulkStatus;
        });
        onBulkUpdateTrackableItems(system.id, updates);
        setSelectedItems(new Set());
    };

    return (
        <>
            <Card
                className={cn(
                    "overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full text-sm border",
                    isSystemSelected && "ring-2 ring-primary shadow-lg border-primary"
                )}
            >
                {/* Header */}
                <div className="p-3 border-b flex items-start justify-start gap-3">
                    {onSystemSelectionChange && (
                        <button
                            type="button"
                            role="checkbox"
                            aria-checked={isSystemSelected}
                            data-state={isSystemSelected ? "checked" : "unchecked"}
                            onClick={() => onSystemSelectionChange(system.id, !isSystemSelected)}
                            className={cn(
                                "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-4 w-4 mt-2 shrink-0"
                            )}
                        >
                            {isSystemSelected && <Check className="h-3 w-3 text-current" />}
                        </button>
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-9 w-9 rounded-md border flex items-center justify-center shrink-0 bg-background/50",
                            isSql ? "text-blue-600 border-blue-200 bg-blue-50/30" :
                                isExchange ? "text-purple-600 border-purple-200 bg-purple-50/30" :
                                    "text-muted-foreground"
                        )}>
                            {isSql ? <Database className="h-5 w-5" /> :
                                isExchange ? <Mail className="h-5 w-5" /> :
                                    <OsIcon className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                            <div className="font-semibold text-xs truncate flex items-center gap-2">
                                {system.hostname}
                                {isSql && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-medium border-blue-200 text-blue-700 bg-blue-50">
                                        SQL
                                    </Badge>
                                )}
                                {isExchange && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 font-medium border-purple-200 text-purple-700 bg-purple-50">
                                        Exchange
                                    </Badge>
                                )}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate font-mono flex items-center gap-1 mt-0.5">
                                <span>{system.ipAddress}</span>
                                <span className="text-slate-300">|</span>
                                <span>{isVirtual ? "Virtuell" : "Physisch"}</span>
                                <span className="text-slate-300">|</span>
                                <span>{osLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-3 space-y-3 flex-1 flex flex-col">
                    {/* Software Badges */}
                    {system.installedSoftware && system.installedSoftware.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-1 min-h-[24px]">
                            {system.installedSoftware.map((name: string, i: number) => {
                                const candidates = getSoftwareIconCandidates(name);
                                return (
                                    <Badge key={i} variant="secondary" className="flex items-center gap-1 text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/50 hover:bg-muted border-transparent">
                                        <span className="relative h-3.5 w-3.5 overflow-hidden rounded-sm bg-white shrink-0">
                                            <Image
                                                src={candidates[0]}
                                                alt={name}
                                                width={14}
                                                height={14}
                                                className="h-full w-full object-contain"
                                                onError={handleIconError}
                                                unoptimized
                                            />
                                        </span>
                                        <span className="">{name}</span>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}

                    {/* Checklist Grid - 2 Columns */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                        {filteredItems.map((item) => {
                            const currentStatus = trackableItems[item.id] || "NotDone";
                            const statusOption = STATUS_OPTIONS.find(opt => opt.value === currentStatus) || STATUS_OPTIONS[4];
                            const ItemIcon = item.icon;
                            const isSelected = selectedItems.has(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "group flex items-center gap-2 h-8 p-1.5 rounded border transition-all cursor-pointer select-none",
                                        statusOption.bg,
                                        statusOption.color,
                                        isSelected && "ring-2 ring-primary/30"
                                    )}
                                    onClick={() => toggleItemSelection(item.id)}
                                >
                                    <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        data-state={isSelected ? "checked" : "unchecked"}
                                        onClick={() => toggleItemSelection(item.id)}
                                        className={cn(
                                            "peer size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-3.5 w-3.5 pointer-events-none",
                                            "border-input dark:bg-input/30",
                                            "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                                            "focus-visible:border-ring focus-visible:ring-ring/50",
                                            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                                        )}
                                    >
                                        {isSelected && <Check className="h-3 w-3 text-current" />}
                                    </button>

                                    <div className="flex items-center gap-2 min-w-0 overflow-hidden text-left w-full">
                                        <ItemIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        <span
                                            className="text-[10px] font-medium select-none flex-1"
                                            title={item.label}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-2 space-y-2">
                        <Input
                            placeholder="Notiz..."
                            className="h-7 text-[10px] md:text-[10px] font-medium bg-muted/20 px-2 focus-visible:ring-1 focus-visible:ring-offset-0"
                            value={note}
                            onChange={handleNoteChange}
                            onBlur={handleNoteBlur}
                        />
                        <Select
                            value={assignedTechnicianId || "unassigned"}
                            onValueChange={(val) => onAssignTechnician(system.id, val === "unassigned" ? "" : val)}
                        >
                            <SelectTrigger className="h-7 text-[10px] md:text-[10px] w-full bg-background border border-input px-2.5">
                                <SelectValue placeholder="Techniker zuweisen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned" className="text-xs">Kein Techniker</SelectItem>
                                {technicians.map((tech) => (
                                    <SelectItem key={tech.id} value={tech.id} className="text-xs">
                                        {tech.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Floating Multiselect Bar */}
            {selectedItems.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-lg shadow-lg backdrop-blur-sm">
                        <Checkbox
                            checked={selectedItems.size === filteredItems.length}
                            onCheckedChange={toggleSelectAll}
                            className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">{selectedItems.size} ausgewählt</span>
                        <div className="h-4 w-px bg-border" />
                        <Select value={bulkStatus} onValueChange={setBulkStatus}>
                            <SelectTrigger className="h-8 text-sm min-w-[140px]">
                                <SelectValue>
                                    {(() => {
                                        const option = STATUS_OPTIONS.find(opt => opt.value === bulkStatus);
                                        return option ? (
                                            <div className="flex items-center gap-2">
                                                <option.icon className={cn("h-3.5 w-3.5", option.color)} />
                                                <span>{option.label}</span>
                                            </div>
                                        ) : null;
                                    })()}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <option.icon className={cn("h-3.5 w-3.5", option.color)} />
                                            <span>{option.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button size="sm" onClick={applyBulkAction} className="h-8 text-sm px-4">
                            Anwenden
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
})
