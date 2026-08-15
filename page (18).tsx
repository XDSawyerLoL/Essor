"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type TrackKey =
  | "tabac"
  | "alcool"
  | "cannabis"
  | "cocaine"
  | "sucre"
  | "viande"
  | "jeux_argent"
  | "ecrans"
  | "jeux_video"
  | "achats"
  | "sexe"
  | "affective";

type AppView = "today" | "progress" | "journal" | "learn" | "help";
type ProgressView = "garden" | "rewards" | "milestones";
type LearnKey = "cycle" | "craving" | "motivation" | "autopersuasion" | "lapse" | "relations";
type JournalMood = "proud" | "calm" | "hopeful" | "fragile" | "heavy";
type JournalMode = "private" | "circle";

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

type PersonalProfile = {
  firstName: string;
  avatar: string;
};

type SecuritySettings = {
  pinHash: string;
  pinSalt: string;
  discreet: boolean;
  hashVersion?: 1 | 2;
};

type CheckInStatus = "steady" | "hard" | "lapse";

type CheckIn = {
  status: CheckInStatus;
  units: number;
  note: string;
  savedAt: string;
};

type CheckIns = Partial<Record<TrackKey, Record<string, CheckIn>>>;

type SubscriptionPlan = "monthly" | "annual";
type CompanionStep = "menu" | "craving" | "exercise" | "recheck" | "lapse" | "human" | "complete";

type PlayProductDetail = {
  itemId: string;
  price: { currency: string; value: string | number };
};

type PlayPurchase = {
  itemId: string;
  purchaseToken?: string;
  token?: string;
};

type DigitalGoodsService = {
  getDetails: (itemIds: string[]) => Promise<PlayProductDetail[]>;
  listPurchases: () => Promise<PlayPurchase[]>;
};

declare global {
  interface Window {
    getDigitalGoodsService?: (paymentMethod: string) => Promise<DigitalGoodsService>;
  }
}

type LocalSubscription = {
  status: "pending" | "trialing" | "active" | "past_due";
  plan: SubscriptionPlan;
  activatedAt: string;
  provider?: "stripe" | "google_play";
  checkoutSessionId?: string;
  purchaseToken?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | null;
  trialEnd?: number | null;
};

type ShareAchievement = {
  icon: string;
  eyebrow: string;
  title: string;
  detail: string;
  days: number;
};

type LearningModule = {
  icon: string;
  title: string;
  duration: string;
  summary: string;
  principle: string;
  points: Array<{ title: string; copy: string }>;
  exercise: string;
  sources: Array<{ label: string; url: string }>;
};

type JournalEntry = {
  id: string;
  date: string;
  mood: JournalMood;
  text: string;
  intention: string;
  createdAt: string;
  updatedAt: string;
};

type CirclePost = {
  id: string;
  alias: string;
  messageKey: string;
  days: number | null;
  createdAt: number;
  supportCount: number;
  supported: boolean;
  mine: boolean;
};

type EncryptedJournal = {
  version: 2;
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
};

const STORAGE_KEY = "essor:profiles:v2";
const ACTIVE_KEY = "essor:active-track:v2";
const CHECKINS_KEY = "essor:checkins:v2";
const MILESTONES_KEY = "essor:milestones-seen:v2";
const PERSONAL_KEY = "essor:personal-profile:v1";
const SECURITY_KEY = "essor:security:v1";
const SUBSCRIPTION_KEY = "essor:subscription:v1";
const FOUNDER_ACCESS_KEY = "essor:founder-access:v1";
const PROGRAM_KEY = "essor:program-completions:v1";
const COMPANION_KEY = "essor:companion-wins:v1";
const JOURNAL_KEY = "essor:journal:v2";
const LEGACY_JOURNAL_KEY = "essor:journal:v1";
const CIRCLE_MEMBER_KEY = "essor:circle-member:v1";
const PRESENCE_SESSION_KEY = "essor:presence-session:v1";
const PRIVACY_NOTICE_VERSION = "2026-08-14";
const PLAY_BILLING_METHOD = "https://play.google.com/billing";
const ANDROID_PACKAGE_ID = "com.xdsawyer.essor";
const TRIAL_DAYS = 4;
const FOUNDER_ACCESS_HASH = "93a9dc52ea56883ab8d4259432e4df626f2bc40688a04dbdf026baa002a3b569";

const PLAY_PRODUCTS: Record<SubscriptionPlan, string> = {
  monthly: "essor_plus_monthly",
  annual: "essor_plus_annual",
};

const COMPANION_TRIGGERS = ["Stress", "Solitude", "Habitude", "Soirée", "Fatigue", "Autre"];

const JOURNAL_MOODS: Array<{ key: JournalMood; icon: string; label: string }> = [
  { key: "proud", icon: "🌟", label: "Fier·e" },
  { key: "calm", icon: "🌿", label: "Calme" },
  { key: "hopeful", icon: "🌤️", label: "Confiant·e" },
  { key: "fragile", icon: "🌊", label: "Fragile" },
  { key: "heavy", icon: "🌧️", label: "Lourd" },
];

const JOURNAL_PROMPTS = [
  "Qu’est-ce qui a été le plus difficile aujourd’hui, et qu’est-ce qui t’a aidé ?",
  "Quelle petite victoire mériterait d’être reconnue, même si personne ne l’a vue ?",
  "Quel déclencheur as-tu remarqué aujourd’hui ?",
  "De quoi aurais-tu eu besoin au moment où l’envie est montée ?",
  "Si tu te parlais comme à un ami, que te dirais-tu ce soir ?",
];

const CIRCLE_MESSAGES: Record<string, string> = {
  still_here: "Aujourd’hui était difficile, mais je suis encore là.",
  crossed_wave: "J’ai traversé une envie sans lui obéir.",
  restart: "Je recommence sans effacer mes progrès.",
  one_more_day: "Je célèbre une journée de plus.",
  asked_help: "J’ai demandé de l’aide aujourd’hui.",
  not_alone: "À la personne qui lit ceci : tu n’es pas seul·e.",
};

const PLUS_LINKS: Record<SubscriptionPlan, string> = {
  monthly: "https://buy.stripe.com/5kQaEY3j08Nf5RZabCfUQ00",
  annual: "https://buy.stripe.com/7sYdRabPwfbDbcjdnOfUQ01",
};

const PROGRAM_STAGES = [
  { from: 1, to: 7, icon: "🌬️", title: "Reprendre ton souffle", copy: "Installer un rythme simple et traverser les premières vagues." },
  { from: 8, to: 14, icon: "🧭", title: "Comprendre tes déclencheurs", copy: "Repérer les moments, émotions et lieux qui te mettent à l’épreuve." },
  { from: 15, to: 21, icon: "🛠️", title: "Changer les automatismes", copy: "Construire des réponses concrètes qui te ressemblent." },
  { from: 22, to: 30, icon: "👑", title: "Ancrer ta fierté", copy: "Consolider ce qui fonctionne et préparer la suite sans dépendre de la motivation." },
];

const DAILY_MISSIONS = [
  { icon: "💧", title: "Le geste de rupture", copy: "Bois un grand verre d’eau puis change de pièce pendant deux minutes." },
  { icon: "🧠", title: "Nommer la vague", copy: "Écris en une phrase ce qui a déclenché l’envie aujourd’hui, sans te juger." },
  { icon: "🚶", title: "Remettre le corps en mouvement", copy: "Marche cinq minutes, même lentement. L’objectif est seulement de casser l’automatisme." },
  { icon: "🤝", title: "Créer ton filet", copy: "Choisis une personne que tu peux prévenir quand la journée devient difficile." },
  { icon: "✨", title: "Regarder la preuve", copy: "Relis une victoire récente et note ce que tu as fait pour la rendre possible." },
];

const LEARNING_MODULES: Record<LearnKey, LearningModule> = {
  cycle: {
    icon: "🧠",
    title: "Comprendre la boucle",
    duration: "7 min",
    summary: "Une conduite répétée n’est pas un manque de valeur : le cerveau a appris qu’un comportement soulage vite, même s’il coûte plus tard.",
    principle: "Déclencheur → anticipation → action → soulagement immédiat → conséquences différées → apprentissage renforcé.",
    points: [
      { title: "Le déclencheur", copy: "Il peut être extérieur — lieu, personne, argent, écran — ou intérieur : stress, honte, solitude, fatigue, excitation." },
      { title: "La promesse", copy: "Le cerveau anticipe une récompense ou un soulagement. Cette anticipation peut devenir plus puissante que le plaisir réellement obtenu." },
      { title: "La fenêtre de choix", copy: "Changer ne demande pas de supprimer toute envie. Il s’agit d’allonger de quelques minutes l’espace entre le signal et la réponse." },
      { title: "Le nouvel apprentissage", copy: "Chaque fois qu’une autre réponse traverse la vague, le cerveau reçoit une preuve : l’envie peut monter puis redescendre sans imposer l’action." },
    ],
    exercise: "Pendant trois jours, note seulement quatre éléments : le contexte, l’intensité de 0 à 10, l’action choisie et ce qui a changé dix minutes après.",
    sources: [
      { label: "MILDECA · conduites addictives", url: "https://www.drogues.gouv.fr/appel-projets-de-recherche-2026-conduites-addictives-et-drogues-prevention-mecanismes-reperage-et" },
      { label: "MAAD Digital · information scientifique", url: "https://www.drogues.gouv.fr/maad-digital-sest-refait-une-beaute" },
    ],
  },
  craving: {
    icon: "🌊",
    title: "Traverser une envie",
    duration: "6 min",
    summary: "Une envie est une expérience temporaire faite de pensées, de sensations et d’émotions. La combattre de toutes ses forces peut parfois l’amplifier.",
    principle: "Reconnaître, éviter ce qui peut l’être, puis faire face aux déclencheurs inévitables avec une réponse préparée.",
    points: [
      { title: "Nommer", copy: "Dis-toi : « une envie est présente » plutôt que « j’ai besoin de le faire ». Tu décris un événement, pas un ordre." },
      { title: "Localiser", copy: "Observe où elle se manifeste dans le corps : gorge, poitrine, ventre, agitation. L’intensité change souvent d’une minute à l’autre." },
      { title: "Retarder", copy: "Décide seulement pour les dix prochaines minutes. Change de pièce, bois de l’eau, marche ou contacte quelqu’un." },
      { title: "Mesurer après", copy: "Réévalue l’intensité. Même une baisse de 8 à 6 prouve que la vague bouge et que tu n’es pas obligé de lui obéir." },
    ],
    exercise: "Fais trois cycles : 4 secondes d’inspiration, 6 secondes d’expiration, puis donne une note à la vague avant de choisir la prochaine petite action.",
    sources: [
      { label: "NIAAA · reconnaître, éviter, faire face", url: "https://rethinkingdrinking.niaaa.nih.gov/tools/worksheets-more/how-stop-alcohol-cravings" },
    ],
  },
  motivation: {
    icon: "🧭",
    title: "Faire émerger ta motivation",
    duration: "8 min",
    summary: "La motivation n’est pas un interrupteur. L’ambivalence — vouloir changer et vouloir continuer — est une étape normale du changement.",
    principle: "L’entretien motivationnel renforce l’autonomie, l’efficacité personnelle et les propres raisons de changer plutôt que d’imposer un discours.",
    points: [
      { title: "Importance", copy: "Sur 10, à quel point ce changement compte-t-il aujourd’hui ? Pourquoi ta note n’est-elle pas plus basse ?" },
      { title: "Confiance", copy: "Sur 10, à quel point te sens-tu capable d’un petit pas ? Qu’est-ce qui ferait gagner un point ?" },
      { title: "Raisons", copy: "Écris ce que tu veux retrouver, pas seulement ce que tu veux supprimer : sommeil, dignité, argent, présence, liberté." },
      { title: "Choix", copy: "Formule une action que tu choisis toi-même. Une décision modeste mais personnelle est plus utile qu’une promesse imposée." },
    ],
    exercise: "Complète cette phrase cinq fois : « J’aimerais changer parce que… ». Entoure ensuite la raison qui te touche vraiment aujourd’hui.",
    sources: [
      { label: "Haute Autorité de santé · entretien motivationnel", url: "https://www.has-sante.fr/jcms/p_3501842/fr/entretien-motivationnel" },
      { label: "SAMHSA · motivation au changement", url: "https://library.samhsa.gov/product/tip-35-enhancing-motivation-change-substance-use-disorder-treatment/pep19-02-01-003" },
    ],
  },
  autopersuasion: {
    icon: "🗣️",
    title: "L’autopersuasion utile",
    duration: "9 min",
    summary: "Il ne s’agit pas de se mentir ni de réciter des slogans. L’autopersuasion consiste à entendre ses propres arguments de changement et à les relier à une action précise.",
    principle: "Plus tes mots viennent de toi et décrivent une situation réelle, plus ils peuvent devenir une boussole au moment critique.",
    points: [
      { title: "Parler au futur proche", copy: "Remplace « plus jamais » par « ce soir, je protège… ». Le cerveau peut agir sur une scène concrète." },
      { title: "Créer un plan si–alors", copy: "« Si je rentre stressé et que l’envie monte, alors je pose mon téléphone et je marche cinq minutes. » Un signal, une réponse simple." },
      { title: "Produire des preuves", copy: "Chaque soir, note une décision qui correspond à la personne que tu veux devenir. L’identité se construit sur des faits, pas sur des injonctions." },
      { title: "Prévoir l’obstacle", copy: "Imagine le bénéfice recherché, puis l’obstacle le plus probable. Choisis une seule réponse réaliste, sans accumuler dix plans concurrents." },
    ],
    exercise: "Écris ton propre plan : « Si [déclencheur observable], alors je [action de moins de 10 minutes] parce que je veux retrouver [raison personnelle]. »",
    sources: [
      { label: "HAS · renforcer la motivation personnelle", url: "https://www.has-sante.fr/jcms/p_3501842/fr/entretien-motivationnel" },
      { label: "PubMed · plans si–alors et atteinte des objectifs", url: "https://pubmed.ncbi.nlm.nih.gov/25965276/" },
    ],
  },
  lapse: {
    icon: "🤝",
    title: "Un écart n’efface pas le chemin",
    duration: "7 min",
    summary: "La pensée « tout est fichu » transforme facilement un épisode en abandon. Un écart est surtout une information sur une situation à haut risque.",
    principle: "Sécuriser, comprendre sans procès, ajuster une protection, reprendre la prochaine décision utile.",
    points: [
      { title: "Sécuriser", copy: "Éloigne ce qui peut aggraver la situation, ne conduis pas, et contacte quelqu’un si ta sécurité physique ou psychique est menacée." },
      { title: "Décrire", copy: "Que s’est-il passé juste avant ? Évite les jugements globaux comme « je suis nul ». Cherche le contexte modifiable." },
      { title: "Réparer une chose", copy: "Hydratation, sommeil, argent protégé, rendez-vous, message à une personne : choisis la réparation la plus urgente." },
      { title: "Reprendre maintenant", copy: "N’attends pas lundi ou un nouveau mois. La reprise commence avec la prochaine action, même minuscule." },
    ],
    exercise: "Écris une phrase factuelle : « Dans [contexte], j’ai [action]. La prochaine fois, je protégerai [élément] en faisant [réponse]. »",
    sources: [
      { label: "SAMHSA · interventions et thérapies brèves", url: "https://library.samhsa.gov/product/brief-interventions-and-brief-therapies-substance-abuse/sma15-4136" },
    ],
  },
  relations: {
    icon: "🫶",
    title: "Attachement, limites et relations",
    duration: "9 min",
    summary: "« Dépendance affective » est un terme courant, pas un diagnostic automatique. Il peut décrire une peur d’abandon, un besoin intense de validation ou l’effacement de ses limites.",
    principle: "Une relation sécurisante laisse de la place au lien, à l’autonomie, au consentement, aux limites et à la possibilité de dire non sans peur.",
    points: [
      { title: "Distinguer besoin et urgence", copy: "Le besoin de lien est humain. L’urgence pousse à appeler, vérifier, supplier ou céder avant d’avoir évalué ce qui te respecte." },
      { title: "Revenir aux faits", copy: "Sépare ce que tu sais, ce que tu imagines et ce dont tu as besoin. Cette distinction réduit les scénarios automatiques." },
      { title: "Poser une limite", copy: "Une limite décrit ce que tu feras pour te protéger. Elle n’est ni une menace ni une tentative de contrôler l’autre." },
      { title: "Repérer la violence", copy: "Peur, isolement, humiliation, surveillance, contrainte sexuelle ou financière ne sont pas des preuves d’amour. La sécurité passe avant le travail sur soi." },
    ],
    exercise: "Avant un contact impulsif, complète : « Le fait est… / Mon histoire automatique est… / Mon besoin est… / L’action qui me respecte est… »",
    sources: [
      { label: "Drogues Info Service · CSAPA pour dépendances affectives et sexuelles", url: "https://www.drogues-info-service.fr/Adresses-utiles" },
      { label: "Service Public · violences et 3919", url: "https://www.service-public.fr/particuliers/vosdroits/F33891" },
    ],
  },
};

const AVATARS = [
  { emoji: "🌱", label: "Pousse" },
  { emoji: "🦊", label: "Renard" },
  { emoji: "🐼", label: "Panda" },
  { emoji: "🦁", label: "Lion" },
  { emoji: "🐺", label: "Loup" },
  { emoji: "🦋", label: "Papillon" },
  { emoji: "🌙", label: "Lune" },
  { emoji: "⭐", label: "Étoile" },
];

function makeSalt() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const values = new Uint32Array(4);
    window.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

async function hashPinLegacy(pin: string, salt: string) {
  const input = `${salt}:${pin}`;
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let fallback = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    fallback ^= input.charCodeAt(index);
    fallback = Math.imul(fallback, 16777619);
  }
  return `fallback-${(fallback >>> 0).toString(16)}`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePinBits(pin: string, salt: string, purpose: "pin" | "journal") {
  if (!window.crypto?.subtle) throw new Error("secure_crypto_unavailable");
  const material = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );
  return { material, salt: new TextEncoder().encode(`essor:${purpose}:${salt}`) };
}

async function hashPin(pin: string, salt: string) {
  const derived = await derivePinBits(pin, salt, "pin");
  const bits = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", iterations: 210_000, salt: derived.salt },
    derived.material,
    256,
  );
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function deriveJournalKey(pin: string, salt: string) {
  const derived = await derivePinBits(pin, salt, "journal");
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", iterations: 210_000, salt: derived.salt },
    derived.material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptJournal(entries: JournalEntry[], key: CryptoKey): Promise<EncryptedJournal> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(entries));
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    version: 2,
    algorithm: "AES-GCM",
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

async function decryptJournal(raw: string, key: CryptoKey) {
  const parsed = JSON.parse(raw) as EncryptedJournal | JournalEntry[];
  if (Array.isArray(parsed)) return { entries: parsed.slice(0, 200), legacy: true };
  if (parsed.version !== 2 || parsed.algorithm !== "AES-GCM" || !parsed.iv || !parsed.ciphertext) {
    throw new Error("invalid_journal_payload");
  }
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(parsed.iv) },
    key,
    base64ToBytes(parsed.ciphertext),
  );
  const entries = JSON.parse(new TextDecoder().decode(decrypted)) as JournalEntry[];
  if (!Array.isArray(entries)) throw new Error("invalid_journal_entries");
  return { entries: entries.slice(0, 200), legacy: false };
}

async function hashAccessToken(token: string) {
  if (!window.crypto?.subtle) return "";
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function shareMessage(achievement: ShareAchievement, trackLabel: string, includeTrack: boolean) {
  const journey = includeTrack ? `\nMon parcours : ${trackLabel}.` : "";
  return `✨ ${achievement.title}\n${achievement.detail}.${journey}\n\nChaque petit pas mérite sa lumière. Je fais grandir ma victoire avec ESSOR. #MaVictoire #ESSOR`;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  lines.forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

async function createShareCard(
  achievement: ShareAchievement,
  trackLabel: string,
  includeTrack: boolean,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, "#1b1728");
  background.addColorStop(0.48, "#27213a");
  background.addColorStop(1, "#143b3a");
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1350);

  const glow = context.createRadialGradient(790, 240, 20, 790, 240, 520);
  glow.addColorStop(0, "rgba(86,224,194,.34)");
  glow.addColorStop(1, "rgba(86,224,194,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 1080, 760);

  context.strokeStyle = "rgba(255,255,255,.09)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(870, 120, 260, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(870, 120, 360, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#56e0c2";
  context.font = "800 34px system-ui, sans-serif";
  context.letterSpacing = "5px";
  context.fillText("🌱  ESSOR", 78, 105);
  context.letterSpacing = "0px";

  context.fillStyle = "rgba(255,255,255,.09)";
  context.beginPath();
  context.roundRect(68, 170, 944, 1010, 56);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.15)";
  context.stroke();

  context.fillStyle = "rgba(255,209,102,.14)";
  context.beginPath();
  context.arc(540, 405, 148, 0, Math.PI * 2);
  context.fill();
  context.textAlign = "center";
  context.font = "154px Apple Color Emoji, Segoe UI Emoji, sans-serif";
  context.fillText(achievement.icon, 540, 455);

  context.fillStyle = "#ffd166";
  context.font = "800 28px system-ui, sans-serif";
  context.letterSpacing = "4px";
  context.fillText(achievement.eyebrow.toUpperCase(), 540, 620);
  context.letterSpacing = "0px";

  context.fillStyle = "#fffaf1";
  context.font = "800 76px system-ui, sans-serif";
  const titleBottom = drawWrappedText(context, achievement.title, 540, 720, 790, 88);

  context.fillStyle = "#c9c0d4";
  context.font = "500 31px system-ui, sans-serif";
  context.fillText(achievement.detail, 540, titleBottom + 35);

  const privacyLabel = includeTrack ? `Parcours : ${trackLabel}` : "Parcours personnel préservé 🔒";
  context.fillStyle = includeTrack ? "rgba(86,224,194,.16)" : "rgba(255,255,255,.08)";
  context.beginPath();
  context.roundRect(258, titleBottom + 90, 564, 64, 32);
  context.fill();
  context.fillStyle = includeTrack ? "#8ff0da" : "#c9c0d4";
  context.font = "700 23px system-ui, sans-serif";
  context.fillText(privacyLabel, 540, titleBottom + 131);

  context.fillStyle = "#fffaf1";
  context.font = "700 31px system-ui, sans-serif";
  context.fillText("Chaque petit pas mérite sa lumière.", 540, 1100);
  context.fillStyle = "#8f879a";
  context.font = "500 22px system-ui, sans-serif";
  context.fillText("essor-app.valentin88hernandez.chatgpt.site", 540, 1255);

  return new Promise<File | null>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? new File([blob], "essor-ma-victoire.png", { type: "image/png" }) : null);
    }, "image/png");
  });
}

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
  jeux_argent: {
    label: "Jeux d’argent et paris",
    shortLabel: "Paris",
    icon: "🎰",
    accent: "#f0a44b",
    accentSoft: "#3b3022",
    unit: "mise",
    units: "mises",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi des jeux d’argent",
    formCopy: "Paris sportifs, casino, poker ou jeux en ligne : suis les jours, les mises évitées et les déclencheurs sans te juger.",
    safety: "Si le jeu menace tes finances, tes relations ou ton équilibre, Joueurs Info Service répond au 09 74 75 13 13, 7 jours sur 7. En cas d’idées suicidaires, appelle le 3114.",
    milestones: [
      { hours: 24, label: "24 h", title: "Mettre une première distance", description: "Tu crées un espace entre l’envie, l’argent disponible et le passage à l’acte.", icon: "🛑" },
      { hours: 72, label: "3 jours", title: "Créer des barrières", description: "Limites, blocages et soutien humain commencent à protéger tes décisions.", icon: "🧱" },
      { hours: 24 * 7, label: "1 sem.", title: "Une semaine protégée", description: "Tu observes les moments où l’envie de jouer revient le plus fort.", icon: "🛡️" },
      { hours: 24 * 14, label: "2 sem.", title: "Voir les déclencheurs", description: "Stress, ennui, solitude ou espoir de se refaire deviennent plus faciles à repérer.", icon: "🔎" },
      { hours: 24 * 30, label: "1 mois", title: "Reprendre la main", description: "Ton budget et ton attention disposent d’un mois complet de respiration.", icon: "🧭" },
      { hours: 24 * 90, label: "3 mois", title: "Consolider tes protections", description: "Les garde-fous efficaces ont eu le temps de devenir des réflexes.", icon: "🏗️" },
      { hours: 24 * 365, label: "1 an", title: "Une année protégée", description: "Une année de décisions différentes représente une victoire concrète et durable.", icon: "🏆" },
    ],
  },
  ecrans: {
    label: "Écrans et réseaux sociaux",
    shortLabel: "Écrans",
    icon: "📱",
    accent: "#8b83ff",
    accentSoft: "#2d2942",
    unit: "heure",
    units: "heures",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif écrans",
    formCopy: "Réseaux sociaux, vidéos courtes ou navigation automatique : choisis une réduction réaliste et observe ce qui déclenche le geste.",
    safety: "L’objectif n’est pas de supprimer les usages utiles, mais de retrouver du choix. Si les écrans perturbent fortement sommeil, travail ou relations, un professionnel peut t’aider à faire le point.",
    milestones: [
      { hours: 24, label: "24 h", title: "Voir l’automatisme", description: "Tu commences à remarquer quand la main va vers l’écran sans décision consciente.", icon: "👀" },
      { hours: 72, label: "3 jours", title: "Créer de l’espace", description: "Les moments sans écran deviennent plus faciles à identifier et à protéger.", icon: "🌤️" },
      { hours: 24 * 7, label: "1 sem.", title: "Une semaine plus choisie", description: "Tu sais mieux quels usages t’aident et lesquels te vident.", icon: "🧭" },
      { hours: 24 * 14, label: "2 sem.", title: "Changer le réflexe", description: "Tes alternatives ont eu le temps de devenir plus naturelles.", icon: "🔁" },
      { hours: 24 * 30, label: "1 mois", title: "Retrouver ton attention", description: "Un mois de limites réalistes rend ton temps récupéré visible.", icon: "🎯" },
      { hours: 24 * 90, label: "3 mois", title: "Un nouvel équilibre", description: "Tes règles d’usage demandent moins d’effort conscient.", icon: "⚖️" },
      { hours: 24 * 365, label: "1 an", title: "Une année présente", description: "Ton attention a traversé une année entière avec davantage de choix.", icon: "🏆" },
    ],
  },
  jeux_video: {
    label: "Jeux vidéo",
    shortLabel: "Gaming",
    icon: "🎮",
    accent: "#58c6ff",
    accentSoft: "#243542",
    unit: "heure",
    units: "heures",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif jeux vidéo",
    formCopy: "Réduction ou pause : pars du temps réellement joué et de l’impact sur ton sommeil, tes obligations et tes relations.",
    safety: "Jouer n’est pas un problème en soi. Le signal d’alerte est la perte de contrôle avec un impact important sur la vie quotidienne. Un médecin ou un CSAPA peut aider à faire le point.",
    milestones: [
      { hours: 24, label: "24 h", title: "Changer de rythme", description: "Tu observes les créneaux où lancer une partie est devenu automatique.", icon: "⏸️" },
      { hours: 72, label: "3 jours", title: "Traverser l’appel", description: "Tu testes des réponses courtes aux envies de relancer ou de prolonger.", icon: "🧩" },
      { hours: 24 * 7, label: "1 sem.", title: "Une semaine équilibrée", description: "Sommeil, obligations et loisirs retrouvent une place plus visible.", icon: "⚖️" },
      { hours: 24 * 14, label: "2 sem.", title: "Comprendre ce que tu cherches", description: "Défi, lien social, fuite ou détente deviennent plus faciles à distinguer.", icon: "🧠" },
      { hours: 24 * 30, label: "1 mois", title: "Jouer par choix", description: "Tes horaires et tes limites ont eu le temps de devenir plus stables.", icon: "🕹️" },
      { hours: 24 * 90, label: "3 mois", title: "Garder le contrôle", description: "Tu connais mieux les garde-fous qui protègent ton quotidien.", icon: "🛡️" },
      { hours: 24 * 365, label: "1 an", title: "Une année maîtrisée", description: "Le jeu a retrouvé une place choisie parmi les autres dimensions de ta vie.", icon: "🏆" },
    ],
  },
  achats: {
    label: "Achats compulsifs",
    shortLabel: "Achats",
    icon: "🛍️",
    accent: "#ff8f70",
    accentSoft: "#3c2927",
    unit: "achat évité",
    units: "achats évités",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif achats",
    formCopy: "Achats en ligne, promotions ou dépenses impulsives : rends visibles les envies traversées et l’argent conservé.",
    safety: "Si les dépenses mettent en danger ton budget, protège d’abord les moyens de paiement et demande de l’aide à une personne de confiance ou à un professionnel.",
    milestones: [
      { hours: 24, label: "24 h", title: "Créer un délai", description: "Tu laisses passer une première envie sans acheter immédiatement.", icon: "⏳" },
      { hours: 72, label: "3 jours", title: "Retirer les déclencheurs", description: "Alertes, promotions enregistrées et paiements rapides deviennent plus faciles à neutraliser.", icon: "🔕" },
      { hours: 24 * 7, label: "1 sem.", title: "Une semaine de recul", description: "Tu distingues mieux un besoin réel d’une impulsion passagère.", icon: "🔎" },
      { hours: 24 * 14, label: "2 sem.", title: "Voir les émotions", description: "Stress, ennui ou recherche de récompense deviennent plus visibles.", icon: "🧠" },
      { hours: 24 * 30, label: "1 mois", title: "Protéger ton budget", description: "L’argent conservé donne une preuve concrète de ta progression.", icon: "💶" },
      { hours: 24 * 90, label: "3 mois", title: "Acheter avec intention", description: "Les délais et les listes prévues demandent moins d’effort.", icon: "🧾" },
      { hours: 24 * 365, label: "1 an", title: "Une année choisie", description: "Tes dépenses reflètent davantage tes besoins et tes priorités.", icon: "🏆" },
    ],
  },
  sexe: {
    label: "Comportements sexuels compulsifs",
    shortLabel: "Sexe",
    icon: "❤️‍🔥",
    accent: "#ff7898",
    accentSoft: "#3d2532",
    unit: "épisode impulsif évité",
    units: "épisodes impulsifs évités",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif de sexualité choisie",
    formCopy: "Pornographie, rencontres, masturbation ou recherche sexuelle répétée : suis la perte de contrôle et ses conséquences, jamais une norme morale.",
    safety: "Une libido élevée n’est pas un trouble. Le repère est une perte de contrôle répétée avec une souffrance ou un impact important sur la vie, au-delà d’un simple jugement moral. Un sexologue, un psychologue ou un CSAPA peut aider sans juger.",
    milestones: [
      { hours: 24, label: "24 h", title: "Observer sans te condamner", description: "Tu distingues une envie, une émotion et une action sans les confondre.", icon: "👁️" },
      { hours: 72, label: "3 jours", title: "Repérer les déclencheurs", description: "Solitude, stress, excitation, ennui ou écran deviennent plus visibles.", icon: "🔎" },
      { hours: 24 * 7, label: "1 sem.", title: "Installer des limites", description: "Horaires, appareils, lieux et contacts peuvent être organisés pour protéger ton choix.", icon: "🛡️" },
      { hours: 24 * 14, label: "2 sem.", title: "Séparer envie et action", description: "L’espace entre l’impulsion et la décision commence à devenir familier.", icon: "⏸️" },
      { hours: 24 * 30, label: "1 mois", title: "Retrouver du choix", description: "Tu identifies mieux ce qui relève du désir, du réconfort ou de l’automatisme.", icon: "🧭" },
      { hours: 24 * 90, label: "3 mois", title: "Une sexualité plus choisie", description: "Consentement, plaisir, limites et respect de soi reprennent leur place.", icon: "🤝" },
      { hours: 24 * 365, label: "1 an", title: "Une année alignée", description: "Tes décisions sexuelles reflètent davantage tes valeurs et ta sécurité.", icon: "🏆" },
    ],
  },
  affective: {
    label: "Dépendance affective",
    shortLabel: "Affectif",
    icon: "🫂",
    accent: "#c38cff",
    accentSoft: "#302741",
    unit: "réaction impulsive évitée",
    units: "réactions impulsives évitées",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif d’autonomie affective",
    formCopy: "Messages répétés, vérifications, peur d’être quitté ou difficulté à poser des limites : observe les automatismes tout en respectant ton besoin humain de lien.",
    safety: "La dépendance affective n’est pas un diagnostic automatique. Si une relation implique peur, humiliation, surveillance, contrainte ou violence, appelle le 116 006 ; pour les femmes victimes, le 3919. En danger immédiat : 17 ou 112.",
    milestones: [
      { hours: 24, label: "24 h", title: "Créer un temps de réponse", description: "Tu laisses passer quelques minutes avant un message, une vérification ou une concession impulsive.", icon: "⏳" },
      { hours: 72, label: "3 jours", title: "Nommer la peur", description: "Abandon, rejet, solitude ou besoin de validation deviennent plus précis.", icon: "🧠" },
      { hours: 24 * 7, label: "1 sem.", title: "Réouvrir ton espace", description: "Une activité, une personne ou un projet à toi reprend de la place.", icon: "🌤️" },
      { hours: 24 * 14, label: "2 sem.", title: "Poser une limite", description: "Tu expérimentes qu’un non respectueux peut protéger le lien et te protéger toi.", icon: "🛡️" },
      { hours: 24 * 30, label: "1 mois", title: "Te choisir aussi", description: "Tes besoins comptent davantage dans tes décisions relationnelles.", icon: "🫶" },
      { hours: 24 * 90, label: "3 mois", title: "Des liens plus équilibrés", description: "Proximité et autonomie peuvent coexister avec moins de réactions automatiques.", icon: "⚖️" },
      { hours: 24 * 365, label: "1 an", title: "Une année de liens choisis", description: "Tes relations ont traversé une année avec davantage de limites, de sécurité et de réciprocité.", icon: "🏆" },
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

function SubscriptionOffer({
  firstName,
  isAndroidApp,
  playBillingReady,
  playPrices,
  billingBusy,
  onPlayPurchase,
}: {
  firstName: string;
  isAndroidApp: boolean;
  playBillingReady: boolean;
  playPrices: Partial<Record<SubscriptionPlan, string>>;
  billingBusy: boolean;
  onPlayPurchase: (plan: SubscriptionPlan) => void;
}) {
  return (
    <section className="plus-offer" id="essor-plus" aria-labelledby="plus-title">
      <div className="plus-spark plus-spark-one" aria-hidden="true">✦</div>
      <div className="plus-spark plus-spark-two" aria-hidden="true">✧</div>
      <div className="plus-hero">
        <span className="plus-crown" aria-hidden="true">🌳</span>
        <p className="section-label">ESSOR+ · le programme complet</p>
        <h2 id="plus-title">{firstName}, donne 30 jours<br />à la personne que tu deviens.</h2>
        <p>Pas un simple cadenas payant : un chemin guidé, une mission courte chaque jour et des preuves concrètes de ta progression.</p>
        <span className="trial-ribbon">{TRIAL_DAYS} jours gratuits · annulation possible avant le premier prélèvement</span>
      </div>

      <div className="plus-benefits" aria-label="Ce que comprend ESSOR plus">
        <article><span>🗺️</span><div><strong>Un parcours de 30 jours</strong><p>Quatre étapes pour passer de l’effort fragile à une routine qui tient.</p></div></article>
        <article><span>⚡</span><div><strong>Une mission quotidienne</strong><p>Une action faisable en quelques minutes, même dans une mauvaise journée.</p></div></article>
        <article><span>📖</span><div><strong>Ton histoire et tes déclencheurs</strong><p>Bilans, notes et tendances pour comprendre ce qui t’aide vraiment.</p></div></article>
        <article><span>🏆</span><div><strong>Plus de fierté visible</strong><p>XP, niveaux, arbre évolutif et récompenses qui donnent envie de revenir.</p></div></article>
      </div>

      <div className="pricing-grid">
        <article className="price-card">
          <p>Mensuel</p>
          <div className="price"><strong>{playPrices.monthly ?? "6,99 €"}</strong><span>/ mois</span></div>
          <small>Après les {TRIAL_DAYS} jours d’essai</small>
          {isAndroidApp
            ? <button className="button plus-checkout" type="button" disabled={!playBillingReady || billingBusy} onClick={() => onPlayPurchase("monthly")}>{billingBusy ? "Ouverture…" : playBillingReady ? "Commencer mon essai" : "Disponible via Google Play"} <span aria-hidden="true">→</span></button>
            : <a className="button plus-checkout" href={PLUS_LINKS.monthly}>Commencer mon essai <span aria-hidden="true">→</span></a>}
          <em>Sans engagement · paiement sécurisé par {isAndroidApp ? "Google Play" : "Stripe"}</em>
        </article>
        <article className="price-card recommended">
          <span className="best-choice">Le choix qui récompense</span>
          <p>Annuel</p>
          <div className="price"><strong>{playPrices.annual ?? "59,99 €"}</strong><span>/ an</span></div>
          <small>Soit 5 € par mois · 23,89 € économisés</small>
          {isAndroidApp
            ? <button className="button plus-checkout" type="button" disabled={!playBillingReady || billingBusy} onClick={() => onPlayPurchase("annual")}>{billingBusy ? "Ouverture…" : playBillingReady ? "Choisir l’année" : "Disponible via Google Play"} <span aria-hidden="true">👑</span></button>
            : <a className="button plus-checkout" href={PLUS_LINKS.annual}>Choisir l’année <span aria-hidden="true">👑</span></a>}
          <em>{TRIAL_DAYS} jours gratuits · paiement sécurisé par {isAndroidApp ? "Google Play" : "Stripe"}</em>
        </article>
      </div>

      <div className="free-promise">
        <span aria-hidden="true">🫶</span>
        <p><strong>La sécurité ne sera jamais derrière un paiement.</strong> Les numéros d’aide et d’urgence, le code PIN, ton profil et le mode discret restent gratuits.</p>
      </div>
      <p className="billing-note">Un moyen de paiement est demandé au démarrage. Aucun prélèvement pendant {TRIAL_DAYS} jours, puis renouvellement automatique selon la formule choisie jusqu’à résiliation.</p>
    </section>
  );
}

async function verifyPlayPurchase(purchaseToken: string, productId: string) {
  const response = await fetch("/api/google-play/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ purchaseToken, productId }),
  });
  const result = await response.json() as {
    active?: boolean;
    status?: LocalSubscription["status"];
    plan?: SubscriptionPlan;
    currentPeriodEnd?: number | null;
    cancelAtPeriodEnd?: boolean;
    error?: string;
  };
  return { response, result };
}

export default function Home() {
  const [active, setActive] = useState<TrackKey>("tabac");
  const [profiles, setProfiles] = useState<Profiles>({});
  const [checkIns, setCheckIns] = useState<CheckIns>({});
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [subscription, setSubscription] = useState<LocalSubscription | null>(null);
  const [founderAccessStartedAt, setFounderAccessStartedAt] = useState<string | null>(null);
  const [programCompletions, setProgramCompletions] = useState<Record<string, boolean>>({});
  const [subscriptionVerifying, setSubscriptionVerifying] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");
  const [isAndroidApp, setIsAndroidApp] = useState(false);
  const [playBillingReady, setPlayBillingReady] = useState(false);
  const [playPrices, setPlayPrices] = useState<Partial<Record<SubscriptionPlan, string>>>({});
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinAttempt, setPinAttempt] = useState("");
  const [pinError, setPinError] = useState("");
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [pinCooldownUntil, setPinCooldownUntil] = useState(0);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingAvatar, setOnboardingAvatar] = useState(AVATARS[0].emoji);
  const [onboardingPin, setOnboardingPin] = useState("");
  const [onboardingPinConfirm, setOnboardingPinConfirm] = useState("");
  const [onboardingDiscreet, setOnboardingDiscreet] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsAvatar, setSettingsAvatar] = useState(AVATARS[0].emoji);
  const [settingsPin, setSettingsPin] = useState("");
  const [settingsPinConfirm, setSettingsPinConfirm] = useState("");
  const [settingsDiscreet, setSettingsDiscreet] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [appView, setAppView] = useState<AppView>("today");
  const [progressView, setProgressView] = useState<ProgressView>("garden");
  const [presence, setPresence] = useState<{ live: number; today: number } | null>(null);
  const [learnTopic, setLearnTopic] = useState<LearnKey>("cycle");
  const [journalMode, setJournalMode] = useState<JournalMode>("private");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalMood, setJournalMood] = useState<JournalMood>("hopeful");
  const [journalText, setJournalText] = useState("");
  const [journalIntention, setJournalIntention] = useState("");
  const [journalEditingId, setJournalEditingId] = useState<string | null>(null);
  const [journalSaved, setJournalSaved] = useState(false);
  const [circleMemberId, setCircleMemberId] = useState("");
  const [circlePosts, setCirclePosts] = useState<CirclePost[]>([]);
  const [circleMessageKey, setCircleMessageKey] = useState("still_here");
  const [circleShareDays, setCircleShareDays] = useState(false);
  const [circleLoading, setCircleLoading] = useState(false);
  const [circleBusy, setCircleBusy] = useState(false);
  const [circleStatus, setCircleStatus] = useState("");
  const [journalSecurityStatus, setJournalSecurityStatus] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
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
  const [companionStep, setCompanionStep] = useState<CompanionStep>("menu");
  const [companionIntensity, setCompanionIntensity] = useState(7);
  const [companionRecheck, setCompanionRecheck] = useState(4);
  const [companionTrigger, setCompanionTrigger] = useState("");
  const [companionWins, setCompanionWins] = useState(0);
  const [shareAchievement, setShareAchievement] = useState<ShareAchievement | null>(null);
  const [shareJourney, setShareJourney] = useState(false);
  const [shareImage, setShareImage] = useState<File | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [celebrating, setCelebrating] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const hiddenAt = useRef<number | null>(null);
  const pinInput = useRef<HTMLInputElement | null>(null);
  const playBillingService = useRef<DigitalGoodsService | null>(null);
  const journalKey = useRef<CryptoKey | null>(null);
  const pendingJournal = useRef<string | null>(null);
  const checkoutSessionId = subscription?.checkoutSessionId;

  useEffect(() => {
    try {
      const storedProfiles = window.localStorage.getItem(STORAGE_KEY);
      const storedActive = window.localStorage.getItem(ACTIVE_KEY) as TrackKey | null;
      const storedCheckIns = window.localStorage.getItem(CHECKINS_KEY);
      const storedPersonalProfile = window.localStorage.getItem(PERSONAL_KEY);
      const storedSecurity = window.localStorage.getItem(SECURITY_KEY);
      const storedSubscription = window.localStorage.getItem(SUBSCRIPTION_KEY);
      const storedFounderAccess = window.localStorage.getItem(FOUNDER_ACCESS_KEY);
      const storedProgram = window.localStorage.getItem(PROGRAM_KEY);
      const storedCompanionWins = window.localStorage.getItem(COMPANION_KEY);
      const storedJournal = window.localStorage.getItem(JOURNAL_KEY) ?? window.localStorage.getItem(LEGACY_JOURNAL_KEY);
      let storedCircleMember = window.localStorage.getItem(CIRCLE_MEMBER_KEY);
      // Local-only data is intentionally hydrated after the first client mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (storedProfiles) setProfiles(JSON.parse(storedProfiles));
      if (storedCheckIns) setCheckIns(JSON.parse(storedCheckIns));
      if (storedActive && TRACK_KEYS.includes(storedActive)) setActive(storedActive);
      if (storedPersonalProfile) {
        const parsedProfile = JSON.parse(storedPersonalProfile) as PersonalProfile;
        if (parsedProfile.firstName && parsedProfile.avatar) {
          setPersonalProfile(parsedProfile);
          setOnboardingName(parsedProfile.firstName);
          setOnboardingAvatar(parsedProfile.avatar);
        }
      }
      if (storedSecurity) {
        const parsedSecurity = JSON.parse(storedSecurity) as SecuritySettings;
        if (parsedSecurity.pinHash && parsedSecurity.pinSalt) {
          setSecurity({ ...parsedSecurity, discreet: Boolean(parsedSecurity.discreet) });
          setOnboardingDiscreet(Boolean(parsedSecurity.discreet));
          setLocked(true);
        }
      }
      if (storedSubscription) {
        const parsedSubscription = JSON.parse(storedSubscription) as LocalSubscription;
        if (
          ["monthly", "annual"].includes(parsedSubscription.plan) &&
          (parsedSubscription.checkoutSessionId || parsedSubscription.provider === "google_play")
        ) {
          setSubscription(parsedSubscription);
        }
      }
      if (storedFounderAccess && !Number.isNaN(new Date(storedFounderAccess).getTime())) {
        setFounderAccessStartedAt(storedFounderAccess);
      }
      if (storedProgram) setProgramCompletions(JSON.parse(storedProgram));
      if (storedCompanionWins) setCompanionWins(Math.max(0, Number(storedCompanionWins) || 0));
      pendingJournal.current = storedJournal;
      if (!storedCircleMember) {
        storedCircleMember = crypto.randomUUID();
        window.localStorage.setItem(CIRCLE_MEMBER_KEY, storedCircleMember);
      }
      setCircleMemberId(storedCircleMember);

      const params = new URLSearchParams(window.location.search);
      setIsAndroidApp(params.get("platform") === "android");
      const plan = params.get("plan");
      const checkoutSessionId = params.get("session_id");
      if (
        params.get("subscription") === "success" &&
        (plan === "monthly" || plan === "annual") &&
        checkoutSessionId?.startsWith("cs_")
      ) {
        const nextSubscription: LocalSubscription = {
          status: "pending",
          plan,
          activatedAt: new Date().toISOString(),
          provider: "stripe",
          checkoutSessionId,
        };
        setSubscription(nextSubscription);
        window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(nextSubscription));
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
        window.setTimeout(() => {
          setCelebrating(true);
          window.setTimeout(() => setCelebrating(false), 4200);
        }, 250);
      }
    } catch {
      // The experience remains usable if browser storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || locked || !personalProfile) return;
    let cancelled = false;
    let sessionId = "";
    try {
      sessionId = window.localStorage.getItem(PRESENCE_SESSION_KEY) ?? "";
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
        sessionId = crypto.randomUUID();
        window.localStorage.setItem(PRESENCE_SESSION_KEY, sessionId);
      }
    } catch {
      sessionId = crypto.randomUUID();
    }

    async function heartbeat() {
      try {
        const response = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const result = await response.json() as { live?: number; today?: number };
        if (!cancelled && response.ok && Number.isInteger(result.live) && Number.isInteger(result.today)) {
          setPresence({ live: Math.max(1, result.live ?? 1), today: Math.max(1, result.today ?? 1) });
        }
      } catch {
        // Presence is supportive context only; the rest of ESSOR stays fully usable offline.
      }
    }

    heartbeat();
    const timer = window.setInterval(heartbeat, 60_000);
    const onVisibility = () => { if (document.visibilityState === "visible") heartbeat(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [locked, personalProfile, ready]);

  useEffect(() => {
    if (!ready || appView !== "journal" || journalMode !== "circle" || !circleMemberId) return;
    let cancelled = false;
    fetch(`/api/circle?member=${encodeURIComponent(circleMemberId)}`)
      .then(async (response) => {
        const result = await response.json() as { posts?: CirclePost[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "circle_unavailable");
        if (!cancelled) setCirclePosts(Array.isArray(result.posts) ? result.posts : []);
      })
      .catch(() => {
        if (!cancelled) setCircleStatus("Le cercle n’est pas disponible pour le moment. Ton journal privé reste accessible.");
      })
      .finally(() => {
        if (!cancelled) setCircleLoading(false);
      });
    return () => { cancelled = true; };
  }, [appView, circleMemberId, journalMode, ready]);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("acces_fondateur");
    if (!token) return;
    let cancelled = false;

    async function activateFounderAccess() {
      const hash = await hashAccessToken(token!);
      if (cancelled) return;
      params.delete("acces_fondateur");
      const remainingQuery = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`,
      );
      if (hash !== FOUNDER_ACCESS_HASH) {
        setBillingMessage("Cette clé d’accès fondateur n’est pas valide.");
        return;
      }
      const activatedAt = new Date().toISOString();
      window.localStorage.setItem(FOUNDER_ACCESS_KEY, activatedAt);
      setFounderAccessStartedAt(activatedAt);
      setBillingMessage("Accès fondateur activé sur cet appareil. Aucun paiement n’est requis.");
      celebrate();
    }

    activateFounderAccess();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !isAndroidApp) return;
    let cancelled = false;

    async function connectPlayBilling() {
      if (!window.getDigitalGoodsService) {
        setBillingMessage("Google Play Billing sera disponible après installation depuis le Play Store.");
        return;
      }

      try {
        const service = await window.getDigitalGoodsService(PLAY_BILLING_METHOD);
        if (cancelled) return;
        playBillingService.current = service;

        const details = await service.getDetails(Object.values(PLAY_PRODUCTS));
        if (cancelled) return;
        const prices: Partial<Record<SubscriptionPlan, string>> = {};
        for (const detail of details) {
          const plan = detail.itemId === PLAY_PRODUCTS.annual ? "annual" : detail.itemId === PLAY_PRODUCTS.monthly ? "monthly" : null;
          if (!plan) continue;
          prices[plan] = new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: detail.price.currency,
          }).format(Number(detail.price.value));
        }
        setPlayPrices(prices);
        setPlayBillingReady(details.some((detail) => Object.values(PLAY_PRODUCTS).includes(detail.itemId)));

        const purchases = await service.listPurchases();
        if (cancelled) return;
        const entitlement = purchases.find((purchase) => Object.values(PLAY_PRODUCTS).includes(purchase.itemId));
        const purchaseToken = entitlement?.purchaseToken ?? entitlement?.token;
        if (entitlement && purchaseToken) {
          const { response, result } = await verifyPlayPurchase(purchaseToken, entitlement.itemId);
          if (cancelled) return;
          if (!response.ok || !result.active || !result.status) {
            setBillingMessage(result.error === "google_play_not_configured"
              ? "La validation Google Play doit encore être reliée au compte développeur ESSOR."
              : "Google Play n’a pas confirmé cet abonnement.");
            return;
          }
          const plan: SubscriptionPlan = entitlement.itemId === PLAY_PRODUCTS.annual ? "annual" : "monthly";
          const nextSubscription: LocalSubscription = {
            status: result.status,
            plan,
            provider: "google_play",
            activatedAt: new Date().toISOString(),
            purchaseToken,
            currentPeriodEnd: result.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: Boolean(result.cancelAtPeriodEnd),
          };
          setSubscription((current) => {
            const restored = current?.provider === "google_play"
              ? { ...nextSubscription, activatedAt: current.activatedAt }
              : nextSubscription;
            window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(restored));
            return restored;
          });
          setBillingMessage("");
        }
      } catch {
        if (!cancelled) {
          setPlayBillingReady(false);
          setBillingMessage("Google Play Billing n’est pas disponible dans cette installation. Utilise la version installée depuis le Play Store.");
        }
      }
    }

    connectPlayBilling();
    return () => {
      cancelled = true;
    };
  }, [ready, isAndroidApp]);

  useEffect(() => {
    if (!ready || !checkoutSessionId) return;
    const controller = new AbortController();

    async function verifySubscription() {
      setSubscriptionVerifying(true);
      setBillingMessage("");

      if (window.location.hostname === "terminal.local" && checkoutSessionId.startsWith("cs_test_preview")) {
        setSubscription((current) => {
          if (!current) return current;
          const previewSubscription: LocalSubscription = { ...current, status: "trialing", trialEnd: Math.floor(Date.now() / 1000) + TRIAL_DAYS * 86_400 };
          window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(previewSubscription));
          return previewSubscription;
        });
        setSubscriptionVerifying(false);
        return;
      }

      try {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const response = await fetch("/api/stripe/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionId: checkoutSessionId }),
            signal: controller.signal,
          });
          const result = await response.json() as {
            active?: boolean;
            pending?: boolean;
            status?: LocalSubscription["status"];
            plan?: SubscriptionPlan;
            cancelAtPeriodEnd?: boolean;
            currentPeriodEnd?: number | null;
            trialEnd?: number | null;
            error?: string;
          };

          if (response.ok && result.active && result.status) {
            setSubscription((current) => {
              if (!current) return current;
              const verified: LocalSubscription = {
                ...current,
                status: result.status!,
                plan: result.plan === "annual" ? "annual" : "monthly",
                cancelAtPeriodEnd: Boolean(result.cancelAtPeriodEnd),
                currentPeriodEnd: result.currentPeriodEnd ?? null,
                trialEnd: result.trialEnd ?? null,
              };
              window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(verified));
              return verified;
            });
            return;
          }
          if (response.status === 403) {
            setSubscription(null);
            window.localStorage.removeItem(SUBSCRIPTION_KEY);
            setBillingMessage("Cet abonnement n’est plus actif. Ton espace gratuit reste disponible.");
            return;
          }
          if (response.status === 202 && result.pending && attempt < 5) {
            await new Promise((resolve) => window.setTimeout(resolve, 900 + attempt * 450));
            if (controller.signal.aborted) return;
            continue;
          }
          setBillingMessage(response.status === 202
            ? "Stripe termine l’activation. Réessaie dans quelques instants si elle ne s’ouvre pas automatiquement."
            : "La vérification Stripe est momentanément indisponible. Réessaie dans un instant.");
          return;
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setBillingMessage("Impossible de joindre Stripe pour le moment. Tes données locales restent intactes.");
        }
      } finally {
        if (!controller.signal.aborted) setSubscriptionVerifying(false);
      }
    }

    verifySubscription();
    return () => controller.abort();
  }, [ready, checkoutSessionId]);

  useEffect(() => {
    const discreet = Boolean(security?.discreet);
    document.title = discreet ? "Mon quotidien" : "ESSOR — L’application qui enlève le mauvais sort";
    document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute(
      "href",
      discreet ? "/manifest-discret.webmanifest" : "/manifest.webmanifest",
    );
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link) => {
      link.href = discreet ? "/neutral-icon.svg" : "/favicon.svg";
    });
  }, [security?.discreet]);

  useEffect(() => {
    if (!security) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        return;
      }
      if (hiddenAt.current && Date.now() - hiddenAt.current >= 15_000) {
        journalKey.current = null;
        setJournalEntries([]);
        setJournalSecurityStatus("");
        setLocked(true);
        setSettingsOpen(false);
        setPauseOpen(false);
        setPinAttempt("");
      }
      hiddenAt.current = null;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [security]);

  useEffect(() => {
    if (!locked) return;
    const timer = window.setTimeout(() => pinInput.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [locked]);

  useEffect(() => {
    const needsOnboarding = ready && (!personalProfile || !security);
    if (!settingsOpen && !locked && !needsOnboarding) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked, personalProfile, ready, security, settingsOpen]);

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
    if (!shareAchievement) return;
    let cancelled = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShareAchievement(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    createShareCard(shareAchievement, TRACKS[active].label, shareJourney).then((file) => {
      if (!cancelled) setShareImage(file);
    });
    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, shareAchievement, shareJourney]);

  useEffect(() => {
    const todayEntry = checkIns[active]?.[localDate()];
    // The editor mirrors the saved entry whenever the selected journey changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const activeCheckIns = useMemo(() => checkIns[active] ?? {}, [active, checkIns]);
  const sevenDays = recentDays(7);
  const stage = growthStage(progress.days);
  const unlockedRewards = REWARDS.filter((reward) => progress.days >= reward.days);
  const nextReward = REWARDS.find((reward) => progress.days < reward.days);
  const checkInCount = Object.keys(activeCheckIns).length;
  const completedProgramDays = Object.keys(programCompletions).filter((day) => programCompletions[day]).length;
  const xp = progress.days * 45 + reached.length * 120 + checkInCount * 35 + completedProgramDays * 80 + companionWins * 70;
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = (xp % 500) / 500;
  const motivation = MOTIVATIONS[(active.length * 3 + progress.days) % MOTIVATIONS.length];
  const hasPlusAccess = Boolean(founderAccessStartedAt) || Boolean(subscription && ["trialing", "active", "past_due"].includes(subscription.status));
  const plusStartedAt = founderAccessStartedAt ?? subscription?.activatedAt;
  const plusDay = hasPlusAccess && plusStartedAt
    ? Math.min(30, Math.max(1, Math.floor((Date.now() - new Date(plusStartedAt).getTime()) / 86_400_000) + 1))
    : 1;
  const trialDaysRemaining = subscription?.status === "trialing"
    ? Math.max(0, subscription.trialEnd
      ? Math.ceil((subscription.trialEnd * 1000 - Date.now()) / 86_400_000)
      : TRIAL_DAYS - Math.floor((Date.now() - new Date(subscription.activatedAt).getTime()) / 86_400_000))
    : 0;
  const subscriptionStateLabel = subscription?.status === "past_due"
    ? "Paiement à régulariser"
    : subscription?.cancelAtPeriodEnd
      ? `Résiliation programmée${subscription.currentPeriodEnd ? ` le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(subscription.currentPeriodEnd * 1000)}` : " en fin de période"}`
      : trialDaysRemaining > 0
      ? `${trialDaysRemaining} jour${trialDaysRemaining > 1 ? "s" : ""} d’essai restant${trialDaysRemaining > 1 ? "s" : ""}`
      : "Abonnement actif";
  const plusStage = PROGRAM_STAGES.find((item) => plusDay >= item.from && plusDay <= item.to) ?? PROGRAM_STAGES[3];
  const dailyMission = DAILY_MISSIONS[(plusDay - 1) % DAILY_MISSIONS.length];
  const todayMissionDone = Boolean(programCompletions[localDate()]);
  const selectedLearning = LEARNING_MODULES[learnTopic];
  const journalPrompt = JOURNAL_PROMPTS[new Date().getDate() % JOURNAL_PROMPTS.length];

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

  function persistPersonalProfile(nextProfile: PersonalProfile) {
    setPersonalProfile(nextProfile);
    try {
      window.localStorage.setItem(PERSONAL_KEY, JSON.stringify(nextProfile));
    } catch {
      // State still works for this session.
    }
  }

  function persistSecurity(nextSecurity: SecuritySettings) {
    setSecurity(nextSecurity);
    try {
      window.localStorage.setItem(SECURITY_KEY, JSON.stringify(nextSecurity));
    } catch {
      // State still works for this session.
    }
  }

  async function openEncryptedJournal(pin: string, settings: SecuritySettings) {
    const key = await deriveJournalKey(pin, settings.pinSalt);
    journalKey.current = key;
    const raw = pendingJournal.current;
    if (!raw) {
      setJournalEntries([]);
      setJournalSecurityStatus("Journal chiffré prêt sur cet appareil.");
      return;
    }

    const decrypted = await decryptJournal(raw, key);
    setJournalEntries(decrypted.entries);
    if (decrypted.legacy) {
      const encrypted = await encryptJournal(decrypted.entries, key);
      const serialized = JSON.stringify(encrypted);
      window.localStorage.setItem(JOURNAL_KEY, serialized);
      window.localStorage.removeItem(LEGACY_JOURNAL_KEY);
      pendingJournal.current = serialized;
      setJournalSecurityStatus("Ancien journal protégé et chiffré automatiquement.");
    } else {
      setJournalSecurityStatus("Journal déchiffré uniquement pour cette session.");
    }
  }

  async function createPrivateSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstName = onboardingName.trim();
    if (!firstName) {
      setOnboardingError("Indique le prénom que tu veux voir dans ton espace.");
      return;
    }
    if (!/^\d{4}$/.test(onboardingPin)) {
      setOnboardingError("Choisis un code composé de 4 chiffres.");
      return;
    }
    if (onboardingPin !== onboardingPinConfirm) {
      setOnboardingError("Les deux codes ne sont pas identiques.");
      return;
    }

    const pinSalt = makeSalt();
    try {
      const pinHash = await hashPin(onboardingPin, pinSalt);
      journalKey.current = await deriveJournalKey(onboardingPin, pinSalt);
      persistPersonalProfile({ firstName: firstName.slice(0, 24), avatar: onboardingAvatar });
      persistSecurity({ pinHash, pinSalt, discreet: onboardingDiscreet, hashVersion: 2 });
      setJournalSecurityStatus("Journal chiffré prêt sur cet appareil.");
    } catch {
      setOnboardingError("Ce navigateur ne permet pas d’activer le chiffrement sécurisé. Mets-le à jour puis réessaie.");
      return;
    }
    setOnboardingPin("");
    setOnboardingPinConfirm("");
    setOnboardingError("");
    setLocked(false);
    window.setTimeout(celebrate, 100);
  }

  async function unlockApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!security) return;
    if (pinCooldownUntil > Date.now()) {
      setPinError("Trop d’essais. Patiente encore quelques secondes.");
      return;
    }
    if (!/^\d{4}$/.test(pinAttempt)) {
      setPinError("Entre les 4 chiffres de ton code.");
      return;
    }

    const legacyPin = security.hashVersion !== 2;
    const candidate = legacyPin
      ? await hashPinLegacy(pinAttempt, security.pinSalt)
      : await hashPin(pinAttempt, security.pinSalt);
    if (candidate === security.pinHash) {
      try {
        let sessionSecurity = security;
        if (legacyPin) {
          const pinSalt = makeSalt();
          sessionSecurity = {
            ...security,
            pinSalt,
            pinHash: await hashPin(pinAttempt, pinSalt),
            hashVersion: 2,
          };
          persistSecurity(sessionSecurity);
        }
        await openEncryptedJournal(pinAttempt, sessionSecurity);
      } catch {
        journalKey.current = null;
        setJournalEntries([]);
        setJournalSecurityStatus("Le journal protégé semble endommagé et reste intact sur l’appareil. Les autres fonctions restent accessibles.");
      }
      setLocked(false);
      setPinAttempt("");
      setPinError("");
      setFailedPinAttempts(0);
      return;
    }

    const nextFailures = failedPinAttempts + 1;
    setFailedPinAttempts(nextFailures);
    setPinAttempt("");
    if (nextFailures >= 5) {
      const cooldown = Date.now() + 30_000;
      setPinCooldownUntil(cooldown);
      setPinError("Cinq codes incorrects. Réessaie dans 30 secondes.");
      window.setTimeout(() => {
        setFailedPinAttempts(0);
        setPinCooldownUntil(0);
        setPinError("");
      }, 30_000);
    } else {
      setPinError(`Code incorrect · ${5 - nextFailures} essai${5 - nextFailures > 1 ? "s" : ""} avant la pause.`);
    }
  }

  function openPersonalSettings() {
    if (!personalProfile || !security) return;
    setSettingsName(personalProfile.firstName);
    setSettingsAvatar(personalProfile.avatar);
    setSettingsPin("");
    setSettingsPinConfirm("");
    setSettingsDiscreet(security.discreet);
    setSettingsError("");
    setSettingsOpen(true);
  }

  async function savePersonalSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!security) return;
    const firstName = settingsName.trim();
    if (!firstName) {
      setSettingsError("Ton prénom ne peut pas être vide.");
      return;
    }
    if (settingsPin && !/^\d{4}$/.test(settingsPin)) {
      setSettingsError("Le nouveau code doit contenir exactement 4 chiffres.");
      return;
    }
    if (settingsPin !== settingsPinConfirm) {
      setSettingsError("Les deux nouveaux codes ne sont pas identiques.");
      return;
    }

    let nextSecurity = { ...security, discreet: settingsDiscreet };
    if (settingsPin) {
      const pinSalt = makeSalt();
      try {
        const nextKey = await deriveJournalKey(settingsPin, pinSalt);
        const encrypted = await encryptJournal(journalEntries, nextKey);
        const serialized = JSON.stringify(encrypted);
        window.localStorage.setItem(JOURNAL_KEY, serialized);
        window.localStorage.removeItem(LEGACY_JOURNAL_KEY);
        pendingJournal.current = serialized;
        journalKey.current = nextKey;
        nextSecurity = { ...nextSecurity, pinSalt, pinHash: await hashPin(settingsPin, pinSalt), hashVersion: 2 };
      } catch {
        setSettingsError("Le nouveau code n’a pas pu protéger le journal. Aucun changement n’a été enregistré.");
        return;
      }
    }
    persistPersonalProfile({ firstName: firstName.slice(0, 24), avatar: settingsAvatar });
    persistSecurity(nextSecurity);
    setSettingsOpen(false);
    setSettingsError("");
  }

  function lockApp() {
    setSettingsOpen(false);
    setPauseOpen(false);
    setPinAttempt("");
    setPinError("");
    journalKey.current = null;
    setJournalEntries([]);
    setJournalSecurityStatus("");
    setLocked(true);
  }

  async function resetPrivateSpace() {
    if (!window.confirm("Effacer définitivement ton profil, tes suivis, ton journal, tes victoires et tes signes du Cercle ? Ton abonnement Stripe ou Google Play, s’il existe, ne sera pas résilié.")) return;
    if (circleMemberId) {
      try {
        const response = await fetch("/api/circle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "delete_all", memberId: circleMemberId }),
        });
        if (!response.ok) throw new Error("circle_delete_failed");
      } catch {
        setSettingsError("Le Cercle n’est pas joignable : rien n’a été effacé pour éviter de laisser tes signes sans moyen de les retirer. Réessaie avec une connexion active.");
        return;
      }
    }
    const presenceSessionId = window.localStorage.getItem(PRESENCE_SESSION_KEY);
    if (presenceSessionId) {
      try {
        const response = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "delete", sessionId: presenceSessionId }),
        });
        if (!response.ok) throw new Error("presence_delete_failed");
      } catch {
        setSettingsError("Le serveur n’est pas joignable : rien n’a été effacé pour éviter de conserver ta présence anonyme. Réessaie avec une connexion active.");
        return;
      }
    }
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("essor:") && key !== SUBSCRIPTION_KEY)
        .forEach((key) => window.localStorage.removeItem(key));
    } finally {
      window.location.reload();
    }
  }

  function selectTrack(key: TrackKey) {
    setActive(key);
    setEditing(false);
    setError("");
    document.querySelector<HTMLDetailsElement>(".track-switcher")?.removeAttribute("open");
    try {
      window.localStorage.setItem(ACTIVE_KEY, key);
    } catch {}
  }

  function navigateApp(view: AppView) {
    setAppView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function persistJournal(entries: JournalEntry[]) {
    const ordered = [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 200);
    setJournalEntries(ordered);
    const key = journalKey.current;
    if (!key) {
      setJournalSaved(false);
      setJournalSecurityStatus("Verrouille puis déverrouille ESSOR pour réactiver le journal protégé.");
      return false;
    }
    try {
      const encrypted = await encryptJournal(ordered, key);
      const serialized = JSON.stringify(encrypted);
      window.localStorage.setItem(JOURNAL_KEY, serialized);
      window.localStorage.removeItem(LEGACY_JOURNAL_KEY);
      pendingJournal.current = serialized;
      setJournalSecurityStatus("Journal chiffré sur cet appareil.");
      return true;
    } catch {
      setJournalSaved(false);
      setJournalSecurityStatus("Cette page n’a pas pu être chiffrée. Vérifie l’espace disponible sur ton téléphone.");
      return false;
    }
  }

  async function saveJournalEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = journalText.trim();
    const intention = journalIntention.trim();
    if (!text && !intention) return;
    const nowIso = new Date().toISOString();
    const existing = journalEditingId ? journalEntries.find((entry) => entry.id === journalEditingId) : null;
    const nextEntry: JournalEntry = {
      id: existing?.id ?? crypto.randomUUID(),
      date: existing?.date ?? localDate(),
      mood: journalMood,
      text: text.slice(0, 4_000),
      intention: intention.slice(0, 600),
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };
    const saved = await persistJournal([nextEntry, ...journalEntries.filter((entry) => entry.id !== nextEntry.id)]);
    if (!saved) return;
    setJournalEditingId(null);
    setJournalText("");
    setJournalIntention("");
    setJournalSaved(true);
    window.setTimeout(() => setJournalSaved(false), 2_400);
  }

  function editJournalEntry(entry: JournalEntry) {
    setJournalEditingId(entry.id);
    setJournalMood(entry.mood);
    setJournalText(entry.text);
    setJournalIntention(entry.intention);
    setJournalSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelJournalEdit() {
    setJournalEditingId(null);
    setJournalText("");
    setJournalIntention("");
    setJournalMood("hopeful");
  }

  async function deleteJournalEntry(entry: JournalEntry) {
    if (!window.confirm(`Effacer la page du ${dateLabel(entry.date)} ? Cette action est définitive sur cet appareil.`)) return;
    await persistJournal(journalEntries.filter((item) => item.id !== entry.id));
    if (journalEditingId === entry.id) cancelJournalEdit();
  }

  async function publishCircleMessage() {
    if (!circleMemberId || circleBusy) return;
    setCircleBusy(true);
    setCircleStatus("");
    try {
      const response = await fetch("/api/circle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          memberId: circleMemberId,
          messageKey: circleMessageKey,
          days: circleShareDays ? progress.days : null,
        }),
      });
      const result = await response.json() as { post?: CirclePost; error?: string };
      if (!response.ok || !result.post) {
        setCircleStatus(result.error === "rate_limited"
          ? "Tu as déjà envoyé plusieurs signes aujourd’hui. Le cercle te relira demain 💜"
          : "Impossible de publier ce signe pour le moment.");
        return;
      }
      setCirclePosts((current) => [result.post!, ...current.filter((post) => post.id !== result.post!.id)]);
      setCircleStatus("Ton signe est parti dans le cercle. Aucun prénom ni parcours n’a été partagé.");
    } catch {
      setCircleStatus("Le cercle n’est pas disponible pour le moment.");
    } finally {
      setCircleBusy(false);
    }
  }

  async function supportCirclePost(postId: string) {
    if (!circleMemberId || circleBusy) return;
    setCircleBusy(true);
    setCircleStatus("");
    try {
      const response = await fetch("/api/circle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "support", memberId: circleMemberId, postId }),
      });
      const result = await response.json() as { supportCount?: number; supported?: boolean };
      if (!response.ok) throw new Error("support_failed");
      setCirclePosts((current) => current.map((post) => post.id === postId
        ? { ...post, supportCount: result.supportCount ?? post.supportCount, supported: Boolean(result.supported) }
        : post));
    } catch {
      setCircleStatus("Le soutien n’a pas pu être envoyé. Réessaie plus tard.");
    } finally {
      setCircleBusy(false);
    }
  }

  async function reportCirclePost(postId: string) {
    if (!circleMemberId || circleBusy) return;
    if (!window.confirm("Masquer et signaler ce signe pour protéger le Cercle ESSOR ?")) return;
    setCircleBusy(true);
    setCircleStatus("");
    try {
      const response = await fetch("/api/circle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "report", memberId: circleMemberId, postId }),
      });
      if (!response.ok) throw new Error("report_failed");
      setCirclePosts((current) => current.filter((post) => post.id !== postId));
      setCircleStatus("Merci. Ce signe est masqué sur ton écran et son signalement a été enregistré.");
    } catch {
      setCircleStatus("Le signalement n’a pas pu être envoyé. Réessaie plus tard.");
    } finally {
      setCircleBusy(false);
    }
  }

  async function deleteCirclePost(postId: string) {
    if (!circleMemberId || circleBusy) return;
    if (!window.confirm("Retirer définitivement ton signe du Cercle ESSOR ?")) return;
    setCircleBusy(true);
    setCircleStatus("");
    try {
      const response = await fetch("/api/circle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", memberId: circleMemberId, postId }),
      });
      if (!response.ok) throw new Error("delete_failed");
      setCirclePosts((current) => current.filter((post) => post.id !== postId));
      setCircleStatus("Ton signe a été retiré du cercle.");
    } catch {
      setCircleStatus("Ton signe n’a pas pu être retiré. Réessaie plus tard.");
    } finally {
      setCircleBusy(false);
    }
  }

  function openEditor() {
    if (profile) {
      setStartDate(profile.startDate);
      setUnitsPerDay(String(profile.unitsPerDay));
      setPricePerUnit(String(profile.pricePerUnit));
      setReason(profile.reason);
    } else {
      setStartDate(localDate());
      const defaults: Partial<Record<TrackKey, { units: string; price: string }>> = {
        tabac: { units: "10", price: "0.60" },
        jeux_argent: { units: "1", price: "20" },
        ecrans: { units: "3", price: "0" },
        jeux_video: { units: "3", price: "0" },
        achats: { units: "1", price: "30" },
      };
      setUnitsPerDay(defaults[active]?.units ?? "1");
      setPricePerUnit(defaults[active]?.price ?? "0");
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

  function completeDailyMission() {
    const today = localDate();
    const nextCompletions = { ...programCompletions, [today]: true };
    setProgramCompletions(nextCompletions);
    try {
      window.localStorage.setItem(PROGRAM_KEY, JSON.stringify(nextCompletions));
    } catch {
      // The mission remains completed for the current session.
    }
    celebrate();
  }

  function goToPlus() {
    if (hasPlusAccess) {
      setAppView("today");
      window.setTimeout(() => document.getElementById("programme-plus")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      return;
    }
    document.getElementById("essor-plus")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function startPlayPurchase(plan: SubscriptionPlan) {
    const service = playBillingService.current;
    if (!service || !playBillingReady || billingBusy) return;
    setBillingBusy(true);
    setBillingMessage("");

    try {
      const request = new PaymentRequest(
        [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku: PLAY_PRODUCTS[plan] } }],
        { total: { label: "ESSOR+", amount: { currency: "EUR", value: "0" } } },
      );
      const paymentResponse = await request.show();
      const details = paymentResponse.details as { purchaseToken?: string; token?: string };
      const purchaseToken = details.purchaseToken ?? details.token;
      if (!purchaseToken) {
        await paymentResponse.complete("fail");
        throw new Error("missing_purchase_token");
      }
      const { response, result } = await verifyPlayPurchase(purchaseToken, PLAY_PRODUCTS[plan]);
      if (!response.ok || !result.active || !result.status) {
        await paymentResponse.complete("fail");
        setBillingMessage(result.error === "google_play_not_configured"
          ? "Le paiement est reçu, mais la validation du compte Play Console doit encore être configurée avant l’ouverture d’ESSOR+."
          : "Google Play n’a pas confirmé l’abonnement. Aucun accès payant n’a été ouvert.");
        return;
      }
      const nextSubscription: LocalSubscription = {
        status: result.status,
        plan,
        provider: "google_play",
        activatedAt: new Date().toISOString(),
        purchaseToken,
        currentPeriodEnd: result.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: Boolean(result.cancelAtPeriodEnd),
      };
      setSubscription(nextSubscription);
      window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(nextSubscription));
      await paymentResponse.complete("success");
      setBillingMessage("ESSOR+ est activé par Google Play. Bienvenue dans le programme !");
      celebrate();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setBillingMessage("Le paiement Google Play n’a pas abouti. Aucun accès payant n’a été activé.");
      }
    } finally {
      setBillingBusy(false);
    }
  }

  async function manageSubscription() {
    if (!subscription || billingBusy) return;
    if (subscription.provider === "google_play") {
      const sku = PLAY_PRODUCTS[subscription.plan];
      window.location.assign(`https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(sku)}&package=${ANDROID_PACKAGE_ID}`);
      return;
    }
    if (!subscription.checkoutSessionId) return;
    setBillingBusy(true);
    setBillingMessage("");
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: subscription.checkoutSessionId }),
      });
      const result = await response.json() as { url?: string };
      if (!response.ok || !result.url?.startsWith("https://billing.stripe.com/")) throw new Error("portal_unavailable");
      window.location.assign(result.url);
    } catch {
      setBillingMessage("Le portail Stripe n’est pas disponible pour le moment. Réessaie dans quelques instants.");
      setBillingBusy(false);
    }
  }

  function openShare(achievement: ShareAchievement) {
    setShareAchievement(achievement);
    setShareJourney(false);
    setShareImage(null);
    setShareStatus("");
  }

  function closeShare() {
    setShareAchievement(null);
    setShareStatus("");
  }

  function currentShareText() {
    if (!shareAchievement) return "";
    return shareMessage(shareAchievement, track.label, shareJourney);
  }

  async function copyShareText() {
    const text = `${currentShareText()}\n${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus("Texte et lien copiés. Tu peux les coller où tu veux.");
    } catch {
      setShareStatus("La copie automatique n’est pas disponible sur cet appareil.");
    }
  }

  async function nativeShare() {
    if (!shareAchievement) return;
    const text = currentShareText();
    const shareData: ShareData = { title: `Ma victoire ESSOR · ${shareAchievement.title}`, text, url: window.location.origin };
    if (shareImage && navigator.canShare?.({ files: [shareImage] })) shareData.files = [shareImage];
    if (!navigator.share) {
      await copyShareText();
      return;
    }
    try {
      await navigator.share(shareData);
      setShareStatus("Ta victoire est prête à rayonner ✨");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setShareStatus("Le partage n’a pas pu s’ouvrir. Tu peux copier le texte ou télécharger la carte.");
      }
    }
  }

  function openSocialShare(network: "facebook" | "x" | "reddit" | "whatsapp" | "bluesky" | "telegram") {
    if (!shareAchievement) return;
    const text = currentShareText();
    const url = window.location.origin;
    const destinations = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${shareAchievement.icon} ${shareAchievement.title} · ESSOR`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      bluesky: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text}\n${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };
    window.open(destinations[network], "_blank", "noopener,noreferrer");
  }

  function downloadShareCard() {
    if (!shareImage) return;
    const url = URL.createObjectURL(shareImage);
    const link = document.createElement("a");
    link.href = url;
    link.download = shareImage.name;
    link.click();
    URL.revokeObjectURL(url);
    setShareStatus("Carte enregistrée. Tu peux maintenant l’ajouter à une publication ou une story.");
  }

  function celebrate() {
    setCelebrating(false);
    window.requestAnimationFrame(() => setCelebrating(true));
    window.setTimeout(() => setCelebrating(false), 4200);
  }

  function openPause() {
    setPauseSeconds(180);
    setPauseRunning(false);
    setCompanionStep("menu");
    setCompanionIntensity(7);
    setCompanionRecheck(4);
    setCompanionTrigger("");
    setPauseOpen(true);
  }

  function closePause() {
    setPauseOpen(false);
    setPauseRunning(false);
  }

  function startCompanionExercise() {
    setPauseSeconds(180);
    setPauseRunning(true);
    setCompanionStep("exercise");
  }

  function completeCompanionSession() {
    const nextWins = companionWins + 1;
    setCompanionWins(nextWins);
    try {
      window.localStorage.setItem(COMPANION_KEY, String(nextWins));
    } catch {
      // The reward remains visible for the current session.
    }
    setCompanionStep("complete");
    celebrate();
  }

  if (!ready) return <main className="loading">ESSOR prépare ton espace…</main>;

  if (locked && security) {
    const discreet = security.discreet;
    return (
      <main className={discreet ? "privacy-shell discreet-lock" : "privacy-shell"}>
        <section className="lock-card" aria-labelledby="lock-title">
          <div className="privacy-tree lock-tree" aria-hidden="true">
            <Plant progress={0.68} />
            {!discreet && <span className="privacy-avatar">{personalProfile?.avatar ?? "🌱"}</span>}
          </div>
          <p className="privacy-kicker">{discreet ? "Mon quotidien" : "ESSOR · espace personnel"}</p>
          <h1 id="lock-title">Ton espace est verrouillé.</h1>
          <p>{discreet ? "Entre ton code pour retrouver ton espace." : "Entre ton code pour retrouver ton jardin et tes victoires."}</p>
          <form onSubmit={unlockApp} noValidate>
            <label className="pin-field">
              <span>Code PIN</span>
              <input
                ref={pinInput}
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={pinAttempt}
                onChange={(event) => {
                  setPinAttempt(event.target.value.replace(/\D/g, "").slice(0, 4));
                  setPinError("");
                }}
                aria-describedby={pinError ? "pin-error" : undefined}
              />
            </label>
            {pinError && <p className="form-error" id="pin-error" role="alert">{pinError}</p>}
            <button className="button primary privacy-primary" type="submit">Ouvrir mon espace <span aria-hidden="true">→</span></button>
          </form>
          <button className="forgot-pin" type="button" onClick={resetPrivateSpace}>Code oublié ? Effacer mon espace local</button>
          <p className="lock-footnote"><span aria-hidden="true">🔒</span> Le code protège des regards indiscrets. Le verrouillage du téléphone reste ta première protection.</p>
        </section>
      </main>
    );
  }

  if (!personalProfile || !security) {
    return (
      <main className="privacy-shell onboarding-shell">
        <section className="onboarding-card" aria-labelledby="onboarding-title">
          <div className="onboarding-heading">
            <div className="privacy-tree onboarding-tree" aria-hidden="true"><Plant progress={0.58} /></div>
            <div>
              <p className="privacy-kicker">Ton espace, vraiment à toi</p>
              <h1 id="onboarding-title">Bienvenue dans ton jardin privé.</h1>
              <p>Un prénom, un avatar et un code PIN. Aucun compte externe, aucune donnée envoyée ailleurs.</p>
            </div>
          </div>

          <form onSubmit={createPrivateSpace} noValidate>
            <label className="field">
              <span>Comment veux-tu qu’ESSOR t’appelle ?</span>
              <input
                value={onboardingName}
                maxLength={24}
                autoComplete="given-name"
                onChange={(event) => setOnboardingName(event.target.value)}
                placeholder="Ex. Marie"
              />
            </label>

            <fieldset className="avatar-fieldset">
              <legend>Choisis ton avatar</legend>
              <div className="avatar-grid">
                {AVATARS.map((avatar) => (
                  <button
                    className={onboardingAvatar === avatar.emoji ? "avatar-option selected" : "avatar-option"}
                    type="button"
                    key={avatar.label}
                    onClick={() => setOnboardingAvatar(avatar.emoji)}
                    aria-label={avatar.label}
                    aria-pressed={onboardingAvatar === avatar.emoji}
                  >
                    {avatar.emoji}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="form-row pin-row">
              <label className="field">
                <span>Crée un code à 4 chiffres</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={onboardingPin}
                  onChange={(event) => setOnboardingPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                />
              </label>
              <label className="field">
                <span>Confirme ton code</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={onboardingPinConfirm}
                  onChange={(event) => setOnboardingPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                />
              </label>
            </div>

            <label className="discreet-toggle">
              <input type="checkbox" checked={onboardingDiscreet} onChange={(event) => setOnboardingDiscreet(event.target.checked)} />
              <span className="toggle-track" aria-hidden="true"><i /></span>
              <span><strong>Activer le mode discret</strong><small>« Mon quotidien » et une icône neutre lors de l’installation sur le téléphone.</small></span>
            </label>

            {Object.keys(profiles).length > 0 && <p className="legacy-note">✨ Tes suivis actuels sont conservés : tu ajoutes simplement une protection autour.</p>}
            {onboardingError && <p className="form-error" role="alert">{onboardingError}</p>}
            <button className="button primary privacy-primary" type="submit">Créer mon espace privé <span aria-hidden="true">🌱</span></button>
            <p className="lock-footnote">Ton code n’est jamais stocké en clair. Il protège aussi le chiffrement de ton journal. Si tu l’oublies, personne ne pourra récupérer ces pages.</p>
          </form>
        </section>
      </main>
    );
  }

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
        <div className="top-actions">
          <button className={hasPlusAccess ? "plus-chip active" : "plus-chip"} type="button" onClick={goToPlus}>
            <span aria-hidden="true">{hasPlusAccess ? "👑" : "✨"}</span>
            {hasPlusAccess ? `ESSOR+ · ${founderAccessStartedAt ? "fondateur" : trialDaysRemaining > 0 ? "essai actif" : "actif"}` : subscriptionVerifying ? "Vérification…" : "Découvrir ESSOR+"}
          </button>
          <button className="profile-chip" type="button" onClick={openPersonalSettings} aria-label="Ouvrir mon profil et mes réglages">
            <span className="profile-avatar" aria-hidden="true">{personalProfile.avatar}</span>
            <span>Bonjour <strong>{personalProfile.firstName}</strong> 👋</span>
            <i aria-hidden="true">⚙</i>
          </button>
          <button className="top-lock" type="button" onClick={lockApp} aria-label="Verrouiller l’application maintenant">🔒</button>
          {hasPlusAccess && profile && !editing
            ? <button className="help-link" type="button" onClick={() => navigateApp("help")}>Un coup de pouce <span aria-hidden="true">↓</span></button>
            : <a className="help-link" href="#aide">Un coup de pouce <span aria-hidden="true">↓</span></a>}
        </div>
      </header>

      {(!hasPlusAccess || !profile || editing) && (
        <section className={profile && !editing ? "intro compact" : "intro"} id="top">
          <span className="magic-pill">✨ Chaque petit pas mérite sa lumière</span>
          <h1>L’application qui enlève<br /><em>le mauvais sort.</em></h1>
          <p>Transforme tes efforts en victoires visibles. Ton arbre grandit, tes badges s’allument et ta fierté aussi.</p>
        </section>
      )}

      {hasPlusAccess && profile && !editing ? (
        <div className="active-track-strip">
          <span className="active-track-label"><i aria-hidden="true">{track.icon}</i><span><small>Mon parcours</small><strong>{track.label}</strong></span></span>
          <details className="track-switcher">
            <summary>Changer <span aria-hidden="true">⌄</span></summary>
            <nav className="track-tabs compact-tracks" aria-label="Choisir un autre suivi">
              {TRACK_KEYS.map((key) => {
                const item = TRACKS[key];
                return <button className={key === active ? "track-tab active" : "track-tab"} key={key} onClick={() => selectTrack(key)} aria-pressed={key === active}><span className="track-icon" aria-hidden="true">{item.icon}</span>{item.shortLabel}{profiles[key] && <span className="saved-dot" aria-label="suivi configuré" />}</button>;
              })}
            </nav>
          </details>
        </div>
      ) : (
        <nav className="track-tabs" aria-label="Choisir un suivi">
          {TRACK_KEYS.map((key) => {
            const item = TRACKS[key];
            return <button className={key === active ? "track-tab active" : "track-tab"} key={key} onClick={() => selectTrack(key)} aria-pressed={key === active}><span className="track-icon" aria-hidden="true">{item.icon}</span>{item.shortLabel}{profiles[key] && <span className="saved-dot" aria-label="suivi configuré" />}</button>;
          })}
        </nav>
      )}

      {hasPlusAccess && profile && !editing && (
        <nav className="app-view-nav" aria-label="Navigation principale">
          <button className={appView === "today" ? "active" : ""} type="button" onClick={() => navigateApp("today")} aria-current={appView === "today" ? "page" : undefined}><span aria-hidden="true">☀️</span><b>Aujourd’hui</b></button>
          <button className={appView === "progress" ? "active" : ""} type="button" onClick={() => navigateApp("progress")} aria-current={appView === "progress" ? "page" : undefined}><span aria-hidden="true">🌳</span><b>Progrès</b></button>
          <button className={appView === "journal" ? "active" : ""} type="button" onClick={() => navigateApp("journal")} aria-current={appView === "journal" ? "page" : undefined}><span aria-hidden="true">📖</span><b>Journal</b></button>
          <button className={appView === "learn" ? "active" : ""} type="button" onClick={() => navigateApp("learn")} aria-current={appView === "learn" ? "page" : undefined}><span aria-hidden="true">🧠</span><b>Comprendre</b></button>
          <button className={appView === "help" ? "active" : ""} type="button" onClick={() => navigateApp("help")} aria-current={appView === "help" ? "page" : undefined}><span aria-hidden="true">🫶</span><b>Aide</b></button>
        </nav>
      )}

      {hasPlusAccess && profile && !editing && appView === "progress" && (
        <nav className="progress-view-nav" aria-label="Choisir une vue de progression">
          <button className={progressView === "garden" ? "active" : ""} type="button" onClick={() => setProgressView("garden")} aria-current={progressView === "garden" ? "page" : undefined}><span aria-hidden="true">🌳</span><strong>Jardin</strong><small>Vue d’ensemble</small></button>
          <button className={progressView === "rewards" ? "active" : ""} type="button" onClick={() => setProgressView("rewards")} aria-current={progressView === "rewards" ? "page" : undefined}><span aria-hidden="true">🏆</span><strong>Trophées</strong><small>{unlockedRewards.length}/{REWARDS.length} allumés</small></button>
          <button className={progressView === "milestones" ? "active" : ""} type="button" onClick={() => setProgressView("milestones")} aria-current={progressView === "milestones" ? "page" : undefined}><span aria-hidden="true">✨</span><strong>Repères</strong><small>{reached.length}/{track.milestones.length} atteints</small></button>
        </nav>
      )}

      {track.safety && (!hasPlusAccess || !profile || editing) && (
        <aside className="safety-note" role="note">
          <span className="safety-icon" aria-hidden="true">🫶</span>
          <p><strong>On avance en sécurité</strong>{track.safety}</p>
        </aside>
      )}

      {billingMessage && appView !== "today" && <p className="billing-alert" role="alert">{billingMessage}</p>}

      {founderAccessStartedAt && appView === "progress" && progressView === "garden" ? (
        <aside className="subscriber-banner" role="status">
          <span aria-hidden="true">👑</span>
          <p><strong>ESSOR+ est ouvert.</strong> Accès fondateur permanent sur cet appareil · aucun paiement requis.</p>
          <div className="subscriber-actions"><button type="button" onClick={goToPlus}>Voir mon programme</button></div>
        </aside>
      ) : hasPlusAccess && subscription && appView === "progress" && progressView === "garden" ? (
        <aside className="subscriber-banner" role="status">
          <span aria-hidden="true">👑</span>
          <p><strong>ESSOR+ est ouvert.</strong> {subscriptionStateLabel} · formule {subscription.plan === "annual" ? "annuelle" : "mensuelle"} via {subscription.provider === "google_play" ? "Google Play" : "Stripe"}.</p>
          <div className="subscriber-actions"><button type="button" onClick={goToPlus}>Voir mon programme</button><button type="button" onClick={manageSubscription} disabled={billingBusy}>{billingBusy ? "Ouverture…" : "Gérer ou résilier"}</button></div>
        </aside>
      ) : null}

      {subscription && !hasPlusAccess ? (
        <section className="plus-verifying" id="essor-plus" aria-live="polite">
          <span aria-hidden="true">{subscriptionVerifying ? "✦" : "🔐"}</span>
          <p className="section-label">Activation sécurisée</p>
          <h2>{subscriptionVerifying ? "Stripe vérifie ton abonnement…" : "L’activation n’est pas encore confirmée."}</h2>
          <p>Le programme ne s’ouvre qu’après confirmation directe par Stripe. Aucun simple paramètre d’adresse ne peut débloquer ESSOR+.</p>
          {!subscriptionVerifying && <button className="button primary" type="button" onClick={() => window.location.reload()}>Réessayer la vérification <span aria-hidden="true">↻</span></button>}
        </section>
      ) : !hasPlusAccess ? (
        <SubscriptionOffer
          firstName={personalProfile.firstName}
          isAndroidApp={isAndroidApp}
          playBillingReady={playBillingReady}
          playPrices={playPrices}
          billingBusy={billingBusy}
          onPlayPurchase={startPlayPurchase}
        />
      ) : showForm ? (
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
          {appView === "progress" && progressView === "garden" && (
            <section className="dashboard-card" aria-labelledby="progress-title">
            <div className="dashboard-head">
              <span className="streak-badge">🔥 {progress.days} {progress.days > 1 ? "jours" : "jour"}</span>
              <span className="level-badge">Niveau {level} · Explorateur</span>
              <button
                className="dashboard-share"
                type="button"
                onClick={() => openShare({
                  icon: progress.days >= 30 ? "🌳" : progress.days >= 7 ? "🌿" : "🌱",
                  eyebrow: "Ma victoire",
                  title: progress.days > 0 ? `${progress.days} jour${progress.days > 1 ? "s" : ""} de liberté` : "Mon nouveau départ",
                  detail: `Niveau ${level} · ${xp.toLocaleString("fr-FR")} XP`,
                  days: progress.days,
                })}
              >Partager ma victoire <span aria-hidden="true">↗</span></button>
              <button className="small-link" onClick={openEditor} aria-label="Modifier mon suivi">⚙</button>
            </div>
            {presence && (
              <aside className="presence-card" aria-live="polite">
                <span className="presence-orb" aria-hidden="true"><i /></span>
                <p><strong>{presence.live > 1 ? `${presence.live} personnes sont présentes maintenant` : "Ta présence est allumée maintenant"}</strong><small>{presence.today > 1 ? `${presence.today} personnes ont ouvert ESSOR ces dernières 24 h` : "Tu es la première présence visible de ces dernières 24 h"} · aucun prénom ni parcours partagé</small></p>
                <b aria-hidden="true">🕯️</b>
              </aside>
            )}
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
              <article className="stat-violet"><span aria-hidden="true">🏆</span><div><small>Tes victoires</small><strong>{reached.length}<i>/{track.milestones.length}</i></strong><em>repères atteints · estimation</em></div></article>
            </div>
            </section>
          )}

          {appView === "today" && <>
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
                {checkInSaved && (
                  <button
                    className="share-checkin"
                    type="button"
                    onClick={() => openShare({
                      icon: checkInStatus === "steady" ? "🏆" : checkInStatus === "hard" ? "🌊" : "🤝",
                      eyebrow: "Victoire du jour",
                      title: CHECKIN_LABELS[checkInStatus].title,
                      detail: progress.days > 0 ? `Jour ${progress.days} · je continue mon histoire` : "Mon histoire commence aujourd’hui",
                      days: progress.days,
                    })}
                  >Partager cette victoire <span aria-hidden="true">↗</span></button>
                )}
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

            {(track.safety || billingMessage) && (
              <div className="today-notices">
                {track.safety && <details className="today-safety"><summary><span aria-hidden="true">🫶</span> Repère de sécurité · {track.shortLabel}<i aria-hidden="true">⌄</i></summary><p>{track.safety}</p></details>}
                {billingMessage && <p className="billing-alert compact-alert" role="alert">{billingMessage}</p>}
              </div>
            )}

            <section className="program-card" id="programme-plus" aria-labelledby="program-title">
            <div className="program-topline">
              <span className="program-day">Jour {plusDay}<small>/ 30</small></span>
              <span className="program-status">👑 ESSOR+</span>
            </div>
            <div className="program-heading">
              <span className="program-stage-icon" aria-hidden="true">{plusStage.icon}</span>
              <div>
                <p className="section-label">Étape {PROGRAM_STAGES.indexOf(plusStage) + 1} · jours {plusStage.from} à {plusStage.to}</p>
                <h2 id="program-title">{plusStage.title}</h2>
                <p>{plusStage.copy}</p>
              </div>
            </div>
            <div className="program-track" aria-label={`Jour ${plusDay} sur 30`}><i style={{ width: `${(plusDay / 30) * 100}%` }} /></div>
            <div className={todayMissionDone ? "daily-mission complete" : "daily-mission"}>
              <span className="mission-icon" aria-hidden="true">{todayMissionDone ? "✓" : dailyMission.icon}</span>
              <div><small>La mission qui compte aujourd’hui</small><h3>{todayMissionDone ? "Mission accomplie" : dailyMission.title}</h3><p>{todayMissionDone ? "Tu as ajouté 80 XP à ton histoire. Rien d’autre n’est obligatoire aujourd’hui." : dailyMission.copy}</p></div>
              <button className={todayMissionDone ? "button mission-button done" : "button mission-button"} type="button" onClick={completeDailyMission} disabled={todayMissionDone}>
                {todayMissionDone ? "Fierté gagnée ✨" : "Je l’ai fait · +80 XP"}
              </button>
            </div>
            <div className="stage-row" aria-label="Les quatre étapes du programme">
              {PROGRAM_STAGES.map((item, index) => {
                const current = plusDay >= item.from && plusDay <= item.to;
                const passed = plusDay > item.to;
                return <span className={current ? "current" : passed ? "passed" : ""} key={item.from}><i>{passed ? "✓" : item.icon}</i><b>{index + 1}</b><small>{item.title}</small></span>;
              })}
            </div>
            </section>
          </>}

          {appView === "progress" && progressView === "rewards" && (
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
                    {unlocked && (
                      <button
                        className="reward-share"
                        type="button"
                        onClick={() => openShare({
                          icon: reward.icon,
                          eyebrow: "Médaille allumée",
                          title: reward.title,
                          detail: `${reward.days} jour${reward.days > 1 ? "s" : ""} · une preuve de ma progression`,
                          days: reward.days,
                        })}
                        aria-label={`Partager la médaille ${reward.title}`}
                      >Partager <span aria-hidden="true">↗</span></button>
                    )}
                  </article>
                );
              })}
            </div>
            </section>
          )}

          {appView === "progress" && progressView === "milestones" && <>
            <section className="milestones" aria-labelledby="milestones-title">
            <div className="section-heading">
              <div><p className="section-label">Tes repères</p><h2 id="milestones-title">Les changements qui peuvent apparaître</h2></div>
              <span>{reached.length} réveillé{reached.length > 1 ? "s" : ""}</span>
            </div>
            <div className="milestone-grid">
              {track.milestones.map((item) => {
                const done = progress.hours >= item.hours;
                return (
                  <article className={done ? "milestone done" : "milestone"} key={item.label}>
                    <span className="milestone-icon">{done ? "✨" : item.icon}</span>
                    <div className="milestone-copy"><p>{item.label}</p><h3>{item.title}</h3><span>{item.description}</span></div>
                    {done && <b>Repère atteint</b>}
                  </article>
                );
              })}
            </div>
            {next ? <p className="next-cap">🎯 Prochain repère : <strong>{next.title}</strong> · {next.label} · dans {remainingLabel(next.hours - progress.hours)}</p> : <p className="next-cap complete">🌟 Tous les repères affichés sont atteints. Continue de rayonner.</p>}
            <p className="milestone-caveat">Ces délais sont des repères généraux et non une prédiction médicale individuelle. Ton ressenti peut évoluer autrement.</p>
            </section>

            <section className="settings-strip">
            <p><strong>Ton aventure a commencé le {dateLabel(profile.startDate)}</strong>Tu peux corriger les informations sans perdre les victoires déjà gagnées.</p>
            <div><button className="button ghost" onClick={openEditor}>Modifier</button><button className="delete-link" onClick={removeProfile}>Supprimer</button></div>
            </section>
          </>}
        </>
      )}

      {hasPlusAccess && profile && !editing && appView === "journal" && (
        <section className="journal-section" aria-labelledby="journal-title">
          <div className="journal-hero">
            <span className="journal-orb" aria-hidden="true">📖</span>
            <div><p className="section-label">Ton espace de vérité</p><h2 id="journal-title">Écrire pour déposer.<br /><em>Se relier pour tenir.</em></h2><p>Ton journal est chiffré sur cet appareil avec ton PIN. Le Cercle partage seulement les signes de soutien que tu choisis.</p></div>
          </div>

          <div className="journal-switch" role="tablist" aria-label="Choisir mon espace">
            <button className={journalMode === "private" ? "active" : ""} type="button" role="tab" aria-selected={journalMode === "private"} onClick={() => setJournalMode("private")}><span aria-hidden="true">🔐</span><strong>Mon journal</strong><small>Intime et local</small></button>
            <button className={journalMode === "circle" ? "active" : ""} type="button" role="tab" aria-selected={journalMode === "circle"} onClick={() => { setCircleLoading(true); setCircleStatus(""); setJournalMode("circle"); }}><span aria-hidden="true">🫂</span><strong>Cercle ESSOR</strong><small>Soutien anonyme</small></button>
          </div>

          {journalMode === "private" ? (
            <div className="journal-private">
              <form className="journal-compose" onSubmit={saveJournalEntry}>
                <div className="journal-compose-head"><div><span>{journalEditingId ? "Modifier cette page" : dateLabel(localDate())}</span><h3>{journalEditingId ? "Tes mots peuvent évoluer." : journalPrompt}</h3></div><i aria-hidden="true">✍️</i></div>
                <fieldset className="journal-moods">
                  <legend>Comment tu te sens maintenant ?</legend>
                  <div>{JOURNAL_MOODS.map((mood) => <button className={journalMood === mood.key ? "active" : ""} type="button" key={mood.key} onClick={() => setJournalMood(mood.key)} aria-pressed={journalMood === mood.key}><span aria-hidden="true">{mood.icon}</span>{mood.label}</button>)}</div>
                </fieldset>
                <label className="journal-field"><span>Ce que tu veux déposer</span><textarea value={journalText} onChange={(event) => { setJournalText(event.target.value); setJournalSaved(false); }} maxLength={4000} rows={8} placeholder="Ici, tu peux être honnête sans avoir à être parfait…" /><small>{journalText.length}/4000 · chiffré uniquement sur cet appareil</small></label>
                <label className="journal-field intention"><span>Une intention douce pour demain <small>facultatif</small></span><input value={journalIntention} onChange={(event) => { setJournalIntention(event.target.value); setJournalSaved(false); }} maxLength={600} placeholder="Par exemple : appeler quelqu’un avant que la vague monte…" /></label>
                <div className="journal-actions">
                  {journalEditingId && <button className="button ghost" type="button" onClick={cancelJournalEdit}>Annuler</button>}
                  <button className={journalSaved ? "button primary saved" : "button primary"} type="submit" disabled={!journalText.trim() && !journalIntention.trim()}>{journalSaved ? "Page gardée en sécurité ✓" : journalEditingId ? "Enregistrer les changements" : "Garder cette page 🔐"}</button>
                </div>
                {journalSecurityStatus && <p className="journal-security" role="status"><span aria-hidden="true">🔐</span>{journalSecurityStatus}</p>}
              </form>

              <div className="journal-history">
                <div className="journal-history-head"><div><p className="section-label">Tes pages précédentes</p><h3>{journalEntries.length ? `${journalEntries.length} trace${journalEntries.length > 1 ? "s" : ""} de ton chemin` : "La première page commence ici"}</h3></div><span aria-hidden="true">🕯️</span></div>
                {journalEntries.length ? <div className="journal-entry-list">{journalEntries.map((entry) => {
                  const mood = JOURNAL_MOODS.find((item) => item.key === entry.mood) ?? JOURNAL_MOODS[2];
                  return <article className="journal-entry" key={entry.id}><div className="journal-entry-meta"><span aria-hidden="true">{mood.icon}</span><div><strong>{dateLabel(entry.date)}</strong><small>{mood.label}</small></div><div><button type="button" onClick={() => editJournalEntry(entry)}>Modifier</button><button type="button" onClick={() => deleteJournalEntry(entry)}>Effacer</button></div></div>{entry.text && <p>{entry.text}</p>}{entry.intention && <blockquote><span>Pour la suite</span>{entry.intention}</blockquote>}</article>;
                })}</div> : <div className="journal-empty"><span aria-hidden="true">🌙</span><p><strong>Personne ne lira à ta place.</strong> Écris quelques mots, même désordonnés. Ce journal est là pour porter ce qui pèse.</p></div>}
              </div>
            </div>
          ) : (
            <div className="circle-space">
              <aside className="circle-safety"><span aria-hidden="true">🛟</span><p><strong>Un cercle, pas un réseau social.</strong> Pas de messages privés, pas de coordonnées, pas de substances nommées. Les phrases sont volontairement encadrées pour protéger chacun. En danger ou en crise, utilise l’onglet Aide.</p><button type="button" onClick={() => navigateApp("help")}>Aide immédiate →</button></aside>
              <details className="circle-rules">
                <summary>Règles et confidentialité du Cercle <span aria-hidden="true">⌄</span></summary>
                <div><p><strong>Ce qui est partagé :</strong> un pseudonyme protecteur, une phrase choisie, éventuellement un nombre de jours et les soutiens reçus.</p><p><strong>Protection :</strong> chaque signe peut être retiré par son auteur ou signalé. Trois signalements distincts le masquent automatiquement.</p><p><strong>Durée :</strong> les signes et leurs interactions sont supprimés après 30 jours.</p></div>
              </details>
              <div className="circle-layout">
                <section className="circle-compose">
                  <p className="section-label">Envoyer un signe</p><h3>Qu’aimerais-tu déposer dans le cercle ?</h3><p>Ton prénom, ton avatar et ta dépendance ne sont jamais publiés. ESSOR te donne un pseudonyme protecteur.</p>
                  <div className="circle-message-options" role="radiogroup" aria-label="Choisir un message">{Object.entries(CIRCLE_MESSAGES).map(([key, copy]) => <button className={circleMessageKey === key ? "active" : ""} type="button" role="radio" aria-checked={circleMessageKey === key} key={key} onClick={() => setCircleMessageKey(key)}><span aria-hidden="true">{circleMessageKey === key ? "✓" : "○"}</span>{copy}</button>)}</div>
                  <label className="circle-days"><input type="checkbox" checked={circleShareDays} onChange={(event) => setCircleShareDays(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><i /></span><span><strong>Afficher mon nombre de jours</strong><small>Désactivé par défaut pour préserver ton histoire.</small></span></label>
                  <button className="button primary circle-send" type="button" disabled={circleBusy} onClick={publishCircleMessage}>{circleBusy ? "Envoi…" : "Envoyer anonymement 💜"}</button>
                  {circleStatus && <p className="circle-status" role="status">{circleStatus}</p>}
                </section>
                <section className="circle-feed" aria-live="polite">
                  <div className="circle-feed-head"><div><p className="section-label">Présences récentes</p><h3>Des personnes avancent avec toi.</h3></div><span aria-hidden="true">🫂</span></div>
                  {circleLoading ? <p className="circle-loading">Le cercle se rassemble…</p> : circlePosts.length ? <div className="circle-posts">{circlePosts.map((post) => <article className="circle-post" key={post.id}><div><span className="circle-avatar" aria-hidden="true">🕯️</span><p><strong>{post.alias}{post.mine ? " · toi" : ""}</strong><small>{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(post.createdAt * 1000)}</small></p>{post.days !== null && <em>{post.days} j</em>}</div><blockquote>{CIRCLE_MESSAGES[post.messageKey] ?? "Un signe de soutien."}</blockquote><div className="circle-post-actions"><button className={post.supported ? "supported" : ""} type="button" onClick={() => supportCirclePost(post.id)} disabled={post.mine || post.supported || circleBusy}><span aria-hidden="true">💜</span>{post.mine ? "Ton signe" : post.supported ? "Soutien envoyé" : "Je te soutiens"}<b>{post.supportCount || ""}</b></button><button className="circle-moderate" type="button" onClick={() => post.mine ? deleteCirclePost(post.id) : reportCirclePost(post.id)} disabled={circleBusy}>{post.mine ? "Retirer" : "Signaler"}</button></div></article>)}</div> : <div className="circle-empty"><span aria-hidden="true">🕯️</span><p><strong>Le cercle attend son premier signe.</strong> Tu peux être la présence dont quelqu’un avait besoin aujourd’hui.</p></div>}
                </section>
              </div>
            </div>
          )}
        </section>
      )}

      {hasPlusAccess && profile && !editing && appView === "learn" && (
        <section className="learning-section" aria-labelledby="learning-title">
          <div className="learning-hero">
            <span className="learning-orb" aria-hidden="true">🧠</span>
            <div><p className="section-label">La bibliothèque ESSOR</p><h2 id="learning-title">Comprendre pour reprendre<br /><em>du pouvoir sur la boucle.</em></h2><p>Des repères concrets sur la psychologie du changement, le craving et les méthodes d’autopersuasion. Pas de diagnostic : des outils pour mieux observer et décider.</p></div>
          </div>
          <div className="learning-layout">
            <nav className="learning-topics" aria-label="Choisir un module">
              {(Object.keys(LEARNING_MODULES) as LearnKey[]).map((key) => {
                const topic = LEARNING_MODULES[key];
                return <button className={learnTopic === key ? "active" : ""} type="button" key={key} onClick={() => setLearnTopic(key)} aria-pressed={learnTopic === key}><span aria-hidden="true">{topic.icon}</span><span><strong>{topic.title}</strong><small>{topic.duration}</small></span><i aria-hidden="true">→</i></button>;
              })}
            </nav>
            <article className="learning-article">
              <div className="learning-article-head"><span aria-hidden="true">{selectedLearning.icon}</span><div><small>{selectedLearning.duration} · lecture guidée</small><h3>{selectedLearning.title}</h3></div></div>
              <p className="learning-summary">{selectedLearning.summary}</p>
              <div className="learning-principle"><span aria-hidden="true">✦</span><p><strong>L’idée essentielle</strong>{selectedLearning.principle}</p></div>
              <div className="learning-points">
                {selectedLearning.points.map((point, index) => <section key={point.title}><span>{index + 1}</span><div><h4>{point.title}</h4><p>{point.copy}</p></div></section>)}
              </div>
              <div className="learning-exercise"><span aria-hidden="true">✍️</span><div><small>À essayer maintenant</small><p>{selectedLearning.exercise}</p></div></div>
              <div className="learning-sources"><span>Pour aller plus loin :</span>{selectedLearning.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <i aria-hidden="true">↗</i></a>)}</div>
              <p className="editorial-status">Mise à jour éditoriale : 14 août 2026 · contenu informatif · validation professionnelle indépendante à compléter.</p>
            </article>
          </div>
          <aside className="learning-warning"><span aria-hidden="true">🩺</span><p><strong>Un outil de compréhension, jamais un remplacement du soin.</strong> Si la perte de contrôle, la souffrance, le sevrage ou le danger augmentent, parle à un professionnel. L’onglet Aide reste accessible à tout moment.</p><button type="button" onClick={() => navigateApp("help")}>Voir les aides <span aria-hidden="true">→</span></button></aside>
        </section>
      )}

      {(!hasPlusAccess || !profile || editing || appView === "help") && (
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
          <a href="tel:116006"><span>Aide aux victimes</span><strong>116 006</strong><small>Gratuit · tous les jours · 9 h–20 h</small></a>
          <a href="tel:3919"><span>Violences Femmes Info</span><strong>39 19</strong><small>Écoute et orientation · hors urgence</small></a>
          <a href="tel:3114"><span>Prévention du suicide</span><strong>31 14</strong><small>Gratuit · 24 h/24 · 7 j/7</small></a>
        </div>
        <a className="csapa-link" href="https://www.drogues-info-service.fr/Adresses-utiles" target="_blank" rel="noreferrer">📍 Trouver un CSAPA gratuit et confidentiel près de chez moi <span aria-hidden="true">↗</span></a>
        <p className="source-links">
          Repères issus de sources publiques officielles :
          <a href="https://www.tabac-info-service.fr/" target="_blank" rel="noreferrer">Tabac Info Service</a>,
          <a href="https://www.alcool-info-service.fr/" target="_blank" rel="noreferrer">Alcool Info Service</a> et
          <a href="https://www.drogues-info-service.fr/" target="_blank" rel="noreferrer">Drogues Info Service</a>,
          <a href="https://www.has-sante.fr/jcms/p_3501842/fr/entretien-motivationnel" target="_blank" rel="noreferrer">Haute Autorité de santé</a> et
          <a href="https://www.service-public.fr/particuliers/vosdroits/F33891" target="_blank" rel="noreferrer">Service Public</a>.
        </p>
      </section>
      )}

      {settingsOpen && (
        <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <button className="pause-close" type="button" onClick={() => setSettingsOpen(false)} aria-label="Fermer les réglages">×</button>
            <p className="section-label">Mon espace privé</p>
            <h2 id="settings-title">À ton image, sous ton code.</h2>
            <p className="settings-intro">Ton profil et tes réglages restent uniquement sur cet appareil. Ton journal est chiffré avec ton PIN.</p>

            <form onSubmit={savePersonalSettings} noValidate>
              <div className="settings-profile-row">
                <fieldset className="avatar-fieldset compact-avatars">
                  <legend>Avatar</legend>
                  <div className="avatar-grid">
                    {AVATARS.map((avatar) => (
                      <button
                        className={settingsAvatar === avatar.emoji ? "avatar-option selected" : "avatar-option"}
                        type="button"
                        key={avatar.label}
                        onClick={() => setSettingsAvatar(avatar.emoji)}
                        aria-label={avatar.label}
                        aria-pressed={settingsAvatar === avatar.emoji}
                      >
                        {avatar.emoji}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="field settings-name">
                  <span>Prénom affiché</span>
                  <input value={settingsName} maxLength={24} onChange={(event) => setSettingsName(event.target.value)} />
                </label>
              </div>

              <div className="settings-panel">
                <div className="settings-panel-heading"><span aria-hidden="true">🔐</span><div><strong>Changer mon code PIN</strong><small>Laisse vide pour conserver ton code actuel.</small></div></div>
                <div className="form-row pin-row">
                  <label className="field">
                    <span>Nouveau code</span>
                    <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={settingsPin} onChange={(event) => setSettingsPin(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" />
                  </label>
                  <label className="field">
                    <span>Confirmer</span>
                    <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={settingsPinConfirm} onChange={(event) => setSettingsPinConfirm(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" />
                  </label>
                </div>
              </div>

              <label className="discreet-toggle settings-discreet">
                <input type="checkbox" checked={settingsDiscreet} onChange={(event) => setSettingsDiscreet(event.target.checked)} />
                <span className="toggle-track" aria-hidden="true"><i /></span>
                <span><strong>Mode discret</strong><small>Le titre devient « Mon quotidien » et l’installation utilise une icône neutre.</small></span>
              </label>
              <p className="install-note"><span aria-hidden="true">📱</span><span><strong>Pour une icône déjà installée</strong>Active ce mode, retire le raccourci existant puis ajoute de nouveau l’application à l’écran d’accueil. Si ton téléphone propose d’effacer les données du site, refuse.</span></p>

              {settingsError && <p className="form-error" role="alert">{settingsError}</p>}
              <div className="settings-actions">
                <button className="button ghost" type="button" onClick={lockApp}>🔒 Verrouiller maintenant</button>
                <button className="button primary" type="submit">Enregistrer <span aria-hidden="true">✓</span></button>
              </div>
            </form>

            <div className="privacy-settings-row">
              <div><strong>Comprendre où vont mes données</strong><span>Stockage local, chiffrement du journal, Cercle et paiement expliqués sans jargon.</span></div>
              <button type="button" onClick={() => setPrivacyOpen(true)}>Voir la notice</button>
            </div>

            <div className="danger-zone">
              <div><strong>Repartir de zéro</strong><span>Efface les données locales et tes signes du Cercle, mais ne résilie jamais un abonnement Stripe ou Google Play.</span></div>
              <button className="delete-link" type="button" onClick={resetPrivateSpace}>Tout effacer</button>
            </div>
          </section>
        </div>
      )}

      {privacyOpen && (
        <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPrivacyOpen(false); }}>
          <section className="privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
            <button className="pause-close" type="button" onClick={() => setPrivacyOpen(false)} aria-label="Fermer la notice de confidentialité">×</button>
            <p className="section-label">Notice de confidentialité · version bêta</p>
            <h2 id="privacy-title">Tes données, sans zone d’ombre.</h2>
            <p className="privacy-version">VNHZ Studios · notice mise à jour le {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${PRIVACY_NOTICE_VERSION}T12:00:00`))}</p>
            <div className="privacy-grid">
              <article><span aria-hidden="true">📱</span><div><h3>Sur ton appareil</h3><p>Ton profil, tes parcours, bilans, progression et réglages restent dans le stockage de l’application. Ils ne sont pas envoyés au Cercle.</p></div></article>
              <article><span aria-hidden="true">🔐</span><div><h3>Journal chiffré</h3><p>Les pages libres du journal sont protégées localement par AES-GCM avec une clé dérivée de ton PIN. Le PIN et la clé ne sont jamais envoyés à ESSOR.</p></div></article>
              <article><span aria-hidden="true">🫂</span><div><h3>Cercle ESSOR</h3><p>Seuls ton pseudonyme généré, la phrase encadrée, le nombre de jours facultatif et les soutiens sont partagés. L’identifiant aléatoire est transformé en empreinte avant stockage. Les signes sont supprimés après 30 jours.</p></div></article>
              <article><span aria-hidden="true">🕯️</span><div><h3>Présence anonyme</h3><p>Un identifiant aléatoire distinct, transformé en empreinte, permet seulement d’afficher combien de personnes sont présentes. Aucun prénom ni parcours n’y est associé ; l’empreinte disparaît après 24 h.</p></div></article>
              <article><span aria-hidden="true">💳</span><div><h3>Abonnement</h3><p>Stripe ou Google Play traite le paiement. ESSOR conserve seulement les identifiants et l’état nécessaires pour ouvrir, restaurer, gérer ou résilier ESSOR+. Aucune carte bancaire n’est stockée dans l’application.</p></div></article>
            </div>
            <div className="privacy-control"><strong>Tu gardes le contrôle.</strong><p>« Tout effacer » supprime les données locales, la présence anonyme et tes signes du Cercle, sans résilier l’abonnement. Dans le Cercle, tu peux retirer tes propres signes ou signaler ceux des autres. En réinstallant l’application ou en effaçant ses données, les informations locales non sauvegardées sont perdues.</p></div>
            <div className="privacy-health"><span aria-hidden="true">🩺</span><p><strong>ESSOR accompagne, mais ne diagnostique pas et ne soigne pas.</strong> Les repères sont informatifs. En cas de danger, de sevrage difficile ou de souffrance importante, contacte un professionnel ou utilise l’onglet Aide.</p></div>
            <button className="button primary privacy-close" type="button" onClick={() => setPrivacyOpen(false)}>J’ai compris</button>
          </section>
        </div>
      )}

      {shareAchievement && (
        <div className="share-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeShare(); }}>
          <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
            <button className="pause-close" type="button" onClick={closeShare} aria-label="Fermer le partage">×</button>
            <div className="share-heading">
              <div><p className="section-label">Fais rayonner ta fierté</p><h2 id="share-title">Cette victoire est à toi.<br /><em>Tu peux la montrer.</em></h2></div>
              <span aria-hidden="true">✨</span>
            </div>

            <div className="share-layout">
              <div className="share-card-preview" aria-label="Aperçu de la carte à partager">
                <div className="share-card-brand">🌱 <strong>ESSOR</strong></div>
                <span className="share-card-icon" aria-hidden="true">{shareAchievement.icon}</span>
                <small>{shareAchievement.eyebrow}</small>
                <h3>{shareAchievement.title}</h3>
                <p>{shareAchievement.detail}</p>
                <em>{shareJourney ? `Parcours : ${track.label}` : "Parcours personnel préservé 🔒"}</em>
                <b>Chaque petit pas mérite sa lumière.</b>
              </div>

              <div className="share-controls">
                <label className="share-privacy">
                  <input
                    type="checkbox"
                    checked={shareJourney}
                    onChange={(event) => {
                      setShareJourney(event.target.checked);
                      setShareImage(null);
                      setShareStatus("");
                    }}
                  />
                  <span className="toggle-track" aria-hidden="true"><i /></span>
                  <span><strong>Afficher mon parcours</strong><small>Désactivé par défaut pour ne jamais révéler une dépendance sans le vouloir.</small></span>
                </label>

                <button className="button native-share" type="button" onClick={nativeShare} disabled={!shareImage}>
                  <span aria-hidden="true">📲</span>{shareImage ? "TikTok, Instagram, Snapchat…" : "Préparation de la carte…"}
                </button>
                <button className="button download-card" type="button" onClick={downloadShareCard} disabled={!shareImage}>
                  <span aria-hidden="true">🖼️</span>Télécharger la carte
                </button>

                <p className="social-label">Ou partager directement</p>
                <div className="social-share-grid">
                  <button type="button" onClick={() => openSocialShare("facebook")}><span>f</span>Facebook</button>
                  <button type="button" onClick={() => openSocialShare("x")}><span>𝕏</span>X</button>
                  <button type="button" onClick={() => openSocialShare("reddit")}><span>●</span>Reddit</button>
                  <button type="button" onClick={() => openSocialShare("whatsapp")}><span>☏</span>WhatsApp</button>
                  <button type="button" onClick={() => openSocialShare("bluesky")}><span>🦋</span>Bluesky</button>
                  <button type="button" onClick={() => openSocialShare("telegram")}><span>➤</span>Telegram</button>
                </div>
                <button className="copy-share" type="button" onClick={copyShareText}>📋 Copier le texte et le lien</button>
                <p className="share-tip">Sur téléphone, le premier bouton ouvre les applications installées et joint la carte au format publication verticale.</p>
                <p className="share-status" aria-live="polite">{shareStatus}</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {pauseOpen && (
        <div className="pause-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePause(); }}>
          <section className="pause-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title">
            <button className="pause-close" onClick={closePause} aria-label="Fermer le compagnon ESSOR">×</button>
            <p className="section-label">Compagnon ESSOR · toujours sans jugement</p>

            {companionStep === "menu" && <>
              <div className="companion-avatar" aria-hidden="true">🌱</div>
              <h2 id="pause-title">Je suis là.<br />Qu’est-ce qui se passe ?</h2>
              <p className="companion-bubble">Tu n’as pas besoin de trouver les bons mots. Choisis simplement ce qui ressemble le plus à maintenant.</p>
              <div className="companion-choices">
                <button type="button" onClick={() => setCompanionStep("craving")}><span>🌊</span><strong>J’ai envie maintenant</strong><small>Traverser la vague étape par étape</small></button>
                <button type="button" onClick={() => setCompanionStep("lapse")}><span>🤝</span><strong>J’ai glissé</strong><small>Repartir sans remettre l’histoire à zéro</small></button>
                <button type="button" onClick={() => setCompanionStep("human")}><span>💬</span><strong>J’ai besoin de parler</strong><small>Joindre une vraie personne, anonymement</small></button>
              </div>
            </>}

            {companionStep === "craving" && <>
              <button className="companion-back" type="button" onClick={() => setCompanionStep("menu")}>← Retour</button>
              <h2 id="pause-title">À combien est la vague ?</h2>
              <p className="companion-bubble">Observe seulement l’intensité, sans lutter contre elle.</p>
              <label className="intensity-field"><strong>{companionIntensity}<small>/10</small></strong><input type="range" min="1" max="10" value={companionIntensity} onChange={(event) => setCompanionIntensity(Number(event.target.value))} aria-label="Intensité de l’envie" /></label>
              <fieldset className="trigger-field"><legend>Qu’est-ce qui l’a déclenchée ?</legend><div>{COMPANION_TRIGGERS.map((item) => <button className={companionTrigger === item ? "selected" : ""} type="button" key={item} onClick={() => setCompanionTrigger(item)}>{item}</button>)}</div></fieldset>
              <button className="button primary pause-main" type="button" onClick={startCompanionExercise}>Traverser les 3 prochaines minutes <span aria-hidden="true">→</span></button>
            </>}

            {companionStep === "exercise" && <>
              <h2 id="pause-title">Tu n’as rien à décider<br />pendant trois minutes.</h2>
              <div className={pauseRunning && pauseSeconds > 0 ? "breath-orb running" : "breath-orb"}>
                <strong>{String(Math.floor(pauseSeconds / 60)).padStart(2, "0")}:{String(pauseSeconds % 60).padStart(2, "0")}</strong>
                <span>{pauseSeconds === 0 ? "Tu as créé de la distance." : pauseRunning ? "Inspire… expire…" : "Reste avec moi."}</span>
              </div>
              <div className="pause-actions-list">
                <span>1</span><p><strong>Change de pièce.</strong> Déplace ton corps pour casser l’automatisme.</p>
                <span>2</span><p><strong>Bois un verre d’eau.</strong> Lentement, sans faire autre chose.</p>
                <span>3</span><p><strong>Préviens quelqu’un.</strong> « C’est difficile là, parle-moi deux minutes. »</p>
              </div>
              {pauseSeconds > 0 ? <button className="button primary pause-main" type="button" onClick={() => setPauseRunning((value) => !value)}>{pauseRunning ? "Mettre en pause" : "Reprendre"}<span aria-hidden="true">{pauseRunning ? "Ⅱ" : "→"}</span></button> : <button className="button primary pause-main" type="button" onClick={() => setCompanionStep("recheck")}>Voir où en est la vague <span aria-hidden="true">→</span></button>}
            </>}

            {companionStep === "recheck" && <>
              <h2 id="pause-title">Et maintenant,<br />elle est à combien ?</h2>
              <label className="intensity-field"><strong>{companionRecheck}<small>/10</small></strong><input type="range" min="1" max="10" value={companionRecheck} onChange={(event) => setCompanionRecheck(Number(event.target.value))} aria-label="Nouvelle intensité de l’envie" /></label>
              {companionRecheck >= 8 ? <div className="companion-safety"><strong>Cette vague reste très forte.</strong><p>Ne reste pas seul : appelle quelqu’un maintenant ou choisis l’aide professionnelle.</p><button className="button primary" type="button" onClick={() => setCompanionStep("human")}>Parler à quelqu’un</button></div> : <><p className="companion-bubble">Même si elle n’a pas disparu, tu as repris de l’espace. C’est une vraie victoire.</p><button className="button primary pause-main" type="button" onClick={completeCompanionSession}>Gagner 70 XP pour cette traversée ✨</button></>}
            </>}

            {companionStep === "lapse" && <>
              <button className="companion-back" type="button" onClick={() => setCompanionStep("menu")}>← Retour</button>
              <div className="companion-avatar" aria-hidden="true">🤝</div>
              <h2 id="pause-title">Tu n’as pas perdu<br />tout le chemin.</h2>
              <p className="companion-bubble">Un écart est une information, pas une condamnation. Pour les prochaines 24 heures, choisis un seul geste.</p>
              <div className="companion-plan"><button type="button" onClick={completeCompanionSession}>💧 J’éloigne le produit et je bois de l’eau</button><button type="button" onClick={completeCompanionSession}>📞 Je préviens une personne de confiance</button><button type="button" onClick={() => setCompanionStep("human")}>🫶 Je demande une aide professionnelle</button></div>
            </>}

            {companionStep === "human" && <>
              <button className="companion-back" type="button" onClick={() => setCompanionStep("menu")}>← Retour</button>
              <div className="companion-avatar" aria-hidden="true">💜</div>
              <h2 id="pause-title">Une vraie personne<br />peut prendre le relais.</h2>
              <p className="companion-bubble">Ces services sont anonymes et sans jugement. ESSOR ne remplace jamais un professionnel ou les urgences.</p>
              <div className="human-support-links"><a href="https://www.drogues-info-service.fr/" target="_blank" rel="noreferrer">💬 Chat Drogues Info Service <span>↗</span></a><a href="tel:0800231313">📞 Drogues Info Service <strong>0 800 23 13 13</strong></a><a href="tel:3114">💜 Prévention du suicide <strong>31 14</strong></a></div>
            </>}

            {companionStep === "complete" && <>
              <div className="companion-avatar success" aria-hidden="true">✨</div>
              <h2 id="pause-title">Tu viens de choisir<br />la suite de ton histoire.</h2>
              <p className="companion-bubble">+70 XP ajoutés. Ton arbre se souviendra de ce moment, même si personne d’autre ne l’a vu.</p>
              <button className="button primary pause-main" type="button" onClick={closePause}>Revenir à mon suivi <span aria-hidden="true">✓</span></button>
            </>}

            <p className="pause-help">Danger immédiat : <a href="tel:15">15</a> ou <a href="tel:112">112</a>. Idées suicidaires : <a href="tel:3114">3114</a>.</p>
          </section>
        </div>
      )}

      <button className="companion-fab" type="button" onClick={openPause}><span aria-hidden="true">🌱</span><span><strong>Parler à ESSOR</strong><small>Je suis là maintenant</small></span></button>

      <footer><span className="brand footer-brand"><span aria-hidden="true">🌱</span><span className="brand-name">ESSOR</span></span><p>Ton progrès est réel. Ta fierté aussi.<br />Un soutien, jamais un jugement.</p><a className="footer-privacy" href="/confidentialite">Confidentialité et données</a></footer>
    </main>
  );
}
