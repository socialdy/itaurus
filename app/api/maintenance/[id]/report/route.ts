import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getMaintenanceEntryById } from "@/lib/data/maintenance";
import { getSystemsByCustomerId } from "@/lib/data/system";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const maint = await getMaintenanceEntryById(id);
    if (!maint) return NextResponse.json({ ok: false, error: 'Maintenance not found' }, { status: 404 });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;

    const tocPage = doc.addPage();
    const { width, height } = tocPage.getSize();

    // Header: Logo wird bewusst NICHT mehr gezeichnet (Clean Header ohne Wasserzeichen)
    // Moderner Blockheader
    const headY = height - margin - 20;
    tocPage.drawText(`Wartungsbericht`, { x: margin, y: headY, size: 26, font: fontBold });
    let metaY = headY - 32;
    tocPage.drawText(`Kunde: ${maint.customer?.name || ''}`, { x: margin, y: metaY, size: 13, font });
    metaY -= 16;
    tocPage.drawText(`Wartung: ${maint.title || ''}`, { x: margin, y: metaY, size: 13, font });
    metaY -= 16;
    tocPage.drawText(`Datum: ${new Date(maint.date).toLocaleDateString('de-AT')}`, { x: margin, y: metaY, size: 13, font });
    metaY -= 16;
    tocPage.drawText(`Service Manager: ${maint.customer?.serviceManager || '-'}`, { x: margin, y: metaY, size: 13, font });
    metaY -= 16;
    tocPage.drawText(`Abrechnungscode: ${maint.customer?.billingCode || '-'}`, { x: margin, y: metaY, size: 13, font });
    metaY -= 16;
    if (Array.isArray(maint.technicianIds) && maint.technicianIds.length) {
      tocPage.drawText(`Techniker (gesamt): ${maint.technicianIds.join(', ')}`, { x: margin, y: metaY, size: 13, font });
      metaY -= 16;
    }
    metaY -= 6;

    if (maint.notes) {
      tocPage.drawText(`Notiz: ${maint.notes.replace(/\s+/g, ' ').slice(0, 220)}`, { x: margin, y: metaY, size: 12, font, color: rgb(0.25, 0.25, 0.25) });
      metaY -= 18;
    }
    // Linie unter Meta-Infos
    const metaLineY = metaY - 6;
    tocPage.drawLine({start: {x: margin, y: metaLineY}, end: {x: width - margin, y: metaLineY}, thickness: 1, color: rgb(0.8,0.8,0.8)});

    // Statuslegende weiter nach unten
    const legendYStart = metaLineY - 48;
    const chip = (x: number, y: number, label: string, color: { r: number; g: number; b: number }) => {
      const w = 14, h = 8;
      tocPage.drawRectangle({ x, y: y + 2, width: w, height: h, color: rgb(color.r, color.g, color.b), borderColor: rgb(color.r, color.g, color.b) });
      tocPage.drawText(label, { x: x + w + 6, y, size: 11, font });
    };
    tocPage.drawText('Statuslegende', { x: margin, y: legendYStart + 20, size: 14, font: fontBold });
    chip(margin, legendYStart, 'OK', { r: 0, g: 0.6, b: 0 });
    chip(margin + 120, legendYStart, 'Fehler', { r: 0.85, g: 0.1, b: 0.1 });
    chip(margin + 240, legendYStart, 'In Arbeit', { r: 0.9, g: 0.6, b: 0 });
    chip(margin + 360, legendYStart, 'N/A', { r: 0.5, g: 0.5, b: 0.5 });

    // TOC etwas luftiger
    let y = legendYStart - 36;
    tocPage.drawText('Inhaltsverzeichnis (Systeme):', { x: margin, y, size: 14, font: fontBold });
    y -= 18;

    const allSystems = maint.customerId ? await getSystemsByCustomerId(maint.customerId) : [];
    const systemIds = (maint.systemIds || allSystems.map(s => s.id));

    const tocEntries: { name: string; page: number }[] = [];

    // Per-system pages with status summary chips
    for (const [idx, sysId] of systemIds.entries()) {
      const sys = allSystems.find(s => s.id === sysId);
      const sysName = sys?.hostname || `System ${idx + 1}`;

      const page = doc.addPage();
      const { height: ph } = page.getSize();

      page.drawText(sysName, { x: margin, y: ph - margin - 24, size: 20, font: fontBold });
      page.drawText(`IP: ${sys?.ipAddress || '-'}`, { x: margin, y: ph - margin - 48, size: 12, font });
      page.drawText(`Beschreibung: ${sys?.description || '-'}`, { x: margin, y: ph - margin - 66, size: 12, font });
      const sysTechs = (maint.systemTechnicianAssignments?.[sysId] || []) as string[];
      page.drawText(`Zuständiger Techniker: ${sysTechs.length ? sysTechs.join(', ') : '-'}`, { x: margin, y: ph - margin - 84, size: 12, font });

      const items = maint.systemTrackableItems?.[sysId] || {} as Record<string, string | undefined>;
      const groups: Record<'OK' | 'ERR' | 'IP' | 'NA', string[]> = { OK: [], ERR: [], IP: [], NA: [] };
      for (const [k, v] of Object.entries(items)) {
        if (v === 'OK' || v === 'ERR' || v === 'IP' || v === 'NA') groups[v].push(k);
      }

      // Horizontal chips summary
      const chipRowY = ph - margin - 108;
      const chipDraw = (x: number, label: string, count: number, color: { r: number; g: number; b: number }) => {
        const text = `${label}: ${count}`;
        page.drawRectangle({ x, y: chipRowY - 2, width: 80, height: 14, color: rgb(color.r, color.g, color.b), opacity: 0.15, borderColor: rgb(color.r, color.g, color.b) });
        page.drawText(text, { x: x + 6, y: chipRowY + 1, size: 10, font: fontBold, color: rgb(color.r, color.g, color.b) });
      };
      chipDraw(margin, 'OK', groups.OK.length, { r: 0, g: 0.6, b: 0 });
      chipDraw(margin + 90, 'Fehler', groups.ERR.length, { r: 0.85, g: 0.1, b: 0.1 });
      chipDraw(margin + 180, 'In Arbeit', groups.IP.length, { r: 0.9, g: 0.6, b: 0 });
      chipDraw(margin + 300, 'N/A', groups.NA.length, { r: 0.5, g: 0.5, b: 0.5 });

      // Detailed groups list
      let y2 = ph - margin - 136;
      const drawGroup = (title: string, color: { r: number; g: number; b: number }, keys: string[]) => {
        if (!keys.length) return;
        page.drawText(title, { x: margin, y: y2, size: 14, font: fontBold, color: rgb(color.r, color.g, color.b) });
        y2 -= 16;
        for (const key of keys) {
          page.drawText(`• ${key}`, { x: margin + 12, y: y2, size: 12, font });
          y2 -= 14;
          if (y2 < margin + 40) {
            y2 = ph - margin - 40;
          }
        }
        y2 -= 8;
      };

      drawGroup('OK', { r: 0, g: 0.6, b: 0 }, groups.OK);
      drawGroup('Fehler', { r: 0.85, g: 0.1, b: 0.1 }, groups.ERR);
      drawGroup('In Arbeit', { r: 0.9, g: 0.6, b: 0 }, groups.IP);
      drawGroup('N/A', { r: 0.5, g: 0.5, b: 0.5 }, groups.NA);

      tocEntries.push({ name: sysName, page: doc.getPageCount() });
    }

    for (const entry of tocEntries) {
      if (y < margin + 40) break;
      const label = `${entry.name}  ......  Seite ${entry.page}`;
      tocPage.drawText(label, { x: margin, y, size: 12, font });
      // Unterstreichung für frischen Look
      const textWidth = font.widthOfTextAtSize(label, 12);
      tocPage.drawLine({ start: { x: margin, y: y - 2 }, end: { x: margin + textWidth, y: y - 2 }, thickness: 0.5, color: rgb(0.85,0.85,0.85) });
      y -= 14;
    }

    const pdfBytes = await doc.save();
    // Convert Uint8Array to ArrayBuffer for NextResponse compatibility
    const arrayBuffer = new ArrayBuffer(pdfBytes.length);
    new Uint8Array(arrayBuffer).set(pdfBytes);
    return new NextResponse(arrayBuffer, {
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