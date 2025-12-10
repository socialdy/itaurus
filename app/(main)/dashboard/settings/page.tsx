"use client"

import { useEffect, useState } from "react"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Plus, Trash2, MoreHorizontal, Pencil } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

type Technician = {
  id: string
  name: string
}

export default function SettingsPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [newTechnicianName, setNewTechnicianName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [technicianToDelete, setTechnicianToDelete] = useState<string | null>(null)
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null)

  // Fetch technicians from API
  const fetchTechnicians = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()

      const techSetting = data.find((item: any) => item.key === 'technicians')
      if (techSetting && Array.isArray(techSetting.value)) {
        setTechnicians(techSetting.value.map((name: string) => ({ id: name, name })))
      }
    } catch (error) {
      console.error('Error fetching technicians:', error)
      toast.error('Fehler beim Laden der Techniker')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const handleAddTechnician = async () => {
    const trimmedName = newTechnicianName.trim()

    if (!trimmedName) {
      toast.error('Bitte geben Sie einen Namen ein')
      return
    }

    if (technicians.some(t => t.name === trimmedName && t.id !== editingTechnician?.id)) {
      toast.error('Dieser Techniker existiert bereits')
      return
    }

    try {
      let updatedTechnicians: string[]

      if (editingTechnician) {
        // Update existing: remove old name, add new name
        updatedTechnicians = technicians
          .map(t => t.id === editingTechnician.id ? trimmedName : t.name)
      } else {
        // Add new
        updatedTechnicians = [...technicians.map(t => t.name), trimmedName]
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'technicians', value: updatedTechnicians }),
      })

      if (!response.ok) throw new Error('Failed to save technician')

      if (editingTechnician) {
        setTechnicians(technicians.map(t => t.id === editingTechnician.id ? { id: trimmedName, name: trimmedName } : t))
        toast.success('Techniker erfolgreich aktualisiert')
      } else {
        setTechnicians([...technicians, { id: trimmedName, name: trimmedName }])
        toast.success('Techniker erfolgreich hinzugefügt')
      }

      setNewTechnicianName("")
      setEditingTechnician(null)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error saving technician:', error)
      toast.error('Fehler beim Speichern des Technikers')
    }
  }

  const openAddDialog = () => {
    setEditingTechnician(null)
    setNewTechnicianName("")
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (technician: Technician) => {
    setEditingTechnician(technician)
    setNewTechnicianName(technician.name)
    setIsAddDialogOpen(true)
  }

  const confirmDeleteTechnician = (technicianId: string) => {
    setTechnicianToDelete(technicianId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteTechnician = async () => {
    if (!technicianToDelete) return

    try {
      const updatedTechnicians = technicians
        .filter(t => t.id !== technicianToDelete)
        .map(t => t.name)

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'technicians', value: updatedTechnicians }),
      })

      if (!response.ok) throw new Error('Failed to delete technician')

      setTechnicians(technicians.filter(t => t.id !== technicianToDelete))
      setDeleteDialogOpen(false)
      setTechnicianToDelete(null)
      toast.success('Techniker erfolgreich gelöscht')
    } catch (error) {
      console.error('Error deleting technician:', error)
      toast.error('Fehler beim Löschen des Technikers')
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Einstellungen" },
        ]}
      />

      <PageHeader
        title="Einstellungen"
        description="Hier können Sie die Techniker verwalten."
      />

      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
            <div>
              <CardTitle>Techniker verwalten</CardTitle>
              <CardDescription>
                Fügen Sie Techniker hinzu oder entfernen Sie diese. Diese werden in den Wartungs-Dropdowns angezeigt.
              </CardDescription>
            </div>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Techniker hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : technicians.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Techniker vorhanden. Fügen Sie den ersten Techniker hinzu.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b-2">
                  <TableHead className="px-2 py-2 sm:px-4">Name</TableHead>
                  <TableHead className="px-2 py-2 sm:px-4 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.map((technician) => (
                  <TableRow key={technician.id}>
                    <TableCell className="px-2 py-2 sm:px-4 font-medium">{technician.name}</TableCell>
                    <TableCell className="px-2 py-2 sm:px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menü öffnen</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(technician)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => confirmDeleteTechnician(technician.id)}
                            className="text-destructive focus:text-destructive"
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
          )}
        </CardContent>
      </Card>

      {/* Add Technician Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle>{editingTechnician ? 'Techniker bearbeiten' : 'Techniker hinzufügen'}</DialogTitle>
            <DialogDescription>
              {editingTechnician ? 'Bearbeiten Sie den Namen des Technikers.' : 'Geben Sie den Namen des neuen Technikers ein.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="technicianName">Name</Label>
              <Input
                id="technicianName"
                value={newTechnicianName}
                onChange={(e) => setNewTechnicianName(e.target.value)}
                placeholder="z.B. AME"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTechnician()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button onClick={handleAddTechnician} className="w-full sm:w-auto">{editingTechnician ? 'Speichern' : 'Hinzufügen'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-lg">
          <DialogHeader>
            <DialogTitle>Techniker löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Techniker <strong>{technicianToDelete}</strong> löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDeleteTechnician} className="w-full sm:w-auto">
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
