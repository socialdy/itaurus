"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useSystemDefinitions } from "@/lib/system-definitions"

// Temporary empty arrays for Zod schema initialization
export const customerSchema = z.object({
  id: z.string().optional(),
  abbreviation: z.string().min(2, "Kürzel muss mindestens 2 Zeichen lang sein"),
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  category: z.enum(["A", "B", "C"], { required_error: "Kategorie muss ausgewählt werden." }),
  billingCode: z.string().min(1, "Verrechnungscode muss ausgewählt werden."),
  serviceManager: z.string().min(1, "Servicemanager muss ausgewählt werden."),
  contactPersons: z.array(z.object({
    name: z.string().min(1, "Name des Ansprechpartners darf nicht leer sein."),
    email: z.string().email("Bitte gültige E-Mail-Adresse eingeben."),
    phone: z.string().min(5, "Telefonnummer muss mindestens 5 Zeichen lang sein."),
  })).optional().transform(val => val?.filter(cp => cp.name || cp.email || cp.phone)),
  street: z.string().min(2, "Straße muss angegeben werden"),
  zipCode: z.string().min(4, "PLZ muss angegeben werden"),
  city: z.string().min(2, "Ort muss angegeben werden"),
  country: z.string().min(2, "Land muss angegeben werden"),
  businessEmail: z.string().email("Bitte gültige E-Mail-Adresse eingeben").optional(),
  businessPhone: z.string().min(5, "Telefonnummer muss mindestens 5 Zeichen lang sein").optional(),
  sla: z.boolean().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>
  onSubmit: (data: CustomerFormData) => void
  onCancel: () => void
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const { definitions } = useSystemDefinitions();
  const billingCodes = (definitions.billingCodes || []) as string[];
  const serviceManagers = (definitions.serviceManagers || []) as string[];

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      abbreviation: initialData?.abbreviation || "",
      name: initialData?.name || "",
      category: initialData?.category || "A",
      billingCode: initialData?.billingCode || "",
      serviceManager: initialData?.serviceManager || "",
      contactPersons: initialData?.contactPersons || [{ name: "", email: "", phone: "" }],
      street: initialData?.street || "",
      zipCode: initialData?.zipCode || "",
      city: initialData?.city || "",
      country: initialData?.country || "",
      businessEmail: initialData?.businessEmail || "",
      businessPhone: initialData?.businessPhone || "",
      sla: initialData?.sla || false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contactPersons",
  });

  const handleAddContactPerson = () => {
    console.log("Attempting to add contact person.");
    append({ name: "", email: "", phone: "" });
  };

  // Remove blocking loading/error state
  // if (loading) {
  //   return <div>Lade Kundeneinstellungen...</div>; // Or a spinner component
  // }

  // if (error) {
  //   return <div>Fehler beim Laden der Kundeneinstellungen: {error}</div>;
  // }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kürzel</FormLabel>
                  <FormControl>
                    <Input placeholder="Elektro Graf" {...field} className="w-full" />
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
                  <FormLabel>Kundenname</FormLabel>
                  <FormControl>
                    <Input placeholder="Elektro Graf" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Kategorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Kategorie wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingCode"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Verrechnungscode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="AWSE" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billingCodes.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Straße</FormLabel>
                  <FormControl>
                    <Input placeholder="Bergstraße 18" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PLZ</FormLabel>
                    <FormControl>
                      <Input placeholder="5121" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ort</FormLabel>
                    <FormControl>
                      <Input placeholder="Ostermiething" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Land</FormLabel>
                  <FormControl>
                    <Input placeholder="Österreich" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="businessEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firmen E-Mail</FormLabel>
                <FormControl>
                  <Input placeholder="info@elektrograf.at" {...field} className="w-full" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firmen Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="+43 664 1234567" {...field} className="w-full" type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servicemanager</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Servicemanager auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                        {serviceManagers.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sla"
            render={({ field }) => (
              <FormItem className="mt-5 rounded-md border p-4 shadow-sm flex flex-row items-center space-x-3 space-y-0 h-10 w-full">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Service Level Agreement (SLA)</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel className="mb-2">Ansprechpartner</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 p-3 border rounded-md">
              <FormField
                control={form.control}
                name={`contactPersons.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name des Ansprechpartners" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contactPersons.${index}.email`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="E-Mail-Adresse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`contactPersons.${index}.phone`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefonnummer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} className="col-span-full">
                Ansprechpartner entfernen
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddContactPerson()}
            className="w-full"
          >
            Ansprechpartner hinzufügen
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button type="submit">
            {initialData?.id ? "Kunden aktualisieren" : "Kunden anlegen"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 