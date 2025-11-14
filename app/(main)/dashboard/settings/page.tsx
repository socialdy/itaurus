"use client"

import { FormEvent, useState } from "react"

import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type FormState = {
  organizationName: string
  billingEmail: string
  defaultInterval: string
  notes: string
}

type NotificationState = {
  newMaintenance: boolean
  overdueReminder: boolean
  weeklyDigest: boolean
}

export default function SettingsPage() {
  const [formState, setFormState] = useState<FormState>({
    organizationName: "iTaurus GmbH",
    billingEmail: "abrechnung@itaurus.at",
    defaultInterval: "Quartalsweise",
    notes: "",
  })
  const [notifications, setNotifications] = useState<NotificationState>({
    newMaintenance: true,
    overdueReminder: true,
    weeklyDigest: false,
  })
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("saving")
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2500)
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Einstellungen" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-semibold">Arbeitsbereich</h1>
        <p className="text-sm text-muted-foreground">
          Grundlegende Informationen zur Organisation und Benachrichtigungen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="organizationName">Name</Label>
              <Input
                id="organizationName"
                value={formState.organizationName}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    organizationName: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billingEmail">Abrechnung E-Mail</Label>
              <Input
                id="billingEmail"
                type="email"
                value={formState.billingEmail}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    billingEmail: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultInterval">Standardintervall</Label>
              <Input
                id="defaultInterval"
                value={formState.defaultInterval}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    defaultInterval: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Interne Notiz</Label>
              <Textarea
                id="notes"
                rows={4}
                value={formState.notes}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    notes: event.target.value,
                  }))
                }
                placeholder="Optionale Beschreibung für Kolleg:innen"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benachrichtigungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                {
                  id: "newMaintenance",
                  label: "Neue Wartungen",
                  description: "Informiert bei neu geplanten Wartungen.",
                },
                {
                  id: "overdueReminder",
                  label: "Überfällige Arbeiten",
                  description: "Erinnerungen für überfällige Wartungseinträge.",
                },
                {
                  id: "weeklyDigest",
                  label: "Wöchentliche Übersicht",
                  description: "Kompakte Zusammenfassung per E-Mail.",
                },
              ] satisfies Array<{
                id: keyof NotificationState
                label: string
                description: string
              }>
            ).map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{notification.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
                <Switch
                  checked={notifications[notification.id]}
                  onCheckedChange={(checked) =>
                    setNotifications((previous) => ({
                      ...previous,
                      [notification.id]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Speichern..." : "Änderungen sichern"}
          </Button>
          {status === "saved" && (
            <p className="text-sm text-emerald-600">Gespeichert.</p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive">
              Speichern fehlgeschlagen, bitte später erneut versuchen.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

