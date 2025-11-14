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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { useSystemDefinitions } from "@/lib/system-definitions";

interface Customer {
  id: string;
  name: string;
}

export const maintenancePlanSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Kunde muss ausgewählt sein"),
  name: z.string().min(2, "Name des Wartungsplans muss mindestens 2 Zeichen lang sein"),
  interval: z.string().min(1, "Intervall muss ausgewählt werden."),
});

export type MaintenancePlanFormData = z.infer<typeof maintenancePlanSchema>;

interface MaintenancePlanFormProps {
  initialData?: Partial<MaintenancePlanFormData>;
  onSubmit: (data: MaintenancePlanFormData) => void;
  onCancel: () => void;
  customers: Customer[];
}

export function MaintenancePlanForm({ initialData, onSubmit, onCancel, customers }: MaintenancePlanFormProps) {
  const { definitions, loading, error } = useSystemDefinitions();
  const maintenanceIntervals = (definitions.maintenanceIntervals || []) as { value: string; label: string }[];

  const form = useForm<MaintenancePlanFormData>({
    resolver: zodResolver(maintenancePlanSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      customerId: initialData?.customerId || "",
      name: initialData?.name || "",
      interval: initialData?.interval || "",
    },
  });

  const customerOptions: ComboboxOption[] = customers.map(customer => ({
    value: customer.id,
    label: customer.name,
  }));

  if (loading) {
    return <div>Lade Wartungsintervalle...</div>; // Or a spinner component
  }

  if (error) {
    return <div>Fehler beim Laden der Wartungsintervalle: {error}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  onChange={field.onChange}
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name des Wartungsplans</FormLabel>
              <FormControl>
                <Input placeholder="Monatliche Serverwartung" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervall</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Intervall wählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {maintenanceIntervals.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit">Speichern</Button>
        </div>
      </form>
    </Form>
  );
} 