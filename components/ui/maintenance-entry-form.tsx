import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

interface Customer {
  id: string;
  name: string;
  abbreviation: string; // abbreviation hinzugefügt
}

// Removed MaintenancePlan interface

interface System {
  id: string;
  hostname: string;
  customerId: string;
}

export const maintenanceEntrySchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Kunde muss ausgewählt sein"),
  systemIds: z.array(z.string()).optional(),
  coordinatorId: z.string().min(1, "Wartungskoordinator muss ausgewählt sein"),
  date: z.string().min(1, "Datum und Uhrzeit müssen angegeben werden."),
});

export type MaintenanceEntryFormData = z.infer<typeof maintenanceEntrySchema>;

interface MaintenanceEntryFormProps {
  initialData?: Partial<MaintenanceEntryFormData>;
  onSubmit: (data: MaintenanceEntryFormData) => void;
  onCancel: () => void;
  customers: Customer[];
  systems: System[];
  submitButtonText?: string;
  technicians: string[];
}

function handleSubmitWithId(id: string | undefined, onSubmit: MaintenanceEntryFormProps['onSubmit']) {
  return (data: MaintenanceEntryFormData) => {
    onSubmit({ ...data, id });
  };
}

export function MaintenanceEntryForm({
  initialData,
  onSubmit,
  onCancel,
  customers,
  systems,
  submitButtonText,
  technicians,
}: MaintenanceEntryFormProps) {

  const form = useForm<MaintenanceEntryFormData>({
    resolver: zodResolver(maintenanceEntrySchema),
    defaultValues: {
      id: initialData?.id || undefined,
      customerId: initialData?.customerId || "",
      systemIds: initialData?.systemIds || [],
      coordinatorId: initialData?.coordinatorId || "",
      date: initialData?.date || new Date().toISOString().slice(0, 16),
    },
  });

  const selectedCustomerId = form.watch("customerId");

  const customerOptions: ComboboxOption[] = customers
    .map(customer => ({
      value: customer.id,
      label: customer.abbreviation, // Nur die Abkürzung anzeigen
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Alphabetisch sortieren

  const technicianOptions: ComboboxOption[] = technicians.map(tech => ({
    value: tech,
    label: tech,
  }));

  React.useEffect(() => {
    if (selectedCustomerId) {
      const systemsForCustomer = systems.filter(system => system.customerId === selectedCustomerId);
      form.setValue("systemIds", systemsForCustomer.map(sys => sys.id));
    } else {
      form.setValue("systemIds", []);
    }
  }, [selectedCustomerId, systems, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitWithId(initialData?.id, onSubmit))} className="space-y-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kunde</FormLabel>
              <FormControl>
                <Combobox
                  options={customerOptions}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                  placeholder="Kunden auswählen..."
                  emptyStateMessage="Keine Kunden gefunden."
                  searchPlaceholder="Kunden suchen..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Datum & Uhrzeit</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coordinatorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wartungskoordinator</FormLabel>
              <FormControl>
                <Combobox
                  options={technicianOptions}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                  placeholder="Koordinator auswählen..."
                  emptyStateMessage="Kein Koordinator gefunden."
                  searchPlaceholder="Koordinator suchen..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 mt-3">
          <Button type="submit" className="w-full">{submitButtonText || "Speichern"}</Button>
          <Button type="button" variant="outline" onClick={onCancel} className="w-full">Abbrechen</Button>
        </div>
      </form>
    </Form>
  );
} 