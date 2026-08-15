"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./community.module.css";

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

type StoryStage = "first_days" | "first_week" | "first_month" | "month_2_3" | "later" | "restart";
type ReactionKey = "helped" | "relate" | "strength" | "thanks";

type Story = {
  id: string;
  alias: string;
  stage: StoryStage;
  context: string;
  hardMoment: string;
  helped: string;
  message: string;
  days: number | null;
  createdAt: number;
  reactions: Record<ReactionKey, number>;
  reactionCount: number;
  myReaction: ReactionKey | null;
  mine: boolean;
};

const MEMBER_KEY = "essor:circle-member:v1";
const PRESENCE_KEY = "essor:presence-session:v1";

const CIRCLE_MESSAGES: Record<string, string> = {
  still_here: "Aujourd’hui était difficile, mais je suis encore là.",
  crossed_wave: "J’ai traversé une envie sans lui obéir.",
  restart: "Je recommence sans effacer mes progrès.",
  one_more_day: "Je célèbre une journée de plus.",
  asked_help: "J’ai demandé de l’aide aujourd’hui.",
  not_alone: "À la personne qui lit ceci : tu n’es pas seul·e.",
};

const STAGES: Array<{ key: StoryStage; label: string; short: string }> = [
  { key: "first_days", label: "Mes premiers jours", short: "Premiers jours" },
  { key: "first_week", label: "Ma première semaine", short: "1re semaine" },
  { key: "first_month", label: "Mon premier mois", short: "1er mois" },
  { key: "month_2_3", label: "Entre 1 et 3 mois", short: "1–3 mois" },
  { key: "later", label: "Plus loin sur le chemin", short: "Après 3 mois" },
  { key: "restart", label: "Je reprends après un écart", short: "Reprise" },
];

const REACTIONS: Array<{ key: ReactionKey; icon: string; label: string }> = [
  { key: "helped", icon: "💜", label: "Ça m’aide" },
  { key: "relate", icon: "🪞", label: "Je me reconnais" },
  { key: "strength", icon: "🫶", label: "Force à toi" },
  { key: "thanks", icon: "✨", label: "Merci" },
];

function readOrCreate(key: string) {
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

function relativeDate(timestamp: number) {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (seconds < 60) return "à l’instant";
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `il y a ${Math.floor(seconds / 3600)} h`;
  const days = Math.floor(seconds / 86_400);
  return days === 1 ? "hier" : `il y a ${days} j`;
}

function stageLabel(key: StoryStage) {
  return STAGES.find((stage) => stage.key === key)?.short ?? "Sur le chemin";
}

export default function CommunityClient() {
  const [tab, setTab] = useState<"stories" | "signals">("stories");
  const [memberId, setMemberId] = useState("");
  const [presence, setPresence] = useState<{ live: number; today: number } | null>(null);

  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storyBusy, setStoryBusy] = useState(false);
  const [storyStatus, setStoryStatus] = useState("");
  const [stage, setStage] = useState<StoryStage>("first_week");
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [context, setContext] = useState("");
  const [hardMoment, setHardMoment] = useState("");
  const [helped, setHelped] = useState("");
  const [message, setMessage] = useState("");
  const [shareDays, setShareDays] = useState(false);
  const [days, setDays] = useState("");

  const [posts, setPosts] = useState<CirclePost[]>([]);
  const [circleLoading, setCircleLoading] = useState(true);
  const [circleBusy, setCircleBusy] = useState(false);
  const [circleStatus, setCircleStatus] = useState("");
  const [messageKey, setMessageKey] = useState("still_here");
  const [circleShareDays, setCircleShareDays] = useState(false);
  const [circleDays, setCircleDays] = useState("");

  useEffect(() => {
    const id = readOrCreate(MEMBER_KEY);
    const presenceId = readOrCreate(PRESENCE_KEY);
    setMemberId(id);

    let stopped = false;
    const heartbeat = async () => {
      try {
        const response = await fetch("/api/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "heartbeat", sessionId: presenceId }),
        });
        if (!response.ok) return;
        const result = await response.json() as { live?: number; today?: number };
        if (!stopped) setPresence({ live: Number(result.live) || 1, today: Number(result.today) || 1 });
      } catch {}
    };
    void heartbeat();
    const timer = window.setInterval(heartbeat, 120_000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, []);

  const loadStories = useCallback(async () => {
    if (!memberId) return;
    setStoriesLoading(true);
    try {
      const response = await fetch(`/api/stories?member=${encodeURIComponent(memberId)}&stage=${encodeURIComponent(stage)}`, { cache: "no-store" });
      const result = await response.json() as { stories?: Story[]; stageCounts?: Record<string, number> };
      if (!response.ok) throw new Error("stories_failed");
      setStories(result.stories ?? []);
      setStageCounts(result.stageCounts ?? {});
    } catch {
      setStoryStatus("Les histoires ne sont pas disponibles pour le moment.");
    } finally {
      setStoriesLoading(false);
    }
  }, [memberId, stage]);

  const loadCircle = useCallback(async () => {
    if (!memberId) return;
    setCircleLoading(true);
    try {
      const response = await fetch(`/api/circle?member=${encodeURIComponent(memberId)}`, { cache: "no-store" });
      const result = await response.json() as { posts?: CirclePost[] };
      if (!response.ok) throw new Error("circle_failed");
      setPosts(result.posts ?? []);
    } catch {
      setCircleStatus("Le Cercle n’est pas disponible pour le moment.");
    } finally {
      setCircleLoading(false);
    }
  }, [memberId]);

  useEffect(() => { void loadStories(); }, [loadStories]);
  useEffect(() => { void loadCircle(); }, [loadCircle]);

  const stageCount = stageCounts[stage] ?? 0;
  const unsupported = useMemo(() => stories.filter((story) => !story.mine && story.reactionCount === 0).length, [stories]);

  async function publishStory(event: FormEvent) {
    event.preventDefault();
    if (!memberId || storyBusy) return;
    if ([context, hardMoment, helped, message].some((value) => value.trim().length < 8)) {
      setStoryStatus("Complète les quatre étapes avec quelques mots pour que ton histoire garde du sens.");
      return;
    }
    setStoryBusy(true);
    setStoryStatus("");
    try {
      const numericDays = shareDays && /^\d{1,4}$/.test(days) ? Number(days) : null;
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish", memberId, stage, context, hardMoment, helped, message, days: numericDays }),
      });
      const result = await response.json() as { story?: Story; error?: string };
      if (!response.ok || !result.story) {
        setStoryStatus(result.error === "contact_not_allowed"
          ? "Pour protéger ton anonymat, retire les liens, adresses, numéros ou identifiants sociaux."
          : result.error === "rate_limited"
            ? "Deux histoires maximum par jour : laisse maintenant de la place aux autres voix."
            : "Ton histoire n’a pas pu être publiée.");
        return;
      }
      setStories((current) => [result.story!, ...current]);
      setStageCounts((current) => ({ ...current, [stage]: (current[stage] ?? 0) + 1 }));
      setContext(""); setHardMoment(""); setHelped(""); setMessage(""); setDays(""); setShareDays(false);
      setStoryStatus("Ton histoire est publiée sous un pseudonyme protecteur. Merci d’avoir laissé une trace utile.");
    } catch {
      setStoryStatus("Ton histoire n’a pas pu être publiée pour le moment.");
    } finally {
      setStoryBusy(false);
    }
  }

  async function reactStory(story: Story, reaction: ReactionKey) {
    if (!memberId || storyBusy || story.mine) return;
    setStoryBusy(true);
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "react", memberId, storyId: story.id, reaction }),
      });
      const result = await response.json() as { reactions?: Record<ReactionKey, number>; reactionCount?: number; myReaction?: ReactionKey };
      if (!response.ok) throw new Error("reaction_failed");
      setStories((current) => current.map((item) => item.id === story.id ? {
        ...item,
        reactions: result.reactions ?? item.reactions,
        reactionCount: result.reactionCount ?? item.reactionCount,
        myReaction: result.myReaction ?? reaction,
      } : item));
    } catch {
      setStoryStatus("Le soutien n’a pas pu partir. Réessaie dans un instant.");
    } finally {
      setStoryBusy(false);
    }
  }

  async function moderateStory(story: Story) {
    if (!memberId || storyBusy) return;
    const action = story.mine ? "delete" : "report";
    if (!window.confirm(story.mine ? "Retirer définitivement cette histoire ?" : "Masquer et signaler cette histoire ?")) return;
    setStoryBusy(true);
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, memberId, storyId: story.id }),
      });
      if (!response.ok) throw new Error("moderation_failed");
      setStories((current) => current.filter((item) => item.id !== story.id));
      setStoryStatus(story.mine ? "Ton histoire a été retirée." : "Merci. L’histoire est masquée et le signalement enregistré.");
    } catch {
      setStoryStatus("Cette action n’a pas pu être enregistrée.");
    } finally {
      setStoryBusy(false);
    }
  }

  async function publishSignal() {
    if (!memberId || circleBusy) return;
    setCircleBusy(true);
    setCircleStatus("");
    try {
      const numericDays = circleShareDays && /^\d{1,4}$/.test(circleDays) ? Number(circleDays) : null;
      const response = await fetch("/api/circle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish", memberId, messageKey, days: numericDays }),
      });
      const result = await response.json() as { post?: CirclePost; error?: string };
      if (!response.ok || !result.post) {
        setCircleStatus(result.error === "rate_limited" ? "Tu as déjà envoyé plusieurs signes aujourd’hui." : "Le signe n’a pas pu partir.");
        return;
      }
      setPosts((current) => [result.post!, ...current]);
      setCircleDays(""); setCircleShareDays(false);
      setCircleStatus("Ton signe est parti dans le Cercle.");
    } catch {
      setCircleStatus("Le Cercle n’est pas disponible pour le moment.");
    } finally {
      setCircleBusy(false);
    }
  }

  async function supportSignal(post: CirclePost) {
    if (!memberId || circleBusy || post.mine || post.supported) return;
    setCircleBusy(true);
    try {
      const response = await fetch("/api/circle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "support", memberId, postId: post.id }),
      });
      const result = await response.json() as { supportCount?: number; supported?: boolean };
      if (!response.ok) throw new Error("support_failed");
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, supportCount: result.supportCount ?? item.supportCount, supported: true } : item));
    } catch {
      setCircleStatus("Le soutien n’a pas pu partir.");
    } finally {
      setCircleBusy(false);
    }
  }

  async function moderateSignal(post: CirclePost) {
    if (!memberId || circleBusy) return;
    const action = post.mine ? "delete" : "report";
    if (!window.confirm(post.mine ? "Retirer définitivement ton signe ?" : "Masquer et signaler ce signe ?")) return;
    setCircleBusy(true);
    try {
      const response = await fetch("/api/circle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, memberId, postId: post.id }),
      });
      if (!response.ok) throw new Error("moderation_failed");
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch {
      setCircleStatus("Cette action n’a pas pu être enregistrée.");
    } finally {
      setCircleBusy(false);
    }
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}><span aria-hidden="true">🌱</span><strong>ESSOR</strong></a>
        <a href="/" className={styles.back}>Mon espace <span aria-hidden="true">→</span></a>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>COMMUNAUTÉ ESSOR · GRATUITE</span>
        <h1>Personne ne devrait<br />tenir seul.</h1>
        <p>Ici, pas de followers, pas de messages privés et pas de concours de perfection. Des personnes à différentes étapes laissent une trace, puis se répondent par du soutien.</p>
        {presence && <div className={styles.presence}><i /><strong>{presence.live} présent{presence.live > 1 ? "s" : ""} maintenant</strong><span>{presence.today} passage{presence.today > 1 ? "s" : ""} ces dernières 24 h · comptage anonyme</span></div>}
      </section>

      <nav className={styles.tabs} aria-label="Choisir un espace communautaire">
        <button className={tab === "stories" ? styles.activeTab : ""} onClick={() => setTab("stories")}><span>📚</span><strong>Histoires</strong><small>Comprendre et transmettre</small></button>
        <button className={tab === "signals" ? styles.activeTab : ""} onClick={() => setTab("signals")}><span>🕯️</span><strong>Signes</strong><small>Un soutien en quelques secondes</small></button>
      </nav>

      <aside className={styles.safety}><span>🛟</span><p><strong>Un espace de soutien, pas un lieu de soin.</strong> Ne partage pas de coordonnées ni de conseil médical. Si tu es en danger ou si un sevrage devient difficile, utilise <a href="/#aide">les aides ESSOR</a> ou contacte un professionnel.</p></aside>

      {tab === "stories" ? (
        <>
          <section className={styles.stageBar}>
            <div><span>Voir d’abord les personnes</span><strong>à mon étape</strong></div>
            <select value={stage} onChange={(event) => setStage(event.target.value as StoryStage)}>{STAGES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
            <p><b>{stageCount}</b> histoire{stageCount > 1 ? "s" : ""} actuellement à cette étape{unsupported > 0 ? ` · ${unsupported} attend${unsupported > 1 ? "ent" : ""} encore un premier soutien` : ""}</p>
          </section>

          <div className={styles.columns}>
            <form className={styles.compose} onSubmit={publishStory}>
              <span className={styles.eyebrow}>LAISSER UNE TRACE</span>
              <h2>Raconte ce qui peut aider quelqu’un.</h2>
              <p>Quatre petites étapes. Pas besoin d’écrire parfaitement.</p>

              <label><span><b>1</b> Où j’en étais</span><textarea rows={3} maxLength={500} value={context} onChange={(event) => setContext(event.target.value)} placeholder="Le contexte, ce que tu ressentais, ce qui prenait trop de place…" /><small>{context.length}/500</small></label>
              <label><span><b>2</b> Le moment difficile</span><textarea rows={3} maxLength={500} value={hardMoment} onChange={(event) => setHardMoment(event.target.value)} placeholder="La situation, l’émotion ou le déclencheur qui t’a mis à l’épreuve…" /><small>{hardMoment.length}/500</small></label>
              <label><span><b>3</b> Ce qui m’a aidé</span><textarea rows={3} maxLength={500} value={helped} onChange={(event) => setHelped(event.target.value)} placeholder="Une action, une personne, un changement de contexte, quelques minutes gagnées…" /><small>{helped.length}/500</small></label>
              <label><span><b>4</b> Ce que je dirais à quelqu’un ici</span><textarea rows={3} maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="La phrase que tu aurais aimé lire à cette étape…" /><small>{message.length}/500</small></label>

              <label className={styles.stageField}><span>Étape de l’histoire</span><select value={stage} onChange={(event) => setStage(event.target.value as StoryStage)}>{STAGES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
              <label className={styles.check}><input type="checkbox" checked={shareDays} onChange={(event) => setShareDays(event.target.checked)} /><span>Afficher aussi un nombre de jours <em>facultatif</em></span></label>
              {shareDays && <input className={styles.daysInput} inputMode="numeric" maxLength={4} value={days} onChange={(event) => setDays(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Ex. 12" aria-label="Nombre de jours" />}

              <button className={styles.primary} disabled={storyBusy}>{storyBusy ? "Publication…" : "Publier anonymement"} <span>→</span></button>
              <small className={styles.formNote}>Ton pseudonyme est généré automatiquement. Les liens, e-mails, numéros et identifiants sociaux sont refusés.</small>
              {storyStatus && <p className={styles.status} role="status">{storyStatus}</p>}
            </form>

            <section className={styles.feed} aria-live="polite">
              <div className={styles.feedHead}><div><span className={styles.eyebrow}>À TON ÉTAPE</span><h2>Des histoires avant des conseils.</h2></div><button onClick={() => void loadStories()} disabled={storiesLoading}>↻</button></div>
              {storiesLoading ? <div className={styles.empty}>Les histoires se rassemblent…</div> : stories.length ? stories.map((story) => (
                <article className={story.reactionCount === 0 && !story.mine ? `${styles.story} ${styles.awaiting}` : styles.story} key={story.id}>
                  <header><div className={styles.avatar}>🕯️</div><div><strong>{story.alias}{story.mine ? " · toi" : ""}</strong><small>{stageLabel(story.stage)} · {relativeDate(story.createdAt)}</small></div>{story.days !== null && <em>{story.days} j</em>}</header>
                  {story.reactionCount === 0 && !story.mine && <span className={styles.firstSupport}>Tu peux être son premier soutien</span>}
                  <div className={styles.storyPart}><span>Où j’en étais</span><p>{story.context}</p></div>
                  <div className={styles.storyPart}><span>Le moment difficile</span><p>{story.hardMoment}</p></div>
                  <div className={styles.storyPart}><span>Ce qui m’a aidé</span><p>{story.helped}</p></div>
                  <blockquote><span>À quelqu’un à cette étape</span>{story.message}</blockquote>
                  <div className={styles.reactions}>{REACTIONS.map((reaction) => <button key={reaction.key} className={story.myReaction === reaction.key ? styles.reacted : ""} disabled={story.mine || storyBusy} onClick={() => reactStory(story, reaction.key)}><span>{reaction.icon}</span>{reaction.label}<b>{story.reactions[reaction.key] || ""}</b></button>)}</div>
                  <footer><span>{story.reactionCount ? `${story.reactionCount} signe${story.reactionCount > 1 ? "s" : ""} de soutien` : "Aucun score de popularité · juste du soutien"}</span><button onClick={() => moderateStory(story)} disabled={storyBusy}>{story.mine ? "Retirer" : "Signaler"}</button></footer>
                </article>
              )) : <div className={styles.empty}><span>📚</span><strong>Aucune histoire à afficher pour le moment.</strong><p>La première n’a pas besoin d’être spectaculaire. Elle doit seulement être vraie et utile.</p></div>}
            </section>
          </div>
        </>
      ) : (
        <div className={styles.columns}>
          <section className={styles.compose}>
            <span className={styles.eyebrow}>ENVOYER UN SIGNE</span><h2>Parfois, une phrase suffit.</h2><p>Choisis une phrase encadrée. Aucun texte libre, aucune coordonnée.</p>
            <div className={styles.signalOptions}>{Object.entries(CIRCLE_MESSAGES).map(([key, copy]) => <button className={messageKey === key ? styles.selectedSignal : ""} key={key} onClick={() => setMessageKey(key)}><span>{messageKey === key ? "✓" : "○"}</span>{copy}</button>)}</div>
            <label className={styles.check}><input type="checkbox" checked={circleShareDays} onChange={(event) => setCircleShareDays(event.target.checked)} /><span>Afficher un nombre de jours <em>facultatif</em></span></label>
            {circleShareDays && <input className={styles.daysInput} inputMode="numeric" maxLength={4} value={circleDays} onChange={(event) => setCircleDays(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Ex. 7" aria-label="Nombre de jours" />}
            <button className={styles.primary} disabled={circleBusy} onClick={publishSignal}>{circleBusy ? "Envoi…" : "Envoyer mon signe"} <span>💜</span></button>
            {circleStatus && <p className={styles.status}>{circleStatus}</p>}
          </section>

          <section className={styles.feed}>
            <div className={styles.feedHead}><div><span className={styles.eyebrow}>LE CERCLE</span><h2>Quelques secondes pour dire : je te vois.</h2></div><button onClick={() => void loadCircle()} disabled={circleLoading}>↻</button></div>
            {circleLoading ? <div className={styles.empty}>Le Cercle se rassemble…</div> : posts.length ? <div className={styles.signals}>{posts.map((post) => <article className={styles.signal} key={post.id}><header><div className={styles.avatar}>🕯️</div><div><strong>{post.alias}{post.mine ? " · toi" : ""}</strong><small>{relativeDate(post.createdAt)}</small></div>{post.days !== null && <em>{post.days} j</em>}</header><blockquote>{CIRCLE_MESSAGES[post.messageKey] ?? "Un signe de soutien."}</blockquote><footer><button className={post.supported ? styles.reacted : ""} disabled={post.mine || post.supported || circleBusy} onClick={() => supportSignal(post)}>💜 {post.mine ? "Ton signe" : post.supported ? "Soutien envoyé" : "Je te soutiens"} <b>{post.supportCount || ""}</b></button><button onClick={() => moderateSignal(post)}>{post.mine ? "Retirer" : "Signaler"}</button></footer></article>)}</div> : <div className={styles.empty}><span>🕯️</span><strong>Le Cercle attend son premier signe.</strong><p>Tu peux être la présence dont quelqu’un avait besoin aujourd’hui.</p></div>}
          </section>
        </div>
      )}

      <section className={styles.plusBridge}><span>🌳</span><div><small>La communauté reste gratuite</small><h2>ESSOR+ paie la profondeur, pas le droit de ne pas être seul.</h2><p>Programme guidé, compagnon anti-craving, analyses, journal chiffré, bibliothèque, progression avancée et agenda.</p></div><a href="/#essor-plus">Découvrir ESSOR+ →</a></section>

      <footer className={styles.pageFooter}><a href="/confidentialite">Confidentialité</a><span>·</span><span>Pas de publicité ciblée · pas de messagerie privée</span></footer>
    </main>
  );
}
