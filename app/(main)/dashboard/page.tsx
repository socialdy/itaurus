"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, CheckCircle2, Clock, AlertCircle, PlusCircle, AlertTriangle, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MaintenanceEntryForm, MaintenanceEntryFormData } from "@/components/ui/maintenance-entry-form"
import { PageHeader } from "@/components/ui/page-header"
import { useSystemDefinitions } from "@/lib/system-definitions"

interface MaintenanceEntry {
  id: string;
  customerId: string;
  title: string;
  date: string; // ISO string
  status: 'OK' | 'Error' | 'InProgress' | 'NotApplicable' | 'Planned' | 'NotDone';
  customer?: { name: string; abbreviation: string };
}

interface DialogCustomer {
  id: string;
  name: string;
  abbreviation: string;
}

interface DialogSystem {
  id: string;
  hostname: string;
  customerId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [maintenanceEntries, setMaintenanceEntries] = useState<MaintenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Dialog State:
  const [isMaintenanceEntryFormOpen, setIsMaintenanceEntryFormOpen] = useState(false);

  // Daten für Dialog (Dashboard-local, nicht loading im Haupt-Dashboard!)
  const [dialogCustomers, setDialogCustomers] = useState<DialogCustomer[]>([]);
  const [dialogSystems, setDialogSystems] = useState<DialogSystem[]>([]);
  const {
    definitions: systemDefinitions,
    loading: defsLoading,
  } = useSystemDefinitions();
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Fetch Kunden & Systeme, wenn Dialog auf (und bislang leer)
  useEffect(() => {
    if (!isMaintenanceEntryFormOpen) {
      return;
    }
    if (dialogCustomers.length > 0 && dialogSystems.length > 0) {
      return;
    }

    let isSubscribed = true;

    const fetchDialogData = async () => {
      setDialogLoading(true);
      setDialogError(null);
      try {
        const [customersResponse, systemsResponse] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/systems"),
        ]);

        if (!customersResponse.ok || !systemsResponse.ok) {
          throw new Error("Fehler beim Laden der Daten für das Formular.");
        }

        const customersData = (await customersResponse.json()) as DialogCustomer[];
        const systemsData = (await systemsResponse.json()) as DialogSystem[];

        if (!isSubscribed) {
          return;
        }

        setDialogCustomers(customersData);
        setDialogSystems(systemsData);
      } catch (dialogFetchError: unknown) {
        if (!isSubscribed) {
          return;
        }
        const message =
          dialogFetchError instanceof Error
            ? dialogFetchError.message
            : "Unbekannter Fehler beim Laden der Formular-Daten.";
        setDialogError(message);
        toast.error(message);
      } finally {
        if (isSubscribed) {
          setDialogLoading(false);
        }
      }
    };

    fetchDialogData();

    return () => {
      isSubscribed = false;
    };
  }, [isMaintenanceEntryFormOpen, dialogCustomers.length, dialogSystems.length]);

  // Dummy/dynamische Daten (ähnlich wie in MaintenancePage):
  // Hier benötigst du noch die Daten für customers, systems, technicians usw. - hole sie per API/fetch falls noch nicht implementiert oder mocke für den ersten State.

  // Handler
  const handleCreateTask = () => setIsMaintenanceEntryFormOpen(true);
  const handleMaintenanceEntryFormCancel = () => setIsMaintenanceEntryFormOpen(false);

  const fetchMaintenanceEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/maintenance");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: MaintenanceEntry[] = await response.json();
      setMaintenanceEntries(data);
    } catch (fetchError: unknown) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Unbekannter Fehler";
      setError(message);
      toast.error("Fehler beim Laden der Wartungseinträge für das Dashboard.");
      console.error("Error fetching dashboard maintenance entries:", fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceEntries();
  }, [fetchMaintenanceEntries]);

  const handleMaintenanceEntrySubmit = async (data: MaintenanceEntryFormData) => {
    try {
      setDialogLoading(true);
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Wartungseintrag konnte nicht erstellt werden.");
      }

      toast.success("Wartungseintrag erfolgreich angelegt.");
      setIsMaintenanceEntryFormOpen(false);
      await fetchMaintenanceEntries();
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unbekannter Fehler beim Speichern.";
      toast.error(message);
      console.error("Error creating maintenance entry:", submitError);
    } finally {
      setDialogLoading(false);
    }
  };

  // Filter maintenance entries for the current month's calendar view
  const maintenanceTasksForCalendar = maintenanceEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });

  // Calculate statistics for the cards
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

  const upcomingCount = maintenanceEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= today && entry.status === 'Planned';
  }).length;

  const inProgressCount = maintenanceEntries.filter(entry => entry.status === 'InProgress').length;

  const completedCount = maintenanceEntries.filter(entry => entry.status === 'OK').length;

  const overdueCount = maintenanceEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate < today && entry.status !== 'OK' && entry.status !== 'Error' && entry.status !== 'NotApplicable';
  }).length;

  // Kalenderzustand
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Hilfsfunktionen für den Kalender
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const dayOfWeek = new Date(year, month, 1).getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
  };

  const openTaskDetails = (entryId: string) => {
    router.push(`/dashboard/maintenance/${entryId}`);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const monthName = new Date(currentYear, currentMonth).toLocaleString('de-AT', { month: 'long' });

    const days = [];
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-border/40 bg-background/50 rounded-md"></div>);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      // Filter tasks for this day from the fetched data
      const tasksForDay = maintenanceTasksForCalendar.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getDate() === day &&
               entryDate.getMonth() === currentMonth &&
               entryDate.getFullYear() === currentYear;
      });

      const isToday = currentDate.toDateString() === today.toDateString();

      days.push(
        <div
          key={day}
          className={`h-20 min-h-[5rem] border rounded-md p-1 overflow-y-auto transition-colors ${
            isToday
              ? 'bg-blue-50 border-blue-200'
              : 'bg-background/50 border-border/40 hover:bg-muted/50'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
          </div>
          <div className="mt-1 space-y-1">
            {tasksForDay.map(entry => (
              <div
                key={entry.id}
                className={`
                  text-xs truncate rounded px-1.5 py-0.5 cursor-pointer
                  ${
                  entry.status === 'OK' ? 'bg-green-100 text-green-800' :
                  entry.status === 'Error' ? 'bg-red-100 text-red-800' :
                  entry.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                  entry.status === 'NotApplicable' ? 'bg-gray-100 text-gray-800' :
                  entry.status === 'Planned' ? 'bg-purple-100 text-purple-800' :
                  entry.status === 'NotDone' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800' // Default case
                }`}
                onClick={() => openTaskDetails(entry.id)}
              >
                {entry.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{monthName} {currentYear}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="hover:bg-muted/50 transition-colors">
              <ArrowUpDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button variant="outline" onClick={() => {
              setCurrentMonth(new Date().getMonth());
              setCurrentYear(new Date().getFullYear());
            }} className="hover:bg-muted/50 transition-colors">
              Heute
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth} className="hover:bg-muted/50 transition-colors">
              <ArrowUpDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 rounded-md border p-4">
          {weekdays.map(day => (
            <div key={day} className="h-8 flex items-center justify-center font-medium text-sm text-foreground border-b border-border/40 mb-2">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex-1 flex-col space-y-6 overflow-x-hidden p-6">
      <PageHeader 
        title="Dashboard"
        description="Willkommen zurück! Hier sehen Sie eine Übersicht Ihrer Wartungen."
      />
      {/* Statistik-Karten (farbig, größere Icons und Flächen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        <Card className="text-card-foreground flex flex-col gap-4 rounded-xl p-6 overflow-hidden shadow-md bg-gradient-to-br from-blue-50 to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-sm font-semibold">Geplante Wartungen</CardTitle>
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-blue-100">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold text-blue-600">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card className="text-card-foreground flex flex-col gap-4 rounded-xl p-6 overflow-hidden shadow-md bg-gradient-to-br from-yellow-50 to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-sm font-semibold">Offene Wartungen</CardTitle>
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold text-yellow-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card className="text-card-foreground flex flex-col gap-4 rounded-xl p-6 overflow-hidden shadow-md bg-gradient-to-br from-orange-50 to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-sm font-semibold">Heute anstehend</CardTitle>
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-orange-100">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold text-orange-600">{maintenanceTasksForCalendar.filter(entry => new Date(entry.date).toDateString() === today.toDateString() && entry.status === 'Planned').length}</div>
          </CardContent>
        </Card>
        <Card className="text-card-foreground flex flex-col gap-4 rounded-xl p-6 overflow-hidden shadow-md bg-gradient-to-br from-emerald-50 to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-sm font-semibold">Abgeschlossen</CardTitle>
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold text-emerald-600">{completedCount}</div>
          </CardContent>
        </Card>
        <Card className="text-card-foreground flex flex-col gap-4 rounded-xl p-6 overflow-hidden shadow-md bg-gradient-to-br from-red-50 to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <CardTitle className="text-sm font-semibold">Verpasste Wartungen</CardTitle>
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold text-red-600">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>
      {/* Wartungskalender in voller Breite darunter */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row justify-end items-center pb-0">
          <Button size="sm" className="h-8 gap-1" onClick={handleCreateTask}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Neue Wartung anlegen</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            renderCalendar()
          )}
        </CardContent>
      </Card>

      {/* Dialog für neue Wartung */}
      <Dialog open={isMaintenanceEntryFormOpen} onOpenChange={setIsMaintenanceEntryFormOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Neue Wartung anlegen</DialogTitle>
          </DialogHeader>
          {dialogLoading || defsLoading ? (
            <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
          ) : dialogError ? (
            <div className="py-8 text-center text-sm text-red-500">{dialogError}</div>
          ) : (
            <MaintenanceEntryForm
              onSubmit={handleMaintenanceEntrySubmit}
              onCancel={handleMaintenanceEntryFormCancel}
              customers={dialogCustomers}
              systems={dialogSystems}
              submitButtonText="Wartungseintrag anlegen"
              technicians={Array.isArray(systemDefinitions.technicians) ? (systemDefinitions.technicians as string[]) : []}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
