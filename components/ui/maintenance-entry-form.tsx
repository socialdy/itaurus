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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  technicianIds: z.array(z.string()).optional(),
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
      technicianIds: initialData?.technicianIds || [],
      date: initialData?.date || new Date().toISOString().slice(0, 16),
    },
  });

  const selectedCustomerId = form.watch("customerId");

  const customerOptions: ComboboxOption[] = customers.map(customer => ({
    value: customer.id,
    label: customer.abbreviation, // Nur die Abkürzung anzeigen
  }));

  const technicianOptions: ComboboxOption[] = technicians.map(tech => ({
    value: tech, 
    label: tech, 
  }));

  const selectedTechnicianIds = form.watch("technicianIds") || [];

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
          name="technicianIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Techniker</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={false}
                      className={cn(
                        "w-full justify-between",
                        !selectedTechnicianIds.length && "text-muted-foreground"
                      )}
                    >
                      {selectedTechnicianIds.length > 0
                        ? selectedTechnicianIds.map(id => technicianOptions.find(opt => opt.value === id)?.label || id).join(", ")
                        : "Techniker auswählen..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Techniker suchen..." />
                    <CommandList>
                      <CommandEmpty>Kein Techniker gefunden.</CommandEmpty>
                      <CommandGroup>
                        {technicianOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              const currentSelected = new Set(field.value || []);
                              if (currentSelected.has(option.value)) {
                                currentSelected.delete(option.value);
                              } else {
                                currentSelected.add(option.value);
                              }
                              field.onChange(Array.from(currentSelected));
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                (field.value || []).includes(option.value) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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