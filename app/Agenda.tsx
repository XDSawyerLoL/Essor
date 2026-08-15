"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AgendaKind = "medication" | "medical" | "sport";
type AgendaRepeat = "once" | "daily" | "weekly";

type AgendaItem = {
  id: string;
  kind: AgendaKind;
  title: string;
  date: string;
  time: string;
  repeat: AgendaRepeat;
  reminderMinutes: number;
  notes: string;
  enabled: boolean;
  createdAt: string;
};

type Draft = Omit<AgendaItem, "id" | "createdAt" | "enabled">;

declare global {
  interface Window {
    __essorAgendaTimers?: Record<string, number>;
  }
}

const STORAGE_KEY = "essor:agenda:v1";
const DAY_MS = 86_400_000;
const WEEK_MS = DAY_MS * 7;
const MAX_TIMER_MS = 2_000_000_000;

const KIND_META: Record<AgendaKind, { icon: string; label: string; short: string; placeholder: string }> = {
  medication: { icon: "💊", label: "Médicament", short: "Prise", placeholder: "Ex. traitement du matin" },
  medical: { icon: "🩺", label: "Rendez-vous médical", short: "Rendez-vous", placeholder: "Ex. médecin, psychologue, CSAPA…" },
  sport: { icon: "🏃", label: "Sport / activité", short: "Sport", placeholder: "Ex. marche, piscine, kiné, salle…" },
};

const REMINDER_OPTIONS = [
  { value: 0, label: "À l’heure prévue" },
  { value: 10, label: "10 min avant" },
  { value: 30, label: "30 min avant" },
  { value: 60, label: "1 h avant" },
  { value: 180, label: "3 h avant" },
  { value: 1440, label: "1 jour avant" },
];

function localDate(date = new Date()) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function defaultDraft(): Draft {
  const date = new Date(Date.now() + 30 * 60_000);
  const minutes = Math.ceil(date.getMinutes() / 5) * 5;
  date.setMinutes(minutes, 0, 0);
  return {
    kind: "medication",
    title: "",
    date: localDate(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
    repeat: "daily",
    reminderMinutes: 0,
    notes: "",
  };
}

function periodFor(repeat: AgendaRepeat) {
  if (repeat === "daily") return DAY_MS;
  if (repeat === "weekly") return WEEK_MS;
  return 0;
}

function baseOccurrence(item: Pick<AgendaItem, "date" | "time">) {
  const value = new Date(`${item.date}T${item.time}:00`);
  return Number.isNaN(value.getTime()) ? null : value.getTime();
}

function nextOccurrence(item: AgendaItem, from = Date.now()) {
  const base = baseOccurrence(item);
  if (base === null) return null;
  const period = periodFor(item.repeat);
  if (!period) return base >= from ? base : null;
  if (base >= from) return base;
  const steps = Math.ceil((from - base) / period);
  return base + Math.max(0, steps) * period;
}

function nextReminderAt(item: AgendaItem, from = Date.now()) {
  const base = baseOccurrence(item);
  if (base === null) return null;
  const offset = item.reminderMinutes * 60_000;
  const period = periodFor(item.repeat);

  if (!period) {
    if (base < from) return null;
    return Math.max(from + 2_000, base - offset);
  }

  let trigger = base - offset;
  if (trigger <= from) {
    const steps = Math.floor((from - trigger) / period) + 1;
    trigger += steps * period;
  }
  return trigger;
}

function displayDate(timestamp: number | null) {
  if (!timestamp) return "Aucune échéance à venir";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function sanitizeItems(value: unknown): AgendaItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Partial<AgendaItem>;
    if (
      typeof item.id !== "string" ||
      !["medication", "medical", "sport"].includes(item.kind ?? "") ||
      typeof item.title !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date ?? "") ||
      !/^\d{2}:\d{2}$/.test(item.time ?? "") ||
      !["once", "daily", "weekly"].includes(item.repeat ?? "")
    ) return [];
    return [{
      id: item.id,
      kind: item.kind as AgendaKind,
      title: item.title.slice(0, 80),
      date: item.date,
      time: item.time,
      repeat: item.repeat as AgendaRepeat,
      reminderMinutes: Math.max(0, Math.min(10080, Number(item.reminderMinutes) || 0)),
      notes: typeof item.notes === "string" ? item.notes.slice(0, 600) : "",
      enabled: item.enabled !== false,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    }];
  });
}

function persist(items: AgendaItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // L'agenda reste utilisable pendant la session même si le stockage est indisponible.
  }
}

function nativeUri(operation: "schedule" | "cancel", item: AgendaItem) {
  const params = new URLSearchParams({ op: operation, id: item.id });
  if (operation === "schedule") {
    const trigger = nextReminderAt(item);
    if (!trigger) return null;
    params.set("at", String(trigger));
    params.set("repeat", String(periodFor(item.repeat)));
    params.set("kind", item.kind);
  }
  return `essor://agenda?${params.toString()}`;
}

function openNativeReminder(operation: "schedule" | "cancel", item: AgendaItem) {
  const uri = nativeUri(operation, item);
  if (!uri) return;
  window.location.assign(uri);
}

function clearWebTimer(id: string) {
  const registry = window.__essorAgendaTimers;
  const timer = registry?.[id];
  if (timer) window.clearTimeout(timer);
  if (registry) delete registry[id];
}

async function showWebNotification(item: AgendaItem) {
  if (!("serviceWorker" in navigator) || !("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(`Rappel ESSOR · ${KIND_META[item.kind].short}`, {
      body: "Ouvre ESSOR pour voir le détail de ton agenda.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `essor-agenda-${item.id}`,
      renotify: true,
      data: { url: "/?agenda=1" },
    });
  } catch {
    // Le rappel reste visible dans l'agenda si le navigateur refuse la notification.
  }
}

function armWebReminder(item: AgendaItem) {
  clearWebTimer(item.id);
  if (!item.enabled) return;
  const trigger = nextReminderAt(item);
  if (!trigger) return;
  const delay = trigger - Date.now();
  if (delay < 0 || delay > MAX_TIMER_MS) return;
  window.__essorAgendaTimers ??= {};
  window.__essorAgendaTimers[item.id] = window.setTimeout(async () => {
    await showWebNotification(item);
    if (item.repeat !== "once") armWebReminder(item);
  }, delay);
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function icsDate(item: AgendaItem) {
  return `${item.date.replaceAll("-", "")}T${item.time.replace(":", "")}00`;
}

function exportCalendar(item: AgendaItem) {
  const reminder = Math.max(0, item.reminderMinutes);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ESSOR//Agenda//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${item.id}@essor-app.fr`,
    `DTSTART:${icsDate(item)}`,
    `SUMMARY:${icsEscape(item.title)}`,
    item.notes ? `DESCRIPTION:${icsEscape(item.notes)}` : "",
    item.repeat === "daily" ? "RRULE:FREQ=DAILY" : item.repeat === "weekly" ? "RRULE:FREQ=WEEKLY" : "",
    "BEGIN:VALARM",
    `TRIGGER:-PT${reminder}M`,
    "ACTION:DISPLAY",
    "DESCRIPTION:Rappel ESSOR",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `essor-agenda-${item.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Agenda({ isAndroidApp, firstName }: { isAndroidApp: boolean; firstName: string }) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [draft, setDraft] = useState<Draft>(() => defaultDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(sanitizeItems(JSON.parse(stored)));
    } catch {
      setItems([]);
    }

    if (!isAndroidApp && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/agenda-sw.js", { scope: "/" }).catch(() => undefined);
    }
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    else setNotificationPermission("unsupported");
  }, [isAndroidApp]);

  useEffect(() => {
    if (isAndroidApp) return;
    items.forEach((item) => armWebReminder(item));
  }, [isAndroidApp, items]);

  const upcoming = useMemo(() => items
    .filter((item) => item.enabled && nextOccurrence(item) !== null)
    .sort((a, b) => (nextOccurrence(a) ?? Number.MAX_SAFE_INTEGER) - (nextOccurrence(b) ?? Number.MAX_SAFE_INTEGER)), [items]);

  const today = localDate();
  const todayCount = upcoming.filter((item) => {
    const next = nextOccurrence(item);
    return next ? localDate(new Date(next)) === today : false;
  }).length;
  const medicationCount = items.filter((item) => item.enabled && item.kind === "medication").length;

  async function requestWebNotifications() {
    if (isAndroidApp) return true;
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return false;
    }
    if (Notification.permission === "granted") return true;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission === "granted";
  }

  function updateItems(next: AgendaItem[]) {
    setItems(next);
    persist(next);
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      setStatus("Donne un nom à ce rappel.");
      return;
    }
    if (!baseOccurrence(draft)) {
      setStatus("Choisis une date et une heure valides.");
      return;
    }

    const existing = editingId ? items.find((item) => item.id === editingId) : undefined;
    const item: AgendaItem = {
      ...draft,
      title: title.slice(0, 80),
      notes: draft.notes.trim().slice(0, 600),
      id: existing?.id ?? crypto.randomUUID(),
      enabled: existing?.enabled ?? true,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const next = existing ? items.map((current) => current.id === item.id ? item : current) : [...items, item];
    updateItems(next);
    setEditingId(null);
    setDraft(defaultDraft());

    if (item.enabled) {
      if (isAndroidApp) {
        setStatus("Rappel enregistré. Android peut te demander l’autorisation « Alarmes et rappels » pour respecter précisément l’horaire.");
        window.setTimeout(() => openNativeReminder("schedule", item), 40);
      } else {
        const allowed = await requestWebNotifications();
        if (allowed) armWebReminder(item);
        setStatus(allowed
          ? "Rappel enregistré. Pour les rappels lorsque le navigateur est complètement fermé, ajoute aussi l’événement à ton calendrier système."
          : "Rappel enregistré dans ESSOR. Les notifications Web ne sont pas autorisées sur cet appareil.");
      }
    } else {
      setStatus("Événement enregistré sans notification.");
    }
  }

  function startEdit(item: AgendaItem) {
    setEditingId(item.id);
    setDraft({
      kind: item.kind,
      title: item.title,
      date: item.date,
      time: item.time,
      repeat: item.repeat,
      reminderMinutes: item.reminderMinutes,
      notes: item.notes,
    });
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(defaultDraft());
    setStatus("");
  }

  function removeItem(item: AgendaItem) {
    if (!window.confirm(`Supprimer « ${item.title} » de ton agenda ?`)) return;
    clearWebTimer(item.id);
    updateItems(items.filter((current) => current.id !== item.id));
    if (isAndroidApp) window.setTimeout(() => openNativeReminder("cancel", item), 40);
    if (editingId === item.id) cancelEdit();
    setStatus("Événement supprimé.");
  }

  function toggleItem(item: AgendaItem) {
    const updated = { ...item, enabled: !item.enabled };
    updateItems(items.map((current) => current.id === item.id ? updated : current));
    if (updated.enabled) {
      if (isAndroidApp) window.setTimeout(() => openNativeReminder("schedule", updated), 40);
      else armWebReminder(updated);
    } else {
      clearWebTimer(updated.id);
      if (isAndroidApp) window.setTimeout(() => openNativeReminder("cancel", updated), 40);
    }
  }

  return (
    <section className="agenda-section" aria-labelledby="agenda-title">
      <div className="agenda-hero">
        <span className="agenda-orb" aria-hidden="true">📅</span>
        <div>
          <p className="section-label">Ton agenda santé & équilibre</p>
          <h2 id="agenda-title">Les choses importantes,<br /><em>au bon moment.</em></h2>
          <p>{firstName}, programme tes prises déjà prescrites, tes rendez-vous médicaux et tes activités sportives. ESSOR rappelle ce que tu saisis ; il ne décide jamais d’un traitement à ta place.</p>
        </div>
      </div>

      <div className="agenda-stats" aria-label="Résumé de l’agenda">
        <article><span aria-hidden="true">☀️</span><strong>{todayCount}</strong><small>à venir aujourd’hui</small></article>
        <article><span aria-hidden="true">💊</span><strong>{medicationCount}</strong><small>rappels de prise actifs</small></article>
        <article><span aria-hidden="true">🗓️</span><strong>{upcoming.length}</strong><small>événements à venir</small></article>
      </div>

      <aside className="agenda-privacy">
        <span aria-hidden="true">🔐</span>
        <div><strong>Les détails restent sur cet appareil.</strong><p>Le nom d’un médicament, tes notes et le motif d’un rendez-vous ne sont pas envoyés au serveur. Sur Android, le système natif reçoit seulement un identifiant, un horaire et le type de rappel.</p></div>
      </aside>

      <div className="agenda-layout">
        <form className="agenda-compose" onSubmit={saveItem}>
          <div className="agenda-compose-head">
            <div><p className="section-label">{editingId ? "Modifier" : "Ajouter"}</p><h3>{editingId ? "Ajuster ce rappel" : "Caler un nouveau repère"}</h3></div>
            <span aria-hidden="true">⏰</span>
          </div>

          <fieldset className="agenda-kinds">
            <legend>Type</legend>
            <div>{(Object.keys(KIND_META) as AgendaKind[]).map((kind) => <button className={draft.kind === kind ? "active" : ""} type="button" key={kind} onClick={() => setDraft((current) => ({ ...current, kind, repeat: kind === "medication" && current.repeat === "once" ? "daily" : kind !== "medication" && current.repeat === "daily" ? "once" : current.repeat }))}><span aria-hidden="true">{KIND_META[kind].icon}</span>{KIND_META[kind].label}</button>)}</div>
          </fieldset>

          <label className="agenda-field"><span>Nom</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} maxLength={80} placeholder={KIND_META[draft.kind].placeholder} /></label>

          <div className="agenda-row">
            <label className="agenda-field"><span>{draft.repeat === "once" ? "Date" : "Première date"}</span><input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
            <label className="agenda-field"><span>Heure</span><input type="time" value={draft.time} onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))} /></label>
          </div>

          <div className="agenda-row">
            <label className="agenda-field"><span>Répétition</span><select value={draft.repeat} onChange={(event) => setDraft((current) => ({ ...current, repeat: event.target.value as AgendaRepeat }))}><option value="once">Une seule fois</option><option value="daily">Tous les jours</option><option value="weekly">Toutes les semaines</option></select></label>
            <label className="agenda-field"><span>Notification</span><select value={draft.reminderMinutes} onChange={(event) => setDraft((current) => ({ ...current, reminderMinutes: Number(event.target.value) }))}>{REMINDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>

          <label className="agenda-field"><span>Note personnelle <small>facultatif</small></span><textarea rows={3} maxLength={600} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Lieu, consigne donnée par ton médecin, affaires à préparer…" /></label>

          <div className="agenda-safety"><span aria-hidden="true">🩺</span><p><strong>Pour un médicament, recopie seulement une consigne déjà donnée par ton médecin ou ton pharmacien.</strong> ESSOR ne calcule pas une dose, ne modifie pas une ordonnance et ne confirme pas qu’une prise est adaptée.</p></div>

          {status && <p className="agenda-status" role="status">{status}</p>}
          <div className="agenda-form-actions">{editingId && <button className="button ghost" type="button" onClick={cancelEdit}>Annuler</button>}<button className="button primary" type="submit">{editingId ? "Enregistrer" : "Ajouter à mon agenda"} <span aria-hidden="true">→</span></button></div>
        </form>

        <div className="agenda-upcoming">
          <div className="agenda-upcoming-head"><div><p className="section-label">À venir</p><h3>{upcoming.length ? "Tes prochains repères" : "Ton agenda est libre"}</h3></div><span aria-hidden="true">🗓️</span></div>

          {!isAndroidApp && <div className="agenda-web-note"><span aria-hidden="true">🔔</span><p><strong>{notificationPermission === "granted" ? "Notifications Web autorisées" : "Notifications Web à autoriser"}</strong> Sur le Web, un navigateur complètement fermé ne garantit pas un rappel local. Le bouton « Calendrier » ajoute aussi l’événement au calendrier de l’appareil.</p></div>}
          {isAndroidApp && <div className="agenda-web-note android"><span aria-hidden="true">📱</span><p><strong>Rappels Android natifs</strong> À la première programmation, Android peut ouvrir « Alarmes et rappels ». L’autoriser permet de respecter précisément les horaires même quand ESSOR est fermé.</p></div>}

          {upcoming.length ? <div className="agenda-list">{upcoming.map((item) => {
            const meta = KIND_META[item.kind];
            const next = nextOccurrence(item);
            return <article className={item.enabled ? "agenda-item" : "agenda-item disabled"} key={item.id}>
              <span className="agenda-item-icon" aria-hidden="true">{meta.icon}</span>
              <div className="agenda-item-main"><div><strong>{item.title}</strong><small>{meta.label}</small></div><p><b>{displayDate(next)}</b>{item.repeat !== "once" && <em>{item.repeat === "daily" ? "Chaque jour" : "Chaque semaine"}</em>}</p>{item.notes && <span className="agenda-item-note">{item.notes}</span>}</div>
              <div className="agenda-item-actions"><button type="button" onClick={() => toggleItem(item)}>{item.enabled ? "Pause" : "Activer"}</button><button type="button" onClick={() => startEdit(item)}>Modifier</button><button type="button" onClick={() => exportCalendar(item)}>Calendrier</button><button className="danger" type="button" onClick={() => removeItem(item)}>Supprimer</button></div>
            </article>;
          })}</div> : <div className="agenda-empty"><span aria-hidden="true">🌤️</span><p><strong>Rien à retenir de tête.</strong> Ajoute une prise, un rendez-vous ou une activité et ESSOR gardera le repère pour toi.</p></div>}
        </div>
      </div>
    </section>
  );
}
