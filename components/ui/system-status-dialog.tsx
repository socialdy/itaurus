"use client"

import { useState } from "react"
import { Check, AlertTriangle, Clock, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export type TrackableStatus = "OK" | "ERR" | "IP" | "NA"

interface SystemStatusDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    systemName: string
    initialStatus: Record<string, TrackableStatus | undefined>
    onSave: (status: Record<string, TrackableStatus | undefined>) => Promise<void>
}

const TRACKABLE_ITEMS = [
    "Windows Updates",
    "Virenscanner",
    "Backup",
    "Ereignisanzeige",
    "Festplattenplatz",
    "Hardware",
]

const STATUS_OPTIONS: { value: TrackableStatus; label: string; icon: React.ReactNode }[] = [
    { value: "OK", label: "OK", icon: <Check className="h-4 w-4 text-emerald-600" /> },
    { value: "ERR", label: "Fehler", icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
    { value: "IP", label: "In Arbeit", icon: <Clock className="h-4 w-4 text-blue-600" /> },
    { value: "NA", label: "N/A", icon: <Ban className="h-4 w-4 text-slate-500" /> },
]

export function SystemStatusDialog({
    open,
    onOpenChange,
    systemName,
    initialStatus,
    onSave,
}: SystemStatusDialogProps) {
    const [status, setStatus] = useState<Record<string, TrackableStatus | undefined>>(initialStatus)
    const [loading, setLoading] = useState(false)

    const handleStatusChange = (item: string, value: TrackableStatus) => {
        setStatus((prev) => ({ ...prev, [item]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await onSave(status)
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to save status", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Status bearbeiten: {systemName}</DialogTitle>
                    <DialogDescription>
                        Setze den Status für die einzelnen Prüfpunkte dieses Systems.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {TRACKABLE_ITEMS.map((item) => (
                        <div key={item} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={item} className="text-right col-span-2">
                                {item}
                            </Label>
                            <Select
                                value={status[item] || "NA"}
                                onValueChange={(value) => handleStatusChange(item, value as TrackableStatus)}
                            >
                                <SelectTrigger className="col-span-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                {option.icon}
                                                <span>{option.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Abbrechen
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Speichern..." : "Speichern"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
