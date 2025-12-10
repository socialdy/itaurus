"use client"

import * as React from "react"
import { Check, X, AlertTriangle, Ban, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface MultiSystemBulkUpdateBarProps {
    selectedCount: number
    allSystemsCount: number
    allSelected: boolean
    technicians: Array<{ id: string; name: string }>
    onToggleSelectAll: () => void
    onBulkUpdate: (status: string) => void
    onBulkAssignTechnician: (technicianId: string) => void
    onClearSelection: () => void
}

const STATUS_OPTIONS = [
    { value: "OK", label: "OK", icon: Check, color: "text-emerald-700" },
    { value: "Error", label: "Fehler", icon: X, color: "text-red-700" },
    { value: "InProgress", label: "In Arbeit", icon: AlertTriangle, color: "text-amber-700" },
    { value: "NotApplicable", label: "N/A", icon: Ban, color: "text-slate-500" },
    { value: "NotDone", label: "Offen", icon: Minus, color: "text-slate-600" },
]

export function MultiSystemBulkUpdateBar({
    selectedCount,
    allSystemsCount,
    allSelected,
    technicians,
    onToggleSelectAll,
    onBulkUpdate,
    onBulkAssignTechnician,
    onClearSelection,
}: MultiSystemBulkUpdateBarProps) {
    const [selectedStatus, setSelectedStatus] = React.useState<string>("OK")
    const [selectedTechnician, setSelectedTechnician] = React.useState<string>("")

    if (selectedCount === 0) return null

    const handleApply = () => {
        onBulkUpdate(selectedStatus)
    }

    const handleAssignTechnician = () => {
        if (selectedTechnician) {
            onBulkAssignTechnician(selectedTechnician)
            setSelectedTechnician("")
        }
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 px-5 py-3 bg-background border-2 border-primary/20 rounded-xl shadow-2xl backdrop-blur-sm">
                {/* Select All Checkbox */}
                <Checkbox
                    checked={allSelected}
                    onCheckedChange={onToggleSelectAll}
                    className="h-4 w-4"
                />

                {/* Count Display */}
                <span className="text-sm font-semibold text-primary">
                    {selectedCount} {selectedCount === 1 ? "System" : "Systeme"} ausgewählt
                </span>

                <div className="h-5 w-px bg-border" />

                {/* Status Selector */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-9 text-sm min-w-[140px] bg-background">
                        <SelectValue>
                            {(() => {
                                const option = STATUS_OPTIONS.find(opt => opt.value === selectedStatus)
                                return option ? (
                                    <div className="flex items-center gap-2">
                                        <option.icon className={cn("h-3.5 w-3.5", option.color)} />
                                        <span>{option.label}</span>
                                    </div>
                                ) : null
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

                {/* Apply Button */}
                <Button
                    size="sm"
                    onClick={handleApply}
                    className="h-9 text-sm px-4"
                >
                    Alle Felder setzen
                </Button>

                <div className="h-5 w-px bg-border" />

                {/* Technician Selector */}
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger className="h-9 text-sm min-w-[160px] bg-background">
                        <SelectValue placeholder="Techniker zuweisen..." />
                    </SelectTrigger>
                    <SelectContent>
                        {technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id} className="text-sm">
                                {tech.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    size="sm"
                    onClick={handleAssignTechnician}
                    disabled={!selectedTechnician}
                    className="h-9 text-sm px-4"
                >
                    Zuweisen
                </Button>

                <div className="h-5 w-px bg-border" />

                {/* Clear Selection Button */}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClearSelection}
                    className="h-9 text-sm px-3 hover:bg-destructive/10 hover:text-destructive"
                >
                    Abbrechen
                </Button>
            </div>
        </div>
    )
}
