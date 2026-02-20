/**
 * Utilities for exporting key dates to external email and calendar apps.
 */

interface KeyDateExport {
  title: string;
  description?: string | null;
  dueDate: string | Date;
  status?: string;
  priority?: string;
  matter?: { reference?: string; title?: string } | null;
  keyDateOwner?: { firstName?: string; lastName?: string; email?: string } | null;
}

/** Generate ICS file content for a key date (RFC 5545 compliant). */
export function generateICSContent(kd: KeyDateExport): string {
  const due = new Date(kd.dueDate);
  const toDateStr = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

  const dateStr = toDateStr(due);
  const nextDay = new Date(due);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextDayStr = toDateStr(nextDay);

  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

  const summary = [kd.title, kd.matter?.reference ? `[${kd.matter.reference}]` : null]
    .filter(Boolean)
    .join(" ");

  const descParts = [
    kd.description,
    kd.matter?.reference ? `Matter: ${kd.matter.reference}` : null,
    kd.matter?.title ? `Case: ${kd.matter.title}` : null,
    kd.status ? `Status: ${kd.status.replace("_", " ")}` : null,
    kd.keyDateOwner
      ? `Owner: ${kd.keyDateOwner.firstName ?? ""} ${kd.keyDateOwner.lastName ?? ""}`.trim()
      : null,
  ]
    .filter(Boolean)
    .join("\\n");

  const uid = `${kd.title.replace(/\W+/g, "-").toLowerCase()}-${dateStr}@enluka-lexsuite`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Enluka LexSuite//Key Dates//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${nextDayStr}`,
    `SUMMARY:${summary}`,
    descParts ? `DESCRIPTION:${descParts}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Trigger a browser download of an .ics file for the given key date. */
export function downloadICS(kd: KeyDateExport): void {
  const content = generateICSContent(kd);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(kd.title || "key-date").replace(/\s+/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Build a Google Calendar "add event" URL for the given key date. */
export function getGoogleCalendarUrl(kd: KeyDateExport): string {
  const due = new Date(kd.dueDate);
  const toDateStr = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

  const dateStr = toDateStr(due);
  const nextDay = new Date(due);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextDayStr = toDateStr(nextDay);

  const text = [kd.title, kd.matter?.reference ? `[${kd.matter.reference}]` : null]
    .filter(Boolean)
    .join(" ");

  const details = [
    kd.description,
    kd.matter?.reference ? `Matter: ${kd.matter.reference}` : null,
    kd.matter?.title ? `Case: ${kd.matter.title}` : null,
    kd.status ? `Status: ${kd.status.replace("_", " ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates: `${dateStr}/${nextDayStr}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Build a mailto: href for emailing the key date owner. */
export function getMailtoUrl(kd: KeyDateExport): string {
  if (!kd.keyDateOwner?.email) return "#";

  const due = new Date(kd.dueDate);
  const dateFormatted = due.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const subject = `Key Date Reminder: ${kd.title}${kd.matter?.reference ? ` [${kd.matter.reference}]` : ""}`;

  const body = [
    `Dear ${kd.keyDateOwner.firstName ?? "Colleague"},`,
    "",
    `This is a reminder about the following key date:`,
    "",
    `  Title:   ${kd.title}`,
    kd.matter?.reference ? `  Matter:  ${kd.matter.reference} – ${kd.matter.title ?? ""}` : null,
    `  Due:     ${dateFormatted}`,
    kd.status ? `  Status:  ${kd.status.replace("_", " ")}` : null,
    kd.priority ? `  Priority:${kd.priority}` : null,
    kd.description ? `\nNotes:\n${kd.description}` : null,
    "",
    "Please ensure this deadline is actioned promptly.",
    "",
    "Kind regards,",
    "Enluka LexSuite",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return `mailto:${kd.keyDateOwner.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
