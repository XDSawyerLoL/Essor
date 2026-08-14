"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TrackKey = "tabac" | "alcool" | "cannabis" | "cocaine" | "sucre" | "viande";

type Milestone = {
  hours: number;
  label: string;
  title: string;
  description: string;
  icon: string;
};

type Track = {
  label: string;
  shortLabel: string;
  icon: string;
  accent: string;
  accentSoft: string;
  unit: string;
  units: string;
  startLabel: string;
  formTitle: string;
  formCopy: string;
  safety?: string;
  milestones: Milestone[];
};

type Profile = {
  startDate: string;
  unitsPerDay: number;
  pricePerUnit: number;
  reason: string;
};

type Profiles = Partial<Record<TrackKey, Profile>>;

type CheckInStatus = "steady" | "hard" | "lapse";

type CheckIn = {
  status: CheckInStatus;
  units: number;
  note: string;
  savedAt: string;
};

type CheckIns = Partial<Record<TrackKey, Record<string, CheckIn>>>;

const STORAGE_KEY = "essor:profiles:v2";
const ACTIVE_KEY = "essor:active-track:v2";
const CHECKINS_KEY = "essor:checkins:v2";
const MILESTONES_KEY = "essor:milestones-seen:v2";

const TRACKS: Record<TrackKey, Track> = {
  tabac: {
    label: "Tabac",
    shortLabel: "Tabac",
    icon: "🚭",
    accent: "#ff6f6f",
    accentSoft: "#3b252e",
    unit: "cigarette",
    units: "cigarettes",
    startLabel: "Date d’arrêt",
    formTitle: "Configure ton suivi tabac",
    formCopy: "Renseigne ta consommation avant l’arrêt pour calculer tes économies et suivre chaque étape.",
    safety: "Besoin d’un accompagnement, de substituts ou d’un suivi personnalisé ? Tabac Info Service répond au 39 89, du lundi au samedi de 8 h à 20 h.",
    milestones: [
      { hours: 1 / 3, label: "20 min", title: "Le cœur se calme", description: "Le rythme cardiaque et la tension commencent à redescendre.", icon: "❤️" },
      { hours: 12, label: "12 h", title: "Le sang respire", description: "Le monoxyde de carbone présent dans le sang diminue fortement.", icon: "🫁" },
      { hours: 48, label: "48 h", title: "Les sens se réveillent", description: "La nicotine est éliminée et le goût comme l’odorat commencent à revenir.", icon: "👃" },
      { hours: 72, label: "72 h", title: "Respirer plus librement", description: "La respiration peut devenir plus facile à mesure que les bronches se relâchent.", icon: "🌬️" },
      { hours: 24 * 14, label: "2 sem.", title: "La circulation repart", description: "La circulation sanguine peut déjà s’améliorer sensiblement.", icon: "🩸" },
      { hours: 24 * 30, label: "1 mois", title: "Le souffle s’allège", description: "La toux et l’essoufflement peuvent commencer à diminuer.", icon: "🎈" },
      { hours: 24 * 90, label: "3 mois", title: "Les poumons progressent", description: "Le souffle et la fonction pulmonaire peuvent continuer à s’améliorer.", icon: "🏃" },
      { hours: 24 * 270, label: "9 mois", title: "Le nettoyage naturel revient", description: "Les cils pulmonaires se rétablissent progressivement et la fatigue peut diminuer.", icon: "⚡" },
      { hours: 24 * 365, label: "1 an", title: "Le cœur est mieux protégé", description: "Le risque de maladie coronarienne est nettement réduit par rapport à celui d’un fumeur.", icon: "🏆" },
      { hours: 24 * 365 * 5, label: "5 ans", title: "Le risque d’AVC recule", description: "Le risque cardiovasculaire continue de diminuer avec le temps sans tabac.", icon: "🧠" },
      { hours: 24 * 365 * 10, label: "10 ans", title: "Un risque majeur diminue", description: "Le risque de cancer du poumon devient bien plus faible qu’en continuant à fumer.", icon: "🎗️" },
      { hours: 24 * 365 * 15, label: "15 ans", title: "Un cap immense", description: "Le risque cardiaque se rapproche de celui d’une personne qui ne fume pas.", icon: "🌳" },
    ],
  },
  alcool: {
    label: "Alcool",
    shortLabel: "Alcool",
    icon: "🍺",
    accent: "#ffc857",
    accentSoft: "#3a3122",
    unit: "verre",
    units: "verres",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi alcool",
    formCopy: "Renseigne ta consommation avant l’arrêt ou la réduction. Le compteur reste un repère, jamais un diagnostic.",
    safety: "Si ta consommation était importante et régulière, un arrêt brutal peut être dangereux. Les symptômes peuvent s’intensifier dans les 24 à 72 heures. Fais le point avec un médecin ou Alcool Info Service au 0 980 980 930 ; en urgence, appelle le 15 ou le 112.",
    milestones: [
      { hours: 24, label: "24 h", title: "Le corps élimine", description: "Le corps élimine l’alcool ; le sommeil peut être perturbé au début.", icon: "🌙" },
      { hours: 72, label: "72 h", title: "Une période sensible", description: "Les symptômes peuvent être plus marqués : reste accompagné et attentif.", icon: "⚠️" },
      { hours: 24 * 7, label: "1 sem.", title: "Le rythme revient", description: "Le sommeil et l’hydratation peuvent s’améliorer progressivement.", icon: "💧" },
      { hours: 24 * 14, label: "2 sem.", title: "Le corps se stabilise", description: "La tension et l’énergie peuvent commencer à se stabiliser.", icon: "🩺" },
      { hours: 24 * 30, label: "1 mois", title: "Le foie récupère", description: "Le foie commence sa récupération lorsque l’arrêt se poursuit.", icon: "🫀" },
      { hours: 24 * 90, label: "3 mois", title: "L’énergie se reconstruit", description: "Sommeil, digestion, peau et énergie peuvent être nettement meilleurs.", icon: "✨" },
      { hours: 24 * 365, label: "1 an", title: "Une année reconquise", description: "Les bénéfices pour le foie et la santé générale continuent de s’accumuler.", icon: "🏆" },
    ],
  },
  cannabis: {
    label: "Cannabis",
    shortLabel: "Cannabis",
    icon: "🌿",
    accent: "#5fd98a",
    accentSoft: "#233a2d",
    unit: "session",
    units: "sessions",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi cannabis",
    formCopy: "Résine, herbe ou mélange avec du tabac : pars de ta consommation réelle, sans jugement.",
    safety: "L’arrêt n’est généralement pas dangereux physiquement, mais irritabilité, anxiété, baisse d’appétit et troubles du sommeil peuvent durer plusieurs semaines. Écoute Cannabis répond au 0 980 980 940.",
    milestones: [
      { hours: 24, label: "24 h", title: "Observer sans juger", description: "Irritabilité, nervosité ou envie de consommer peuvent apparaître.", icon: "😤" },
      { hours: 72, label: "72 h", title: "Traverser l’inconfort", description: "Le sommeil et l’appétit peuvent être particulièrement perturbés.", icon: "🌙" },
      { hours: 24 * 7, label: "1 sem.", title: "Un nouveau rythme", description: "Le sommeil peut commencer à redevenir plus régulier.", icon: "😴" },
      { hours: 24 * 14, label: "2 sem.", title: "L’équilibre revient", description: "L’appétit et l’humeur peuvent commencer à se stabiliser.", icon: "🍽️" },
      { hours: 24 * 30, label: "1 mois", title: "La clarté progresse", description: "La concentration et la motivation peuvent s’améliorer.", icon: "🎯" },
      { hours: 24 * 90, label: "3 mois", title: "De nouveaux repères", description: "Tu connais mieux tes déclencheurs et les réponses qui fonctionnent pour toi.", icon: "🧠" },
      { hours: 24 * 365, label: "1 an", title: "Une stabilité installée", description: "Les bénéfices respiratoires et émotionnels continuent de se consolider.", icon: "🏆" },
    ],
  },
  cocaine: {
    label: "Cocaïne",
    shortLabel: "Cocaïne",
    icon: "❄️",
    accent: "#7ec8e3",
    accentSoft: "#24363f",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt",
    formTitle: "Commencer sans rester seul",
    formCopy: "Le suivi rend le chemin visible, mais l’accompagnement humain reste essentiel.",
    safety: "Le sevrage peut entraîner fatigue intense, humeur dépressive, anxiété et craving pendant plusieurs semaines. Drogues Info Service répond au 0 800 23 13 13. Si tu as des idées suicidaires ou te sens en danger, appelle le 3114, le 15 ou le 112.",
    milestones: [
      { hours: 24, label: "24 h", title: "Se mettre à l’abri", description: "La fatigue et la baisse de moral peuvent être intenses après la dernière prise.", icon: "🌫️" },
      { hours: 72, label: "72 h", title: "Ne pas rester seul", description: "Le sevrage peut apparaître entre deux et quatre jours après l’arrêt.", icon: "⚠️" },
      { hours: 24 * 7, label: "1 sem.", title: "Reprendre un rythme", description: "Sommeil, repas réguliers et activité douce redonnent des repères.", icon: "🌙" },
      { hours: 24 * 30, label: "1 mois", title: "La concentration revient", description: "L’humeur et l’attention peuvent s’améliorer progressivement.", icon: "🧩" },
      { hours: 24 * 90, label: "3 mois", title: "Consolider", description: "Le suivi des déclencheurs reste utile même lorsque les envies s’espacent.", icon: "🧠" },
      { hours: 24 * 365, label: "1 an", title: "Une année reconstruite", description: "Les nouveaux repères émotionnels et sociaux ont eu le temps de s’installer.", icon: "🏆" },
    ],
  },
  sucre: {
    label: "Sucre",
    shortLabel: "Sucre",
    icon: "🍬",
    accent: "#ff6fa5",
    accentSoft: "#3b2533",
    unit: "gourmandise sucrée",
    units: "gourmandises sucrées",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif sucre",
    formCopy: "Ici, tu suis une réduction et tes routines : pas une dépendance physique comparable au tabac ou à l’alcool.",
    safety: "Si les envies reviennent fort, dormir suffisamment et associer protéines et fibres aux repas peut aider à limiter les pics de fringale.",
    milestones: [
      { hours: 24 * 3, label: "3 jours", title: "Observer les envies", description: "Tu commences à repérer les moments où l’envie est la plus forte.", icon: "⚠️" },
      { hours: 24 * 7, label: "1 sem.", title: "Les goûts évoluent", description: "Les aliments naturellement sucrés peuvent reprendre plus de place.", icon: "👅" },
      { hours: 24 * 14, label: "2 sem.", title: "L’énergie s’observe", description: "Tu peux comparer plus clairement faim, fatigue, stress et automatisme.", icon: "⚡" },
      { hours: 24 * 30, label: "1 mois", title: "Une routine existe", description: "Les alternatives choisies ont eu le temps de devenir familières.", icon: "📉" },
      { hours: 24 * 90, label: "3 mois", title: "Une habitude solide", description: "Tu disposes d’un vrai recul sur ce qui fonctionne pour toi.", icon: "🩺" },
      { hours: 24 * 365, label: "1 an", title: "Une année plus choisie", description: "Tes nouvelles habitudes ont traversé toutes les saisons.", icon: "🏆" },
    ],
  },
  viande: {
    label: "Viande",
    shortLabel: "Viande",
    icon: "🥩",
    accent: "#e2795d",
    accentSoft: "#3c2927",
    unit: "portion",
    units: "portions",
    startLabel: "Date de début",
    formTitle: "Configure ta transition alimentaire",
    formCopy: "Un objectif de réduction, pas une addiction : le suivi rend simplement le changement visible.",
    safety: "Si tu réduis fortement, veille à couvrir tes besoins en protéines, fer et vitamine B12. Légumineuses, œufs, poissons ou alternatives enrichies peuvent aider selon ton choix.",
    milestones: [
      { hours: 24 * 3, label: "3 jours", title: "Premiers repas repensés", description: "Tu testes des alternatives et observes ta digestion.", icon: "🌿" },
      { hours: 24 * 7, label: "1 sem.", title: "Une semaine plus végétale", description: "L’apport en fibres augmente souvent quand les végétaux prennent plus de place.", icon: "🥕" },
      { hours: 24 * 14, label: "2 sem.", title: "Trouver l’équilibre", description: "Tu ajustes protéines, fer et variété selon tes besoins.", icon: "🩺" },
      { hours: 24 * 30, label: "1 mois", title: "Un nouveau répertoire", description: "Tu as constitué une base de repas simples et satisfaisants.", icon: "❤️" },
      { hours: 24 * 90, label: "3 mois", title: "Une transition installée", description: "Tes achats et tes repas demandent moins d’effort conscient.", icon: "🦠" },
      { hours: 24 * 365, label: "1 an", title: "Un impact cumulé", description: "Une année de choix alimentaires différents représente un changement concret.", icon: "🌍" },
    ],
  },
};

const TRACK_KEYS = Object.keys(TRACKS) as TrackKey[];

function localDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function elapsed(startDate: string, now = Date.now()) {
  const start = new Date(`${startDate}T00:00:00`);
  const milliseconds = Math.max(0, now - start.getTime());
  const hours = milliseconds / 3_600_000;
  return { hours, days: Math.floor(hours / 24) };
}

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function remainingLabel(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.max(1, Math.round(hours))} h`;
  return `${Math.max(1, Math.round(hours / 24))} j`;
}

function AnimatedValue({ value, kind = "integer" }: { value: number; kind?: "integer" | "money" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - startedAt) / 850);
      setDisplay(value * (1 - Math.pow(1 - ratio, 3)));
      if (ratio < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{kind === "money" ? money(display) : Math.round(display).toLocaleString("fr-FR")}</>;
}

function recentDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  });
}

function shortDay(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(new Date(`${value}T12:00:00`)).replace(".", "");
}

const CHECKIN_LABELS: Record<CheckInStatus, { title: string; short: string; copy: string }> = {
  steady: { title: "Journée gagnée !", short: "J’ai gagné ma journée", copy: "Tu viens d’ajouter une victoire à ton histoire. Savoure-la." },
  hard: { title: "Dur, mais tu es là", short: "C’était difficile", copy: "Tu as traversé la vague et tu as eu l’honnêteté de le noter. Ça compte." },
  lapse: { title: "Tu n’as rien perdu", short: "J’ai glissé", copy: "Un écart n’efface ni tes efforts ni tes victoires. On ajuste et on continue." },
};

const REWARDS = [
  { days: 1, icon: "🐣", title: "Premier envol", copy: "Le départ est derrière toi." },
  { days: 3, icon: "🌤️", title: "Trois soleils", copy: "Trois jours à choisir ton cap." },
  { days: 7, icon: "🔥", title: "Semaine de feu", copy: "Une semaine complète reconquise." },
  { days: 14, icon: "💎", title: "Cœur solide", copy: "Deux semaines, ça brille déjà." },
  { days: 30, icon: "🌳", title: "Arbre fort", copy: "Ton changement prend racine." },
  { days: 90, icon: "🌌", title: "Constellation", copy: "Tu as changé de ciel." },
];

const MOTIVATIONS = [
  "Regarde ce que tu es déjà en train de devenir.",
  "L’envie passe. Ta victoire, elle, reste.",
  "Aujourd’hui n’a pas besoin d’être parfait pour être gagné.",
  "Ton futur vient de gagner une journée de plus.",
  "Ce n’est pas un compteur. C’est la preuve que tu avances.",
];

function growthStage(days: number) {
  if (days >= 90) return { label: "L’arbre rayonne", icon: "🌸" };
  if (days >= 30) return { label: "L’arbre se renforce", icon: "🌳" };
  if (days >= 7) return { label: "Le jeune arbre grandit", icon: "🌲" };
  if (days >= 3) return { label: "La pousse sort de terre", icon: "🌿" };
  return { label: "La graine germe", icon: "🌱" };
}

function Plant({ progress }: { progress: number }) {
  const canopyScale = 0.28 + progress * 0.72;
  return (
    <div className="plant" aria-hidden="true">
      <span className="spark spark-one">✦</span>
      <span className="spark spark-two">✧</span>
      <span className="spark spark-three">•</span>
      <div className="plant-canopy" style={{ transform: `translateX(-50%) scale(${canopyScale})` }}>
        <span className="leaf leaf-one" />
        <span className="leaf leaf-two" />
        <span className="leaf leaf-three" />
        <span className="leaf leaf-four" />
        {progress > 0.28 && <><span className="fruit fruit-one">✦</span><span className="fruit fruit-two">✦</span></>}
      </div>
      <span className="plant-trunk" style={{ height: `${36 + progress * 38}px` }} />
      <span className="plant-ground" />
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<TrackKey>("tabac");
  const [profiles, setProfiles] = useState<Profiles>({});
  const [checkIns, setCheckIns] = useState<CheckIns>({});
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(localDate());
  const [unitsPerDay, setUnitsPerDay] = useState("10");
  const [pricePerUnit, setPricePerUnit] = useState("0.60");
  const [reason, setReason] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [checkInUnits, setCheckInUnits] = useState("1");
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInSaved, setCheckInSaved] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseRunning, setPauseRunning] = useState(false);
  const [pauseSeconds, setPauseSeconds] = useState(180);
  const [celebrating, setCelebrating] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const storedProfiles = window.localStorage.getItem(STORAGE_KEY);
      const storedActive = window.localStorage.getItem(ACTIVE_KEY) as TrackKey | null;
      const storedCheckIns = window.localStorage.getItem(CHECKINS_KEY);
      if (storedProfiles) setProfiles(JSON.parse(storedProfiles));
      if (storedCheckIns) setCheckIns(JSON.parse(storedCheckIns));
      if (storedActive && TRACK_KEYS.includes(storedActive)) setActive(storedActive);
    } catch {
      // The experience remains usable if browser storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!pauseOpen || !pauseRunning || pauseSeconds <= 0) return;
    const timer = window.setInterval(() => setPauseSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [pauseOpen, pauseRunning, pauseSeconds]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pauseOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePause();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pauseOpen]);

  useEffect(() => {
    const todayEntry = checkIns[active]?.[localDate()];
    setCheckInStatus(todayEntry?.status ?? null);
    setCheckInUnits(String(todayEntry?.units || 1));
    setCheckInNote(todayEntry?.note ?? "");
    setCheckInSaved(Boolean(todayEntry));
  }, [active, checkIns]);

  const track = TRACKS[active];
  const profile = profiles[active];
  const progress = profile ? elapsed(profile.startDate, now) : { hours: 0, days: 0 };
  const reached = profile ? track.milestones.filter((item) => progress.hours >= item.hours) : [];
  const next = profile ? track.milestones.find((item) => progress.hours < item.hours) : undefined;
  const plantProgress = Math.min(1, progress.days / 90);
  const activeCheckIns = checkIns[active] ?? {};
  const sevenDays = recentDays(7);
  const stage = growthStage(progress.days);
  const unlockedRewards = REWARDS.filter((reward) => progress.days >= reward.days);
  const nextReward = REWARDS.find((reward) => progress.days < reward.days);
  const checkInCount = Object.keys(activeCheckIns).length;
  const xp = progress.days * 45 + reached.length * 120 + checkInCount * 35;
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = (xp % 500) / 500;
  const motivation = MOTIVATIONS[(active.length * 3 + progress.days) % MOTIVATIONS.length];

  useEffect(() => {
    if (!ready || !profile) return;
    const key = `${MILESTONES_KEY}:${active}`;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) {
        window.localStorage.setItem(key, String(reached.length));
        return;
      }
      const previous = Number(stored) || 0;
      if (reached.length > previous) celebrate();
      if (reached.length !== previous) window.localStorage.setItem(key, String(reached.length));
    } catch {
      // Unlock detection is optional when storage is unavailable.
    }
  }, [active, profile, reached.length, ready]);

  const totals = useMemo(() => {
    if (!profile) return { units: 0, saved: 0 };
    const expectedUnits = (progress.hours / 24) * profile.unitsPerDay;
    const consumedUnits = Object.entries(activeCheckIns)
      .filter(([day]) => day >= profile.startDate && day <= localDate())
      .reduce((sum, [, entry]) => sum + (entry.status === "lapse" ? entry.units : 0), 0);
    const units = Math.max(0, expectedUnits - consumedUnits);
    return { units, saved: units * profile.pricePerUnit };
  }, [profile, progress.hours, activeCheckIns]);

  function persist(nextProfiles: Profiles) {
    setProfiles(nextProfiles);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfiles));
    } catch {
      // State still works for this session.
    }
  }

  function persistCheckIns(nextCheckIns: CheckIns) {
    setCheckIns(nextCheckIns);
    try {
      window.localStorage.setItem(CHECKINS_KEY, JSON.stringify(nextCheckIns));
    } catch {
      // State still works for this session.
    }
  }

  function selectTrack(key: TrackKey) {
    setActive(key);
    setEditing(false);
    setError("");
    try {
      window.localStorage.setItem(ACTIVE_KEY, key);
    } catch {}
  }

  function openEditor() {
    if (profile) {
      setStartDate(profile.startDate);
      setUnitsPerDay(String(profile.unitsPerDay));
      setPricePerUnit(String(profile.pricePerUnit));
      setReason(profile.reason);
    } else {
      setStartDate(localDate());
      setUnitsPerDay(active === "tabac" ? "10" : "1");
      setPricePerUnit(active === "tabac" ? "0.60" : "0");
      setReason("");
    }
    setEditing(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const units = Number(unitsPerDay.replace(",", "."));
    const price = Number(pricePerUnit.replace(",", "."));
    if (!startDate || startDate > localDate()) {
      setError("Choisis une date d’aujourd’hui ou antérieure.");
      return;
    }
    if (!Number.isFinite(units) || units <= 0 || !Number.isFinite(price) || price < 0) {
      setError("Indique une quantité supérieure à 0 et un coût valide (0 est accepté).");
      return;
    }
    persist({ ...profiles, [active]: { startDate, unitsPerDay: units, pricePerUnit: price, reason: reason.trim() } });
    setEditing(false);
    setError("");
    celebrate();
  }

  function removeProfile() {
    if (!window.confirm(`Supprimer le suivi « ${track.label} » sur cet appareil ?`)) return;
    const nextProfiles = { ...profiles };
    delete nextProfiles[active];
    persist(nextProfiles);
    setEditing(false);
  }

  function saveCheckIn() {
    if (!checkInStatus) return;
    const units = checkInStatus === "lapse" ? Number(checkInUnits.replace(",", ".")) : 0;
    if (!Number.isFinite(units) || units < 0) return;
    const today = localDate();
    const nextCheckIns: CheckIns = {
      ...checkIns,
      [active]: {
        ...(checkIns[active] ?? {}),
        [today]: { status: checkInStatus, units, note: checkInNote.trim(), savedAt: new Date().toISOString() },
      },
    };
    persistCheckIns(nextCheckIns);
    setCheckInSaved(true);
    celebrate();
  }

  function celebrate() {
    setCelebrating(false);
    window.requestAnimationFrame(() => setCelebrating(true));
    window.setTimeout(() => setCelebrating(false), 4200);
  }

  function openPause() {
    setPauseSeconds(180);
    setPauseRunning(false);
    setPauseOpen(true);
  }

  function closePause() {
    setPauseOpen(false);
    setPauseRunning(false);
  }

  if (!ready) return <main className="loading">ESSOR prépare ton espace…</main>;

  const showForm = !profile || editing;
  const accentStyle = { "--accent": track.accent, "--accent-soft": track.accentSoft } as React.CSSProperties;

  return (
    <main className="app-shell" style={accentStyle}>
      <div className="aurora aurora-one" aria-hidden="true" />
      <div className="aurora aurora-two" aria-hidden="true" />
      {celebrating && (
        <div className="confetti-layer" aria-hidden="true">
          {Array.from({ length: 30 }, (_, index) => (
            <i
              key={index}
              style={{
                left: `${(index * 37) % 100}%`,
                animationDelay: `${(index % 8) * 0.07}s`,
                background: ["#ff6f91", "#56e0c2", "#ffd166", "#9f7aea"][index % 4],
              }}
            />
          ))}
        </div>
      )}
      <span className="sr-only" aria-live="polite">{celebrating ? "Victoire enregistrée. Bravo, tu avances !" : ""}</span>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="ESSOR, accueil">
          <span className="brand-emoji" aria-hidden="true">🌱</span>
          <span className="brand-name">ESSOR</span>
        </a>
        <a className="help-link" href="#aide">Un coup de pouce <span aria-hidden="true">↓</span></a>
      </header>

      <section className={profile && !editing ? "intro compact" : "intro"} id="top">
        <span className="magic-pill">✨ Chaque petit pas mérite sa lumière</span>
        <h1>L’application qui enlève<br /><em>le mauvais sort.</em></h1>
        <p>Transforme tes efforts en victoires visibles. Ton arbre grandit, tes badges s’allument et ta fierté aussi.</p>
      </section>

      <nav className="track-tabs" aria-label="Choisir un suivi">
        {TRACK_KEYS.map((key) => {
          const item = TRACKS[key];
          return (
            <button
              className={key === active ? "track-tab active" : "track-tab"}
              key={key}
              onClick={() => selectTrack(key)}
              aria-pressed={key === active}
            >
              <span className="track-icon" aria-hidden="true">{item.icon}</span>
              {item.shortLabel}
              {profiles[key] && <span className="saved-dot" aria-label="suivi configuré" />}
            </button>
          );
        })}
      </nav>

      {track.safety && (
        <aside className="safety-note" role="note">
          <span className="safety-icon" aria-hidden="true">🫶</span>
          <p><strong>On avance en sécurité</strong>{track.safety}</p>
        </aside>
      )}

      {showForm ? (
        <section className="setup-card" aria-labelledby="setup-title">
          <div className="setup-heading">
            <span className="setup-mascot" aria-hidden="true">🌱</span>
            <div>
              <p className="section-label">Plante ta première graine</p>
              <h2 id="setup-title">Ton nouveau départ commence ici.</h2>
              <p>{track.formCopy}</p>
            </div>
          </div>

          <form onSubmit={submit} noValidate>
            <label className="field field-wide">
              <span>{track.startLabel}</span>
              <input type="date" value={startDate} max={localDate()} onChange={(event) => setStartDate(event.target.value)} required />
            </label>
            <div className="form-row">
              <label className="field">
                <span>{track.units.charAt(0).toUpperCase() + track.units.slice(1)} par jour avant</span>
                <input inputMode="decimal" value={unitsPerDay} onChange={(event) => setUnitsPerDay(event.target.value)} placeholder="Ex. 10" required />
              </label>
              <label className="field">
                <span>Coût par {track.unit} (€)</span>
                <input inputMode="decimal" value={pricePerUnit} onChange={(event) => setPricePerUnit(event.target.value)} placeholder="0 si inutile" required />
              </label>
            </div>
            <label className="field field-wide">
              <span>Ce que tu veux retrouver <small>facultatif</small></span>
              <input value={reason} maxLength={90} onChange={(event) => setReason(event.target.value)} placeholder="Ex. mon souffle, ma liberté, 200 € par mois…" />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              {profile && <button className="button ghost" type="button" onClick={() => setEditing(false)}>Annuler</button>}
              <button className="button primary" type="submit">{profile ? "Faire grandir mon arbre" : "C’est parti"}<span aria-hidden="true">🚀</span></button>
            </div>
            <p className="privacy-line"><span aria-hidden="true">🔒</span> Ton jardin reste à toi : les données restent dans ce navigateur.</p>
          </form>
        </section>
      ) : (
        <>
          <section className="dashboard-card" aria-labelledby="progress-title">
            <div className="dashboard-head">
              <span className="streak-badge">🔥 {progress.days} {progress.days > 1 ? "jours" : "jour"}</span>
              <span className="level-badge">Niveau {level} · Explorateur</span>
              <button className="small-link" onClick={openEditor} aria-label="Modifier mon suivi">⚙</button>
            </div>
            <div className="hero-progress">
              <div className="garden-halo" aria-hidden="true" />
              <Plant progress={plantProgress} />
              <span className="growth-stage">{stage.icon} {stage.label}</span>
              <div className="day-count"><strong><AnimatedValue value={progress.days} /></strong><span>{progress.days > 1 ? "jours de liberté" : "jour de liberté"}</span></div>
              <h2 id="progress-title">Tu es en train de faire quelque chose de grand.</h2>
              <p className="motivation">{motivation}</p>
              {profile.reason && <blockquote>“{profile.reason}”</blockquote>}

              {next ? (
                <div className="next-step-card">
                  <span>Prochaine étape de récupération</span>
                  <strong>{next.icon} {next.title}</strong>
                  <b>dans {remainingLabel(next.hours - progress.hours)}</b>
                </div>
              ) : (
                <div className="next-step-card complete"><strong>🎉 Toutes les étapes sont débloquées !</strong></div>
              )}

              <div className="xp-panel">
                <div><span>Progression vers le niveau {level + 1}</span><strong>{xp % 500} / 500 XP</strong></div>
                <span className="xp-track"><i style={{ width: `${Math.max(4, levelProgress * 100)}%` }} /></span>
                <p>{nextReward ? <>Plus que <strong>{Math.max(1, nextReward.days - progress.days)} j</strong> avant <b>{nextReward.icon} {nextReward.title}</b></> : <>Toutes les récompenses sont allumées. Quelle aventure !</>}</p>
              </div>
            </div>
            <div className="stat-grid">
              <article className="stat-gold"><span aria-hidden="true">💰</span><div><small>Ton trésor</small><strong><AnimatedValue value={totals.saved} kind="money" /></strong><em>économisés · estimation</em></div></article>
              <article className="stat-mint"><span aria-hidden="true">🪽</span><div><small>Ta liberté</small><strong><AnimatedValue value={totals.units} /></strong><em>{track.units} évitées · estimation</em></div></article>
              <article className="stat-violet"><span aria-hidden="true">🏆</span><div><small>Tes victoires</small><strong>{reached.length}<i>/{track.milestones.length}</i></strong><em>caps santé franchis</em></div></article>
            </div>
          </section>

          <section className="daily-card" aria-labelledby="daily-title">
            <div className="daily-copy">
              <span className="daily-icon" aria-hidden="true">☀️</span>
              <div><p className="section-label">Ta victoire du jour</p>
              <h2 id="daily-title">Comment s’est passée ta journée ?</h2>
              <p>Ici, l’honnêteté rapporte plus que la perfection. Rien ne remet ton histoire à zéro.</p></div>
            </div>
            <div className="checkin-options" role="group" aria-label="Bilan de la journée">
              {(Object.keys(CHECKIN_LABELS) as CheckInStatus[]).map((status) => (
                <button
                  key={status}
                  className={checkInStatus === status ? `checkin-option ${status} selected` : `checkin-option ${status}`}
                  onClick={() => { setCheckInStatus(status); setCheckInSaved(false); }}
                  aria-pressed={checkInStatus === status}
                >
                  <span aria-hidden="true">{status === "steady" ? "🏆" : status === "hard" ? "🌊" : "🤝"}</span>
                  <strong>{CHECKIN_LABELS[status].short}</strong>
                </button>
              ))}
            </div>

            {checkInStatus && (
              <div className={`checkin-detail ${checkInStatus}`}>
                <div>
                  <strong>{CHECKIN_LABELS[checkInStatus].title}</strong>
                  <p>{CHECKIN_LABELS[checkInStatus].copy}</p>
                </div>
                {checkInStatus === "lapse" && (
                  <label>
                    <span>Quantité environ</span>
                    <input inputMode="decimal" value={checkInUnits} onChange={(event) => { setCheckInUnits(event.target.value); setCheckInSaved(false); }} aria-label={`Nombre de ${track.units} consommées aujourd’hui`} />
                  </label>
                )}
                <label className="checkin-note">
                  <span>Une note ? <small>facultatif</small></span>
                  <input value={checkInNote} maxLength={120} onChange={(event) => { setCheckInNote(event.target.value); setCheckInSaved(false); }} placeholder="Ce qui a aidé, déclenché ou changé…" />
                </label>
                <button className={checkInSaved ? "button save-checkin saved" : "button save-checkin"} onClick={saveCheckIn}>
                  {checkInSaved ? "Victoire ajoutée ✨" : "Ajouter à mon histoire"}
                </button>
              </div>
            )}

            <div className="week-row" aria-label="Bilans des sept derniers jours">
              {sevenDays.map((day) => {
                const entry = activeCheckIns[day];
                return (
                  <div className={entry ? `week-day ${entry.status}` : "week-day"} key={day} title={entry ? CHECKIN_LABELS[entry.status].title : "Pas de bilan"}>
                    <span>{shortDay(day)}</span><i>{entry ? (entry.status === "steady" ? "★" : entry.status === "hard" ? "≈" : "♡") : "·"}</i>
                  </div>
                );
              })}
            </div>

            <button className="urge-button" onClick={openPause}>
              <span className="urge-pulse" aria-hidden="true" />
              <span><strong>Une vague arrive ? Tu n’es pas seul.</strong><small>Traverse-la avec une pause guidée de 3 minutes</small></span>
              <b aria-hidden="true">🫧</b>
            </button>
          </section>

          <section className="rewards-section" aria-labelledby="rewards-title">
            <div className="section-heading">
              <div><p className="section-label">Ta collection</p><h2 id="rewards-title">Les trophées dont tu peux être fier</h2></div>
              <span>{unlockedRewards.length}/{REWARDS.length} allumés</span>
            </div>
            <div className="reward-grid">
              {REWARDS.map((reward) => {
                const unlocked = progress.days >= reward.days;
                return (
                  <article className={unlocked ? "reward unlocked" : "reward locked"} key={reward.days}>
                    <span className="reward-icon" aria-hidden="true">{unlocked ? reward.icon : "🔒"}</span>
                    <small>{reward.days} {reward.days > 1 ? "jours" : "jour"}</small>
                    <h3>{reward.title}</h3>
                    <p>{unlocked ? reward.copy : `Encore ${Math.max(1, reward.days - progress.days)} j pour l’allumer.`}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="milestones" aria-labelledby="milestones-title">
            <div className="section-heading">
              <div><p className="section-label">Ton corps te remercie</p><h2 id="milestones-title">Les pouvoirs qui reviennent</h2></div>
              <span>{reached.length} réveillé{reached.length > 1 ? "s" : ""}</span>
            </div>
            <div className="milestone-grid">
              {track.milestones.map((item) => {
                const done = progress.hours >= item.hours;
                return (
                  <article className={done ? "milestone done" : "milestone"} key={item.label}>
                    <span className="milestone-icon">{done ? "✨" : item.icon}</span>
                    <div className="milestone-copy"><p>{item.label}</p><h3>{item.title}</h3><span>{item.description}</span></div>
                    {done && <b>Réveillé !</b>}
                  </article>
                );
              })}
            </div>
            {next ? <p className="next-cap">🎯 Prochain pouvoir : <strong>{next.title}</strong> · {next.label} · dans {remainingLabel(next.hours - progress.hours)}</p> : <p className="next-cap complete">🌟 Tous les pouvoirs affichés sont réveillés. Continue de rayonner.</p>}
          </section>

          <section className="settings-strip">
            <p><strong>Ton aventure a commencé le {dateLabel(profile.startDate)}</strong>Tu peux corriger les informations sans perdre les victoires déjà gagnées.</p>
            <div><button className="button ghost" onClick={openEditor}>Modifier</button><button className="delete-link" onClick={removeProfile}>Supprimer</button></div>
          </section>
        </>
      )}

      <section className="help-preview" id="aide">
        <span className="help-heart" aria-hidden="true">💜</span>
        <span className="section-label">Ton équipe existe</span>
        <h2>Demander de l’aide,<br />c’est une victoire courageuse.</h2>
        <p>Des professionnels répondent anonymement, sans jugement. En urgence médicale : 15 ou 112.</p>
        <div className="help-cards">
          <a href="tel:3989"><span>Tabac Info Service</span><strong>39 89</strong><small>Lun.–sam. · 8 h–20 h</small></a>
          <a href="tel:0980980930"><span>Alcool Info Service</span><strong>0 980 980 930</strong><small>7 j/7 · 8 h–2 h</small></a>
          <a href="tel:0980980940"><span>Écoute Cannabis</span><strong>0 980 980 940</strong><small>7 j/7 · 8 h–2 h</small></a>
          <a href="tel:0800231313"><span>Drogues Info Service</span><strong>0 800 23 13 13</strong><small>7 j/7 · 8 h–2 h</small></a>
          <a href="tel:0800235236"><span>Fil Santé Jeunes</span><strong>0 800 235 236</strong><small>Gratuit et anonyme</small></a>
          <a href="tel:3114"><span>Prévention du suicide</span><strong>31 14</strong><small>Gratuit · 24 h/24 · 7 j/7</small></a>
        </div>
        <a className="csapa-link" href="https://www.drogues-info-service.fr/Adresses-utiles" target="_blank" rel="noreferrer">📍 Trouver un CSAPA gratuit et confidentiel près de chez moi <span aria-hidden="true">↗</span></a>
        <p className="source-links">
          Repères issus de sources publiques officielles :
          <a href="https://www.tabac-info-service.fr/" target="_blank" rel="noreferrer">Tabac Info Service</a>,
          <a href="https://www.alcool-info-service.fr/" target="_blank" rel="noreferrer">Alcool Info Service</a> et
          <a href="https://www.drogues-info-service.fr/" target="_blank" rel="noreferrer">Drogues Info Service</a>.
        </p>
      </section>

      {pauseOpen && (
        <div className="pause-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePause(); }}>
          <section className="pause-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title">
            <button className="pause-close" onClick={closePause} aria-label="Fermer la pause">×</button>
            <p className="section-label">Laisse passer la vague</p>
            <h2 id="pause-title">Tu n’as rien à décider<br />pendant trois minutes.</h2>
            <div className={pauseRunning && pauseSeconds > 0 ? "breath-orb running" : "breath-orb"}>
              <strong>{String(Math.floor(pauseSeconds / 60)).padStart(2, "0")}:{String(pauseSeconds % 60).padStart(2, "0")}</strong>
              <span>{pauseSeconds === 0 ? "Tu as traversé ce moment." : pauseRunning ? "Inspire… expire…" : "Une pause, maintenant."}</span>
            </div>
            <div className="pause-actions-list">
              <span>1</span><p><strong>Change de pièce.</strong> Déplace ton corps pour casser l’automatisme.</p>
              <span>2</span><p><strong>Bois un verre d’eau.</strong> Lentement, sans faire autre chose.</p>
              <span>3</span><p><strong>Préviens quelqu’un.</strong> « C’est difficile là, parle-moi deux minutes. »</p>
            </div>
            {pauseSeconds > 0 ? (
              <button className="button primary pause-main" onClick={() => setPauseRunning((value) => !value)}>
                {pauseRunning ? "Mettre en pause" : pauseSeconds < 180 ? "Reprendre" : "Démarrer les 3 minutes"}<span aria-hidden="true">{pauseRunning ? "Ⅱ" : "→"}</span>
              </button>
            ) : (
              <button className="button primary pause-main" onClick={closePause}>Revenir à mon suivi<span aria-hidden="true">✓</span></button>
            )}
            <p className="pause-help">Si tu te sens en danger : <a href="tel:15">15</a> ou <a href="tel:112">112</a>. Idées suicidaires : <a href="tel:3114">3114</a>.</p>
          </section>
        </div>
      )}

      <footer><span className="brand footer-brand"><span aria-hidden="true">🌱</span><span className="brand-name">ESSOR</span></span><p>Ton progrès est réel. Ta fierté aussi.<br />Un soutien, jamais un jugement.</p></footer>
    </main>
  );
}
