"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const FormSchema = z.object({
  email: z.string().email({
    message: "Ungültige E-Mail-Adresse.",
  }),
});

export function ForgotPasswordForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setIsLoading(true);
      await authClient.forgetPassword({
        email: data.email,
        redirectTo: "/reset-password",
      });
      toast("Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail-Adresse gesendet.");
    } catch (error) {
      toast("Beim Senden des Links zum Zurücksetzen des Passworts ist ein Fehler aufgetreten.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 text-center">
          <CardTitle className="text-xl">Passwort vergessen</CardTitle>
          <CardDescription>
            Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="flex flex-col gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="max.mustermann@itaurus.at" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Link zum Zurücksetzen des Passworts senden"
              )}
            </Button>

            <div className="text-center text-sm">
              Noch kein Konto?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Registrieren
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}