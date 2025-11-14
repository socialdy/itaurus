# Product Requirements Document (PRD) - iTaurus Wartungsmanagement

## 1. Einleitung & Zielsetzung

*   **Produktname:** iTaurus Wartungsmanagement-System (Arbeitstitel)
*   **Ziel:** Eine Anwendung zur effizienten Planung, Durchführung und Dokumentation von Wartungsarbeiten für Kunden und deren Anlagen/Geräte.
*   **Vision:** Das System soll Technikern und Administratoren ermöglichen, Wartungsintervalle zu verwalten, Wartungseinsätze zu protokollieren und den Status von Prüfpunkten nachvollziehbar zu dokumentieren, um Ausfallzeiten zu minimieren und die Servicequalität zu erhöhen.

## 2. Zielgruppe

*   Servicetechniker im Außendienst
*   Wartungsmanager / Disponenten
*   Administratoren des Systems
*   (Indirekt) Kunden, die von einer lückenlosen Wartungsdokumentation profitieren

## 3. Anforderungen & Features (User Stories)

Basierend auf der Datenbankstruktur können folgende Kernfunktionalitäten abgeleitet werden:

*   **Kundenmanagement:**
    *   Als Admin/Manager möchte ich neue Kunden anlegen, bestehende Kundendaten bearbeiten und Kunden löschen können.
    *   Als Admin/Manager möchte ich eine Liste aller Kunden sehen und nach Kunden suchen können.
    *   Für jeden Kunden sollen Kontaktdaten und Adresse gespeichert werden.

*   **Wartungsplanmanagement:**
    *   Als Admin/Manager möchte ich für jeden Kunden einen oder mehrere Wartungspläne erstellen können.
    *   Als Admin/Manager möchte ich das Wartungsintervall (z.B. monatlich, quartalsweise) für jeden Plan festlegen können.
    *   Als Admin/Manager möchte ich Wartungspläne bearbeiten und löschen können.

*   **Wartungseintragsmanagement:**
    *   Als Techniker möchte ich zu einem Wartungsplan einen neuen Wartungseintrag erstellen können.
    *   Als Techniker möchte ich das Datum der Wartung, den ausführenden Techniker und allgemeine Notizen zum Einsatz erfassen können.
    *   Als Techniker/Manager möchte ich vergangene Wartungseinträge einsehen und bearbeiten können.

*   **Prüfpunktmanagement (Checklisten):**
    *   Als Techniker möchte ich für jeden Wartungseintrag eine Liste von Prüfpunkten abarbeiten können.
    *   Für jeden Prüfpunkt möchte ich dessen Namen/Bezeichnung sehen.
    *   Als Techniker möchte ich den Status jedes Prüfpunkts (z.B. OK, Fehler, In Bearbeitung, Nicht anwendbar) setzen können.
    *   Als Techniker möchte ich optional Notizen zu einzelnen Prüfpunkten hinzufügen können.

*   **Allgemeine Anforderungen:**
    *   Das System soll automatisch Erstellungs- und Aktualisierungszeitstempel für alle relevanten Daten speichern.
    *   Das System soll eine klare Verknüpfung zwischen Kunden, deren Wartungsplänen, den durchgeführten Wartungen und den spezifischen Prüfpunkten herstellen.
    *   Bei Löschung von übergeordneten Elementen (z.B. Kunde) sollen abhängige Elemente (Pläne, Einträge, Checkpunkte) ebenfalls entfernt werden (Cascade Delete).

## 4. Zukünftige Erweiterungen (Optional)

*   Benachrichtigungssystem für fällige Wartungen
*   Benutzerrollen und Berechtigungsmanagement
*   Möglichkeit, Standard-Checklisten-Vorlagen zu definieren
*   Berichtsfunktionen (z.B. Wartungshistorie pro Kunde/Gerät)
*   Mobile App für Techniker
*   Anlagen-/Gerätemanagement (wenn Wartungen nicht nur pro Kunde, sondern pro spezifischem Gerät des Kunden stattfinden)
*   Möglichkeit, Dateien/Fotos zu Wartungseinträgen oder Checkpunkten hochzuladen

## 5. Technische Aspekte (aktueller Stand)

*   **Datenbank:** PostgreSQL (via Docker)
*   **ORM/Datenbank-Toolkit:** Prisma
*   **Backend-Sprache/Framework:** (Noch nicht definiert, aber Prisma Client wird typischerweise mit Node.js/TypeScript verwendet)
*   **Frontend-Sprache/Framework:** (Noch nicht definiert)

## 6. Erfolgskriterien (Beispiele)

*   Reduzierung des administrativen Aufwands für die Wartungsplanung um X %.
*   Verbesserung der Nachvollziehbarkeit von Wartungsarbeiten.
*   Erhöhung der Datenqualität bei der Wartungsdokumentation.

---
**Anmerkungen zum PRD:**

*   **Lebendes Dokument:** Dieses PRD ist ein Startpunkt. Es sollte im Laufe des Projekts regelmäßig überprüft und angepasst werden, wenn neue Erkenntnisse gewonnen oder Anforderungen geändert werden.
*   **Detailtiefe:** Für ein vollständiges PRD würden viele der oben genannten Punkte noch deutlich detaillierter ausformuliert, inklusive Mockups, Akzeptanzkriterien für User Stories etc.
*   **Non-Functional Requirements:** Wichtige Aspekte wie Performance, Sicherheit, Skalierbarkeit, Benutzbarkeit (Usability) müssten ebenfalls noch definiert werden. 