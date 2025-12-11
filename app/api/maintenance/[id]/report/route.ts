import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFImage } from "pdf-lib";
import { getMaintenanceEntryById } from "@/lib/data/maintenance";
import { getSystemsByCustomerId } from "@/lib/data/system";
import fs from 'fs';
import path from 'path';

type RouteContext = { params: Promise<{ id: string }> };

const CHECK_LABELS: Record<string, string> = {
  'app_updates': 'App Updates',
  'event_log': 'Event Log',
  'exchange_update': 'Exchange Update',
  'final_check': 'Final Check',
  'os_updates': 'OS Updates',
  'reboots': 'Reboots',
  'Dienste': 'Dienste',
  'sql_update': 'SQL Update',
  'system_load': 'System Load',
  'vmware_tools': 'VMware Tools',
  'windowsUpdates': 'Windows Updates',
  'events': 'Events geprüft',
  'backup': 'Backup geprüft',
  'diskSpace': 'Speicherplatz',
  'exchange': 'Exchange Server',
  'sql': 'SQL Server',
  'firewall': 'Firewall',
  'antivirus': 'Antivirus',
  'hardware': 'Hardware',
  'dhcp': 'DHCP',
  'dns': 'DNS',
  'ad': 'Active Directory',
  'hyperv': 'Hyper-V',
  'network': 'Netzwerk',
  'ups': 'USV',
  'raid': 'RAID',
  'services': 'Dienste',
  'other': 'Sonstiges'
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const maint = await getMaintenanceEntryById(id);
    if (!maint) return NextResponse.json({ ok: false, error: 'Maintenance not found' }, { status: 404 });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Load Logo
    let logoImage: PDFImage | undefined;
    try {
      // PDF-Lib does not support SVG directly. Using PNG.
      const logoPath = path.join(process.cwd(), 'public', 'itaurus-logo-black.png');
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        if (logoPath.endsWith('.png')) {
          logoImage = await doc.embedPng(logoBytes);
        } else if (logoPath.endsWith('.jpg') || logoPath.endsWith('.jpeg')) {
          logoImage = await doc.embedJpg(logoBytes);
        }
      }
    } catch (e) {
      console.warn("Could not load logo:", e);
    }

    // A4 Landscape
    const width = 841.89;
    const height = 595.28;
    const margin = 30;

    // Helper to add a new page with header
    const addPageWithHeader = (pageIndex: number) => {
      const page = doc.addPage([width, height]);

      let currentY = height - margin;

      if (pageIndex === 0) {
        // Logo Top Right
        if (logoImage) {
          const maxWidth = 150;
          const maxHeight = 60;
          const scale = Math.min(maxWidth / logoImage.width, maxHeight / logoImage.height);
          const logoDims = logoImage.scale(scale);

          page.drawImage(logoImage, {
            x: width - margin - logoDims.width,
            y: height - margin - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
        }

        // Title
        currentY -= 20; // Add top margin
        page.drawText(`Wartungsbericht`, { x: margin, y: currentY, size: 22, font: fontBold });
        currentY -= 35; // Increased spacing

        const metaFontSize = 9;
        const metaLineHeight = 14; // Increased line height

        // Metadata - Left aligned, vertical stack
        let metaY = currentY;
        page.drawText(`Kunde: ${maint.customer?.name || ''}`, { x: margin, y: metaY, size: metaFontSize, font });
        metaY -= metaLineHeight;
        page.drawText(`Wartung: ${maint.title || ''}`, { x: margin, y: metaY, size: metaFontSize, font });
        metaY -= metaLineHeight;
        page.drawText(`Datum: ${new Date(maint.date).toLocaleDateString('de-AT')}`, { x: margin, y: metaY, size: metaFontSize, font });
        metaY -= metaLineHeight;

        // Additional metadata on separate lines
        const serviceManager = maint.customer?.serviceManager || '-';
        const billingCode = maint.customer?.billingCode || '-';
        const technicians = (Array.isArray(maint.technicianIds) && maint.technicianIds.length)
          ? maint.technicianIds.join(', ')
          : '-';

        page.drawText(`Service Manager: ${serviceManager}`, { x: margin, y: metaY, size: metaFontSize, font });
        metaY -= metaLineHeight;
        page.drawText(`Abrechnungscode: ${billingCode}`, { x: margin, y: metaY, size: metaFontSize, font });
        metaY -= metaLineHeight;
        page.drawText(`Techniker: ${technicians}`, { x: margin, y: metaY, size: metaFontSize, font });

        currentY = metaY - 25; // Increased spacing

        // Notes
        if (maint.notes) {
          const cleanNotes = maint.notes.replace(/\s+/g, ' ').slice(0, 300);
          page.drawText(`Notiz: ${cleanNotes}`, { x: margin, y: currentY, size: metaFontSize, font, color: rgb(0.25, 0.25, 0.25) });
          currentY -= 30; // Increased spacing
        } else {
          currentY -= 10;
        }
      } else {
        // Minimal header for subsequent pages
        page.drawText(`Wartungsbericht - ${maint.customer?.name} (Seite ${pageIndex + 1})`, { x: margin, y: currentY, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
        currentY -= 30;
      }

      return { page, startY: currentY };
    };

    // --- Data Preparation ---
    const allSystems = maint.customerId ? await getSystemsByCustomerId(maint.customerId) : [];
    const systemIds = (maint.systemIds || allSystems.map(s => s.id));

    // Collect all unique check keys
    const allCheckKeys = new Set<string>();
    for (const sysId of systemIds) {
      const items = maint.systemTrackableItems?.[sysId] || {};
      Object.keys(items).forEach(k => allCheckKeys.add(k));
    }
    const checkColumns = Array.from(allCheckKeys).sort();

    // --- Layout Constants ---
    const sysNameColWidth = 180;
    const checkColWidth = 25;
    const rowHeight = 18;

    // --- Render ---
    const res = addPageWithHeader(0);
    let page = res.page;
    const startY = res.startY;
    let currentY = startY;

    // Draw Table Header
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawTableHeader = (p: any, y: number) => {
      // System Name Header
      p.drawText("System", { x: margin, y: y, size: 10, font: fontBold });

      // Check Headers (Rotated)
      let colX = margin + sysNameColWidth;
      for (const check of checkColumns) {
        const label = CHECK_LABELS[check] || check;
        p.drawText(label, {
          x: colX + 10,
          y: y + 5,
          size: 8,
          font: fontBold,
          rotate: { type: 'degrees', angle: 90 }
        });
        colX += checkColWidth;
      }
      return y;
    };

    // Reserve space for headers (approx 100px for rotated text)
    currentY -= 90;
    drawTableHeader(page, currentY);

    // Line below header
    page.drawLine({ start: { x: margin, y: currentY - 5 }, end: { x: width - margin, y: currentY - 5 }, thickness: 1, color: rgb(0, 0, 0) });
    currentY -= 20;

    // Draw Rows
    for (const sysId of systemIds) {
      if (currentY < margin + 20) {
        const res = addPageWithHeader(doc.getPageCount());
        page = res.page;
        currentY = res.startY - 90;
        drawTableHeader(page, currentY);
        page.drawLine({ start: { x: margin, y: currentY - 5 }, end: { x: width - margin, y: currentY - 5 }, thickness: 1, color: rgb(0, 0, 0) });
        currentY -= 20;
      }

      const sys = allSystems.find(s => s.id === sysId);
      const sysName = sys?.hostname || 'Unknown';

      // System Name
      const maxNameChars = 30;
      const displayName = sysName.length > maxNameChars ? sysName.substring(0, maxNameChars) + '...' : sysName;
      page.drawText(displayName, { x: margin, y: currentY, size: 9, font });

      // Check Cells
      let colX = margin + sysNameColWidth;
      const items = maint.systemTrackableItems?.[sysId] || {};

      for (const check of checkColumns) {
        let status = items[check];

        // Logic: Force N/A for Exchange/SQL if not relevant
        const checkLower = check.toLowerCase();
        const isExchangeCheck = checkLower.includes('exchange');
        const isSqlCheck = checkLower.includes('sql');

        if (isExchangeCheck) {
          const isExchangeServer = sys?.serverApplicationType === 'EXCHANGE' || sys?.installedSoftware?.some(s => s.toLowerCase().includes('exchange'));
          if (!isExchangeServer) status = undefined;
        }
        if (isSqlCheck) {
          const isSqlServer = sys?.serverApplicationType === 'SQL' || sys?.installedSoftware?.some(s => s.toLowerCase().includes('sql'));
          if (!isSqlServer) status = undefined;
        }

        const boxSize = 10;
        const boxY = currentY;
        const boxX = colX + 2;

        if (status === 'OK') {
          // Green Box + Vector Check
          page.drawRectangle({ x: boxX, y: boxY, width: boxSize, height: boxSize, color: rgb(0.8, 1, 0.8), borderColor: rgb(0, 0.6, 0), borderWidth: 0.5 });
          page.drawLine({ start: { x: boxX + 2, y: boxY + 5 }, end: { x: boxX + 4, y: boxY + 2 }, thickness: 1, color: rgb(0, 0.4, 0) });
          page.drawLine({ start: { x: boxX + 4, y: boxY + 2 }, end: { x: boxX + 8, y: boxY + 8 }, thickness: 1, color: rgb(0, 0.4, 0) });
        } else if (status === 'Error') {
          // Red Box + Vector X
          page.drawRectangle({ x: boxX, y: boxY, width: boxSize, height: boxSize, color: rgb(1, 0.8, 0.8), borderColor: rgb(0.8, 0, 0), borderWidth: 0.5 });
          page.drawLine({ start: { x: boxX + 2, y: boxY + 2 }, end: { x: boxX + 8, y: boxY + 8 }, thickness: 1, color: rgb(0.8, 0, 0) });
          page.drawLine({ start: { x: boxX + 2, y: boxY + 8 }, end: { x: boxX + 8, y: boxY + 2 }, thickness: 1, color: rgb(0.8, 0, 0) });
        } else if (status === 'InProgress') {
          // Orange Box + Vector Circle
          page.drawRectangle({ x: boxX, y: boxY, width: boxSize, height: boxSize, color: rgb(1, 0.9, 0.7), borderColor: rgb(0.9, 0.5, 0), borderWidth: 0.5 });
          page.drawEllipse({ x: boxX + 5, y: boxY + 5, xScale: 3, yScale: 3, borderColor: rgb(0.9, 0.5, 0), borderWidth: 1, color: undefined });
        } else {
          // N/A or NotDone - Grey Box + Dash
          page.drawRectangle({ x: boxX, y: boxY, width: boxSize, height: boxSize, color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5 });
          page.drawLine({ start: { x: boxX + 3, y: boxY + 5 }, end: { x: boxX + 7, y: boxY + 5 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
        }

        colX += checkColWidth;
      }

      // Horizontal Line for row
      page.drawLine({ start: { x: margin, y: currentY - 4 }, end: { x: width - margin, y: currentY - 4 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });

      currentY -= rowHeight;
    }

    // Legend
    if (currentY > margin + 40) {
      currentY -= 20;
      page.drawText('Legende: [OK] OK   [X] Fehler   [O] In Arbeit   [-] N/A', { x: margin, y: currentY, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    }

    const pdfBytes = await doc.save();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="maintenance-${maint.id}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error generating maintenance PDF:", message, error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}