"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, CheckCircle2, Clock, AlertCircle, PlusCircle, AlertTriangle, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MaintenanceEntryForm, MaintenanceEntryFormData } from "@/components/ui/maintenance-entry-form"
import { PageHeader } from "@/components/ui/page-header"
import { useSystemDefinitions } from "@/lib/system-definitions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MaintenanceEntry {
  id: string;
  customerId: string;
  title: string;
  date: string; // ISO string
  status: 'OK' | 'Error' | 'InProgress' | 'NotApplicable' | 'Planned' | 'NotDone';
  customer?: { name: string; abbreviation: string };
  coordinatorId?: string | null;
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

  // Load technician filter from localStorage

  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dashboard-technician-filter');
    if (stored) {
      setTechnicianFilter(stored);
    }
    setIsInitialized(true);
  }, []);

  // Save technician filter to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('dashboard-technician-filter', technicianFilter);
    }
  }, [technicianFilter, isInitialized]);

  // Dialog State:
  const [isMaintenanceEntryFormOpen, setIsMaintenanceEntryFormOpen] = useState(false);

  // Daten für Dialog (Dashboard-local, nicht loading im Haupt-Dashboard!)
  const [dialogCustomers, setDialogCustomers] = useState<DialogCustomer[]>([]);
  const [dialogSystems, setDialogSystems] = useState<DialogSystem[]>([]);
  const {
    definitions: systemDefinitions,
    loading: defsLoading,
  } = useSystemDefinitions();
  const technicians = (systemDefinitions.technicians || []) as string[];
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
      const response = await fetch("/api/maintenance?type=entry", {
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
    const matchesMonth = entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    const matchesTechnician = technicianFilter === "all" ? true : entry.coordinatorId === technicianFilter;
    return matchesMonth && matchesTechnician;
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
          className={`h-24 min-h-[6rem] border rounded-xl p-2 overflow-y-auto transition-all ${isToday
            ? 'bg-primary/5 border-primary ring-1 ring-primary/20'
            : 'bg-card hover:bg-muted/30 hover:border-primary/20'
            }`}
        >
          <div className="flex justify-between items-start mb-1.5">
            <span className={`text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{day}</span>
          </div>
          <div className="space-y-1">
            {tasksForDay.map(entry => (
              <div
                key={entry.id}
                onClick={() => openTaskDetails(entry.id)}
                className="cursor-pointer group"
              >
                <Badge
                  variant="outline"
                  className={`
                    w-full justify-start font-normal text-[10px] px-1.5 py-0.5 h-auto truncate border
                    ${entry.status === 'OK' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20' :
                      entry.status === 'Error' ? 'bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20' :
                        entry.status === 'InProgress' ? 'bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20' :
                          entry.status === 'NotApplicable' ? 'bg-slate-500/10 text-slate-700 border-slate-200 hover:bg-slate-500/20' :
                            entry.status === 'Planned' ? 'bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20' :
                              entry.status === 'NotDone' ? 'bg-orange-500/10 text-orange-700 border-orange-200 hover:bg-orange-500/20' :
                                'bg-slate-100 text-slate-800'
                    }
                  `}
                >
                  {entry.title}
                </Badge>
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
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 rounded-md border p-4 min-w-[800px]">
            {weekdays.map(day => (
              <div key={day} className="h-8 flex items-center justify-center font-medium text-sm text-foreground border-b border-border/40 mb-2">
                {day}
              </div>
            ))}
            {days}
          </div>
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
        <Card
          className="hover:shadow-md transition-all duration-200 border-border/60 cursor-pointer hover:border-blue-300"
          onClick={() => router.push('/dashboard/maintenance?filter=planned')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Geplante Wartungen</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-500/10">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-all duration-200 border-border/60 cursor-pointer hover:border-amber-300"
          onClick={() => router.push('/dashboard/maintenance?filter=inprogress')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offene Wartungen</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-all duration-200 border-border/60 cursor-pointer hover:border-orange-300"
          onClick={() => router.push('/dashboard/maintenance?filter=today')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Heute anstehend</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-orange-500/10">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{maintenanceTasksForCalendar.filter(entry => new Date(entry.date).toDateString() === today.toDateString() && entry.status === 'Planned').length}</div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-all duration-200 border-border/60 cursor-pointer hover:border-emerald-300"
          onClick={() => router.push('/dashboard/maintenance?filter=completed')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abgeschlossen</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-all duration-200 border-border/60 cursor-pointer hover:border-red-300"
          onClick={() => router.push('/dashboard/maintenance?filter=overdue')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verpasste Wartungen</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Wartungskalender in voller Breite darunter */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row justify-end items-center pb-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {technicianFilter === "all" ? "Alle Koordinatoren" : technicianFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Nach Koordinator filtern</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTechnicianFilter("all")}>
                Alle Koordinatoren
              </DropdownMenuItem>
              {technicians.map(tech => (
                <DropdownMenuItem key={tech} onClick={() => setTechnicianFilter(tech)}>
                  {tech}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
              technicians={technicians}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
