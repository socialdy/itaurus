"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
 

export function LoginForm() {
  // Remove classic login logic for submit
  const handleMicrosoftLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    authClient.signIn.social({ provider: "microsoft" });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Willkommen zurück</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMicrosoftLogin}>
          <div className="grid gap-6">
          {/* Email/Passwort Felder bleiben sichtbar, aber lösen nur Microsoft SSO aus */}
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" name="email" placeholder="max.mustermann@itaurus.at" required />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Passwort</Label>
                </div>
                <Input id="password" type="password" name="password" required />
                <div className="text-center h-6" />
              </div>
              <Button type="submit" className="w-full">Anmelden</Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Oder</span>
              </div>
            </div>
            {/* Microsoft Button bleibt wie gehabt */}
            <Button type="button" variant="outline" className="w-full" onClick={() => authClient.signIn.social({ provider: "microsoft" })}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
              </svg>
              Mit Microsoft anmelden
            </Button>
          </div>
        </form>
        
      </CardContent>
    </Card>
  );
}