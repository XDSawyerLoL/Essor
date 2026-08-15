import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string, label: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`[ESSOR V2] Bloc introuvable: ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

function replaceBetween(source: string, start: string, end: string, replacement: string, label: string) {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`[ESSOR V2] Début introuvable: ${label}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0) throw new Error(`[ESSOR V2] Fin introuvable: ${label}`);
  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
}

const NEW_KEYS = `  | "opioides"
  | "benzodiazepines"
  | "stimulants"
  | "cannabinoides_synth"
  | "cathinones"
  | "cafeine"
  | "hallucinogenes"
  | "mdma"
  | "ketamine"
  | "inhalants"
  | "medicaments"
  | "polyconsommation"
  | "pornographie"
  | "travail"
  | "sport_compulsif"
  | "sodas"
  | "autre"`;

const TRACK_HELPER = `function makeNeutralTrack(config: Omit<Track, "milestones"> & { milestoneIcon?: string }): Track {
  const { milestoneIcon = "🧭", ...base } = config;
  return {
    ...base,
    milestones: [
      { hours: 24, label: "24 h", title: "Un premier pas", description: "Tu crées une première distance et tu observes ce qui déclenche l’automatisme.", icon: milestoneIcon },
      { hours: 72, label: "3 jours", title: "Repérer les déclencheurs", description: "Les moments, émotions et contextes à risque deviennent plus faciles à identifier.", icon: "🔎" },
      { hours: 24 * 7, label: "1 sem.", title: "Une semaine de recul", description: "Tu disposes d’une semaine complète pour voir ce qui t’aide vraiment.", icon: "🌱" },
      { hours: 24 * 14, label: "2 sem.", title: "Renforcer tes protections", description: "Tes réponses préparées commencent à devenir plus familières.", icon: "🛡️" },
      { hours: 24 * 30, label: "1 mois", title: "Un mois de choix", description: "Ton objectif a traversé un mois entier avec davantage de décisions conscientes.", icon: "🧭" },
      { hours: 24 * 90, label: "3 mois", title: "Consolider", description: "Tu connais mieux tes déclencheurs, tes appuis et les limites qui fonctionnent pour toi.", icon: "🌿" },
      { hours: 24 * 365, label: "1 an", title: "Une année construite", description: "Une année de choix différents représente une preuve concrète de ton chemin.", icon: "🏆" },
    ],
  };
}

`;

const NEW_TRACKS = `  opioides: makeNeutralTrack({
    label: "Opioïdes",
    shortLabel: "Opioïdes",
    icon: "💊",
    accent: "#8bb8ff",
    accentSoft: "#26334a",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi opioïdes",
    formCopy: "Héroïne ou médicaments opioïdes : rends visibles tes prises évitées, tes déclencheurs et les protections qui t’aident.",
    safety: "Pour les opioïdes, fais-toi accompagner médicalement, surtout après une période d’arrêt : la tolérance peut diminuer et le risque de surdose augmenter. Drogues Info Service : 0 800 23 13 13. Danger immédiat : 15 ou 112.",
    milestoneIcon: "🩺",
  }),
  benzodiazepines: makeNeutralTrack({
    label: "Benzodiazépines / somnifères",
    shortLabel: "Benzos",
    icon: "💤",
    accent: "#9d9cff",
    accentSoft: "#2c2b48",
    unit: "prise",
    units: "prises",
    startLabel: "Date de début de réduction",
    formTitle: "Configure ton suivi benzodiazépines",
    formCopy: "Suis uniquement un objectif défini avec un professionnel lorsque le traitement est prescrit.",
    safety: "Après un usage régulier, un arrêt brutal de benzodiazépines peut être dangereux. Ne modifie pas seul un traitement prescrit : demande un avis médical ou pharmaceutique.",
    milestoneIcon: "🩺",
  }),
  stimulants: makeNeutralTrack({
    label: "Amphétamines / méthamphétamine",
    shortLabel: "Stimulants",
    icon: "⚡",
    accent: "#ffd166",
    accentSoft: "#3a3322",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi stimulants",
    formCopy: "Rends visibles les prises évitées, les contextes à risque et les moments où tu as besoin d’un appui humain.",
    safety: "Fatigue, anxiété ou chute de l’humeur peuvent rendre l’arrêt difficile. Drogues Info Service : 0 800 23 13 13. Si tu te sens en danger ou as des idées suicidaires : 3114, 15 ou 112.",
    milestoneIcon: "🧠",
  }),
  cannabinoides_synth: makeNeutralTrack({
    label: "Cannabinoïdes de synthèse",
    shortLabel: "Cannabinoïdes synth.",
    icon: "🧪",
    accent: "#64d6a2",
    accentSoft: "#233b33",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt",
    formTitle: "Configure ton suivi cannabinoïdes de synthèse",
    formCopy: "Ces produits peuvent être très variables : le suivi ne remplace jamais un avis médical en cas de symptômes inhabituels.",
    safety: "En cas de malaise, confusion importante, convulsions, douleur thoracique ou difficulté à respirer, appelle le 15 ou le 112. Drogues Info Service : 0 800 23 13 13.",
    milestoneIcon: "⚠️",
  }),
  cathinones: makeNeutralTrack({
    label: "Cathinones / 3-MMC et apparentés",
    shortLabel: "Cathinones",
    icon: "⚗️",
    accent: "#ff9f7a",
    accentSoft: "#3e2d29",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi cathinones",
    formCopy: "Suis les prises évitées et les déclencheurs sans supposer que deux produits portant le même nom ont la même composition.",
    safety: "Si tu as des symptômes physiques ou psychiques inquiétants, appelle le 15 ou le 112. Pour parler de ta consommation : Drogues Info Service au 0 800 23 13 13.",
    milestoneIcon: "⚠️",
  }),
  cafeine: makeNeutralTrack({
    label: "Caféine / boissons énergisantes",
    shortLabel: "Caféine",
    icon: "☕",
    accent: "#d8a56d",
    accentSoft: "#3b3027",
    unit: "dose",
    units: "doses",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif caféine",
    formCopy: "Café, thé, sodas caféinés ou boissons énergisantes : suis une réduction réaliste et ton ressenti.",
    safety: "Si la réduction provoque des symptômes gênants ou si tu as une maladie cardiovasculaire, une grossesse ou un traitement, demande conseil à un professionnel de santé.",
    milestoneIcon: "☕",
  }),
  hallucinogenes: makeNeutralTrack({
    label: "Hallucinogènes",
    shortLabel: "Hallucinogènes",
    icon: "🌀",
    accent: "#b58cff",
    accentSoft: "#322845",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt",
    formTitle: "Configure ton suivi hallucinogènes",
    formCopy: "Rends visibles les contextes, les prises évitées et les raisons qui te poussent à changer.",
    safety: "Si tu présentes une confusion persistante, une agitation extrême ou te sens en danger, appelle le 15 ou le 112. Drogues Info Service : 0 800 23 13 13.",
    milestoneIcon: "🧠",
  }),
  mdma: makeNeutralTrack({
    label: "MDMA / ecstasy",
    shortLabel: "MDMA",
    icon: "💎",
    accent: "#ff7fc8",
    accentSoft: "#3c2740",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi MDMA",
    formCopy: "Soirées, contexte social ou recherche d’intensité : observe ce qui déclenche l’envie et ce qui t’aide à décider autrement.",
    safety: "En cas de forte fièvre, confusion, convulsions, douleur thoracique ou malaise important, appelle immédiatement le 15 ou le 112. Drogues Info Service : 0 800 23 13 13.",
    milestoneIcon: "🫶",
  }),
  ketamine: makeNeutralTrack({
    label: "Kétamine / dissociatifs",
    shortLabel: "Kétamine",
    icon: "🧊",
    accent: "#79d2ff",
    accentSoft: "#253747",
    unit: "prise",
    units: "prises",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi kétamine",
    formCopy: "Suis les prises évitées et les situations qui favorisent la perte de contrôle.",
    safety: "Des douleurs urinaires, du sang dans les urines, une confusion importante ou tout symptôme inquiétant nécessitent un avis médical. Drogues Info Service : 0 800 23 13 13.",
    milestoneIcon: "🩺",
  }),
  inhalants: makeNeutralTrack({
    label: "Solvants / inhalants",
    shortLabel: "Inhalants",
    icon: "🫧",
    accent: "#8ed9d2",
    accentSoft: "#243b3a",
    unit: "épisode",
    units: "épisodes",
    startLabel: "Date d’arrêt",
    formTitle: "Configure ton suivi inhalants",
    formCopy: "Suis les épisodes évités et éloigne-toi des produits ou lieux qui facilitent l’usage.",
    safety: "Les inhalants peuvent provoquer des urgences graves. En cas de malaise, perte de connaissance, douleur thoracique ou difficulté à respirer : 15 ou 112. Drogues Info Service : 0 800 23 13 13.",
    milestoneIcon: "⚠️",
  }),
  medicaments: makeNeutralTrack({
    label: "Médicaments / autres substances",
    shortLabel: "Médicaments",
    icon: "🧴",
    accent: "#78c7a3",
    accentSoft: "#253a33",
    unit: "prise hors objectif",
    units: "prises hors objectif",
    startLabel: "Date de début",
    formTitle: "Configure ton suivi médicaments",
    formCopy: "Pour un médicament prescrit, ESSOR suit seulement l’objectif défini avec le professionnel qui te soigne.",
    safety: "Ne réduis, n’arrête ou ne détourne jamais seul un traitement prescrit. Demande conseil au prescripteur ou au pharmacien. En cas d’intoxication ou de danger : 15 ou 112.",
    milestoneIcon: "🩺",
  }),
  polyconsommation: makeNeutralTrack({
    label: "Polyconsommation",
    shortLabel: "Polyconso",
    icon: "🔀",
    accent: "#f39b73",
    accentSoft: "#3d2c28",
    unit: "épisode",
    units: "épisodes",
    startLabel: "Date d’arrêt ou de réduction",
    formTitle: "Configure ton suivi polyconsommation",
    formCopy: "Quand plusieurs substances se croisent, suis surtout les situations, les mélanges évités et tes protections.",
    safety: "Les associations de substances peuvent modifier fortement les risques. Un professionnel ou un CSAPA peut t’aider à faire le point. Drogues Info Service : 0 800 23 13 13. Urgence : 15 ou 112.",
    milestoneIcon: "🧩",
  }),
  pornographie: makeNeutralTrack({
    label: "Pornographie compulsive",
    shortLabel: "Pornographie",
    icon: "🔞",
    accent: "#e987ac",
    accentSoft: "#3a2833",
    unit: "épisode impulsif évité",
    units: "épisodes impulsifs évités",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif pornographie",
    formCopy: "Le repère n’est pas une norme morale : suis la perte de contrôle, le temps pris et les conséquences qui comptent pour toi.",
    safety: "Une sexualité ou une consommation de pornographie ne devient pas un trouble par simple jugement moral. Si tu perds régulièrement le contrôle ou en souffres, un psychologue, sexologue ou CSAPA peut t’aider.",
    milestoneIcon: "🧭",
  }),
  travail: makeNeutralTrack({
    label: "Travail compulsif",
    shortLabel: "Travail",
    icon: "💼",
    accent: "#7fb4db",
    accentSoft: "#273544",
    unit: "dépassement évité",
    units: "dépassements évités",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif d’équilibre au travail",
    formCopy: "Ce parcours suit une compulsion ou un déséquilibre, sans présenter automatiquement le travail intense comme une addiction médicale.",
    safety: "Si le travail s’accompagne d’épuisement, d’insomnie, d’angoisse ou d’idées noires, parle-en à un médecin ou à un professionnel de santé au travail.",
    milestoneIcon: "⚖️",
  }),
  sport_compulsif: makeNeutralTrack({
    label: "Exercice / sport compulsif",
    shortLabel: "Sport",
    icon: "🏃",
    accent: "#69d69a",
    accentSoft: "#243b30",
    unit: "séance compulsive évitée",
    units: "séances compulsives évitées",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif d’équilibre sportif",
    formCopy: "Le sport reste bénéfique lorsqu’il est choisi : ce parcours vise la perte de contrôle, la culpabilité ou l’entraînement malgré les blessures.",
    safety: "Douleur persistante, malaise, blessure ou exercice malgré une restriction médicale nécessitent un avis professionnel. Si l’exercice est lié à un trouble alimentaire, demande un accompagnement spécialisé.",
    milestoneIcon: "⚖️",
  }),
  sodas: makeNeutralTrack({
    label: "Sodas",
    shortLabel: "Sodas",
    icon: "🥤",
    accent: "#ff9d66",
    accentSoft: "#3c2e27",
    unit: "boisson évitée",
    units: "boissons évitées",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif sodas",
    formCopy: "Suis une habitude alimentaire et les boissons évitées, sans la présenter comme une dépendance médicale automatique.",
    safety: "Une réduction progressive peut être plus confortable si les boissons contiennent beaucoup de caféine. Pour un besoin nutritionnel particulier, demande conseil à un professionnel.",
    milestoneIcon: "🥤",
  }),
  autre: makeNeutralTrack({
    label: "Autre objectif",
    shortLabel: "Autre",
    icon: "➕",
    accent: "#a6a0ba",
    accentSoft: "#302d39",
    unit: "épisode évité",
    units: "épisodes évités",
    startLabel: "Date de début",
    formTitle: "Configure ton objectif personnel",
    formCopy: "Utilise ce parcours pour une habitude ou un comportement qui n’apparaît pas encore dans la liste. Décris ton objectif dans le champ « ce que tu veux retrouver ».",
    safety: "ESSOR ne peut pas déterminer si cet objectif relève d’une addiction ou d’un problème médical. En cas de doute, parle-en à un professionnel de santé.",
    milestoneIcon: "✨",
  }),
`;

const GROUPS = `const TRACK_KEYS = Object.keys(TRACKS) as TrackKey[];

const TRACK_GROUPS: Array<{ label: string; hint: string; keys: TrackKey[] }> = [
  {
    label: "Substances",
    hint: "Produits psychoactifs et médicaments",
    keys: ["tabac", "alcool", "cannabis", "cannabinoides_synth", "opioides", "benzodiazepines", "cocaine", "stimulants", "cathinones", "cafeine", "hallucinogenes", "mdma", "ketamine", "inhalants", "medicaments", "polyconsommation"],
  },
  {
    label: "Comportements & compulsions",
    hint: "Perte de contrôle, temps, conséquences",
    keys: ["jeux_argent", "jeux_video", "ecrans", "achats", "pornographie", "sexe", "affective", "travail", "sport_compulsif"],
  },
  {
    label: "Habitudes & objectifs",
    hint: "Réduction et routines personnelles",
    keys: ["sucre", "viande", "sodas", "autre"],
  },
];`;

const PICKER = `      <div className="v2-track-strip">
        <details className="v2-track-picker">
          <summary>
            <span className="v2-track-current"><i aria-hidden="true">{track.icon}</i><span><small>Mon parcours</small><strong>{track.label}</strong></span></span>
            <span className="v2-track-change">Changer <i aria-hidden="true">⌄</i></span>
          </summary>
          <div className="v2-track-panel">
            <div className="v2-track-panel-head">
              <div><small>Choisir un parcours</small><strong>Qu’est-ce que tu veux reprendre en main ?</strong></div>
              <label className="v2-track-search"><span aria-hidden="true">⌕</span><input value={trackSearch} onChange={(event) => setTrackSearch(event.target.value)} placeholder="Rechercher…" aria-label="Rechercher un parcours" /></label>
            </div>
            <div className="v2-track-groups">
              {TRACK_GROUPS.map((group) => {
                const query = trackSearch.trim().toLocaleLowerCase("fr-FR");
                const visible = group.keys.filter((key) => {
                  const item = TRACKS[key];
                  return !query || (item.label + " " + item.shortLabel).toLocaleLowerCase("fr-FR").includes(query);
                });
                if (!visible.length) return null;
                return (
                  <section className="v2-track-group" key={group.label}>
                    <div className="v2-track-group-title"><strong>{group.label}</strong><small>{group.hint}</small></div>
                    <div className="v2-track-options">
                      {visible.map((key) => {
                        const item = TRACKS[key];
                        return (
                          <button
                            className={key === active ? "v2-track-option active" : "v2-track-option"}
                            type="button"
                            key={key}
                            onClick={(event) => {
                              selectTrack(key);
                              setTrackSearch("");
                              (event.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                            }}
                            aria-pressed={key === active}
                          >
                            <span aria-hidden="true">{item.icon}</span>
                            <b>{item.label}</b>
                            {profiles[key] && <em>Configuré</em>}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              {trackSearch.trim() && !TRACK_GROUPS.some((group) => group.keys.some((key) => TRACKS[key].label.toLocaleLowerCase("fr-FR").includes(trackSearch.trim().toLocaleLowerCase("fr-FR")))) && (
                <p className="v2-track-empty">Aucun parcours trouvé. Utilise « Autre objectif » pour commencer quand même.</p>
              )}
            </div>
          </div>
        </details>
      </div>`;

const TODAY_HERO = `          {appView === "today" && <>
            <section className="today-hero-v2" aria-labelledby="today-v2-title">
              <div className="today-v2-kicker"><span>Ton chemin aujourd’hui</span><em>{track.icon} {track.shortLabel}</em></div>
              <div className="today-v2-tree" aria-hidden="true"><span className="today-v2-glow" /><Plant progress={plantProgress} /></div>
              <div className="today-v2-count"><strong><AnimatedValue value={progress.days} /></strong><span>{progress.days > 1 ? "jours de liberté" : "jour de liberté"}</span></div>
              <h1 id="today-v2-title">Aujourd’hui, tu continues.</h1>
              <p>{profile.reason ? profile.reason : "Ton essentiel, sans bruit : ton chemin, ton état du jour et la prochaine petite étape."}</p>
              {next ? <div className="today-v2-next"><span>Prochaine étape</span><strong>{next.icon} {next.title}</strong><b>dans {remainingLabel(next.hours - progress.hours)}</b></div> : <div className="today-v2-next complete"><strong>🌳 Tous les repères affichés sont atteints.</strong></div>}
              <div className="today-v2-metrics">
                <article><span aria-hidden="true">💰</span><strong><AnimatedValue value={totals.saved} kind="money" /></strong><small>économisés</small></article>
                <article><span aria-hidden="true">🪽</span><strong><AnimatedValue value={totals.units} /></strong><small>{track.units} évitées</small></article>
                <article><span aria-hidden="true">🏆</span><strong>{reached.length}</strong><small>repères atteints</small></article>
              </div>
              <div className="today-v2-quick">
                <button type="button" onClick={() => { setJournalMode("private"); navigateApp("journal"); }}><span aria-hidden="true">📖</span><b>Mon journal</b><small>Déposer ce qui tourne dans ma tête</small></button>
                <button type="button" onClick={() => { setCircleLoading(true); setCircleStatus(""); setJournalMode("circle"); navigateApp("journal"); }}><span aria-hidden="true">🫂</span><b>Le Cercle</b><small>Voir que d’autres avancent aussi</small></button>
              </div>
              {presence && <div className="today-v2-presence"><span aria-hidden="true"><i /></span><p><strong>{presence.live > 1 ? presence.live + " personnes avancent avec ESSOR maintenant" : "Ta présence est allumée maintenant"}</strong><small>{presence.today > 1 ? presence.today + " présences anonymes ces dernières 24 h" : "Aucun prénom, parcours ou position n’est partagé"}</small></p></div>}
            </section>

            <section className="daily-card" aria-labelledby="daily-title">`;

export function essorV2(): Plugin {
  return {
    name: "essor-v2",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/app/page.tsx")) return null;

      let source = code;
      source = replaceOnce(
        source,
        `  | "sexe"\n  | "affective";`,
        `  | "sexe"\n  | "affective"\n${NEW_KEYS};`,
        "TrackKey",
      );
      source = replaceOnce(source, `const TRACKS: Record<TrackKey, Track> = {`, TRACK_HELPER + `const TRACKS: Record<TrackKey, Track> = {`, "helper parcours");
      source = replaceOnce(source, `    label: "Tabac",\n    shortLabel: "Tabac",`, `    label: "Nicotine",\n    shortLabel: "Nicotine",`, "nom nicotine");
      source = replaceOnce(source, `    formTitle: "Configure ton suivi tabac",`, `    formTitle: "Configure ton suivi nicotine",`, "titre nicotine");
      source = replaceOnce(source, `    formCopy: "Renseigne ta consommation avant l’arrêt pour calculer tes économies et suivre chaque étape.",`, `    formCopy: "Cigarette, vape, puff, tabac chauffé ou autre nicotine : pars de ton usage réel pour suivre ton chemin.",`, "texte nicotine");
      source = replaceOnce(
        source,
        `\n};\n\nconst TRACK_KEYS = Object.keys(TRACKS) as TrackKey[];`,
        `\n${NEW_TRACKS}};\n\n${GROUPS}`,
        "catalogue parcours",
      );
      source = replaceOnce(
        source,
        `  const [active, setActive] = useState<TrackKey>("tabac");`,
        `  const [active, setActive] = useState<TrackKey>("tabac");\n  const [trackSearch, setTrackSearch] = useState("");`,
        "état recherche parcours",
      );
      source = source.replaceAll("ESSOR — L’application qui enlève le mauvais sort", "ESSOR — Reprendre le contrôle");
      source = replaceBetween(
        source,
        `      {hasPlusAccess && profile && !editing ? (`,
        `\n\n      {hasPlusAccess && profile && !editing && (\n        <nav className="app-view-nav"`,
        PICKER,
        "sélecteur de parcours",
      );
      source = replaceOnce(
        source,
        `          {appView === "today" && <>\n            <section className="daily-card" aria-labelledby="daily-title">`,
        TODAY_HERO,
        "accueil aujourd’hui",
      );

      return { code: source, map: null };
    },
  };
}
