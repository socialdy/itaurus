'use client';

import { useEffect, useState, useCallback } from "react";

// Typdefinitionen für die abgerufenen Einstellungen
interface SettingsItem {
  key: string;
  value: DefinitionItem[] | string[];
}

interface DefinitionItem {
  value: string;
  label?: string;
  iconPath?: string;
}

// Ein benutzerdefinierter Hook zum Laden der Einstellungen
export const useSystemDefinitions = () => {
  const [definitions, setDefinitions] = useState<Record<string, DefinitionItem[] | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SettingsItem[] = await response.json();
      
      const fetchedDefs: Record<string, DefinitionItem[] | string[]> = {};
      data.forEach(item => {
        fetchedDefs[item.key] = item.value;
      });
      setDefinitions(fetchedDefs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
      console.error("Error fetching system definitions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  return { definitions, loading, error, refetch: fetchDefinitions };
};

// Export-Platzhalter für die Definitionen, die über den Hook geladen werden
// Diese werden nicht mehr hartkodiert sein, sondern dynamisch vom Hook bereitgestellt.
// Die einzelnen Listen (technicians, maintenanceIntervals etc.) werden über den 'definitions' Objekt aus dem Hook zugänglich sein.
export const softwareIcons: Record<string, { iconPath: string, label: string }> = {};
export const technicians: string[] = [];
export const maintenanceIntervals: { value: string; label: string; }[] = [];
export const billingCodes: string[] = [];
export const operatingSystems: { value: string; label: string; }[] = [];
export const hardwareTypes: { value: string; label: string; }[] = [];
export const deviceTypes: { value: string; label: string; }[] = [];
export const serverApplicationTypes: { value: string; label: string; }[] = [];
export const maintenanceItemStatusOptions: { value: string; label: string; }[] = [];
export const serviceManagers: string[] = []; // Add placeholder for serviceManagers


// Helper function to map array to enum values for Zod (kann beibehalten werden, wenn noch benötigt)
export const mapToEnum = (arr: ReadonlyArray<{ value: string } | string>): [string, ...string[]] => {
  const values = arr.map(item => typeof item === 'string' ? item : item.value);
  // If the array is empty, return a default single-element array to satisfy Zod's enum type requirement
  // Zod enums require at least one element for valid type inference.
  if (values.length === 0) return ["DUMMY_EMPTY_VALUE"] as [string, ...string[]]; // Use a dummy value that won't be used
  return values as [string, ...string[]];
}; 