export type ProgramSourceKey = "motivation" | "craving" | "ifthen" | "peer" | "reinforcement";

export type ProgramMissionV3 = {
  day: number;
  icon: string;
  title: string;
  copy: string;
  method: string;
  reflection: string;
  sourceKey: ProgramSourceKey;
};

export const PROGRAM_SOURCES_V3: Record<ProgramSourceKey, { label: string; url: string; caveat?: string }> = {
  motivation: {
    label: "SAMHSA · TIP 35, motivation au changement",
    url: "https://library.samhsa.gov/product/tip-35-enhancing-motivation-change-substance-use-disorder-treatment/pep19-02-01-003",
  },
  craving: {
    label: "NIAAA · reconnaître, éviter et faire face aux envies",
    url: "https://rethinkingdrinking.niaaa.nih.gov/tools/worksheets-more/how-stop-alcohol-cravings",
  },
  ifthen: {
    label: "Malaguti et al. · plans si/alors et réduction de consommation",
    url: "https://pubmed.ncbi.nlm.nih.gov/32622228/",
  },
  peer: {
    label: "Eddie et al. 2025 · soutien par les pairs, revue systématique",
    url: "https://pubmed.ncbi.nlm.nih.gov/41551498/",
  },
  reinforcement: {
    label: "Pfund et al. · contingency management, méta-analyse",
    url: "https://pubmed.ncbi.nlm.nih.gov/38863566/",
    caveat: "ESSOR utilise seulement des idées générales de renforcement personnel ; ses XP et badges ne constituent pas un contingency management clinique.",
  },
};

export const PROGRAM_STAGES_V3 = [
  { from: 1, to: 7, icon: "🔎", title: "Observer sans te juger", copy: "Comprendre ce qui déclenche, attire ou soulage avant d’essayer de tout contrôler." },
  { from: 8, to: 14, icon: "🧭", title: "Préparer tes réponses", copy: "Transformer les situations à risque en décisions préparées plutôt qu’en batailles improvisées." },
  { from: 15, to: 21, icon: "🛠️", title: "Renforcer ce qui marche", copy: "Rendre les réponses utiles plus faciles, plus rapides et plus gratifiantes." },
  { from: 22, to: 30, icon: "🌱", title: "Construire l’après", copy: "Préparer les écarts, les week-ends, les relations et la suite du premier mois." },
  { from: 31, to: 45, icon: "⚓", title: "Stabiliser ton système", copy: "Faire tenir les protections même quand la nouveauté et la motivation diminuent." },
  { from: 46, to: 60, icon: "🌤️", title: "Élargir ta vie", copy: "Reprendre de la place avec des activités, des liens et une identité qui ne tournent pas autour du problème." },
  { from: 61, to: 75, icon: "🛡️", title: "Anticiper les zones à risque", copy: "Préparer les périodes, émotions et événements qui peuvent fragiliser ton équilibre." },
  { from: 76, to: 90, icon: "🧱", title: "Entretenir sans t’épuiser", copy: "Construire un plan de maintien réaliste, flexible et capable de survivre aux mauvaises semaines." },
] as const;

const FIRST_MONTH: Omit<ProgramMissionV3, "day">[] = [
  { icon:"🧭", title:"Ta raison à toi", copy:"Écris trois choses que tu veux retrouver grâce à ce changement. Choisis celle qui compte aujourd’hui, pas celle qui sonne le mieux.", method:"Entretien motivationnel", reflection:"Pourquoi cette raison compte-t-elle vraiment maintenant ?", sourceKey:"motivation" },
  { icon:"🔎", title:"Repère le premier déclencheur", copy:"Quand une envie apparaît, note seulement le contexte : où, quand, avec qui et ce qui se passait juste avant.", method:"Auto-observation", reflection:"Quel détail du contexte n’avais-tu jamais remarqué ?", sourceKey:"craving" },
  { icon:"🌊", title:"Donne une note à la vague", copy:"À la prochaine envie, note son intensité de 0 à 10, attends dix minutes puis note-la à nouveau sans chercher la perfection.", method:"Observation du craving", reflection:"L’intensité a-t-elle bougé, même légèrement ?", sourceKey:"craving" },
  { icon:"🚪", title:"Change le décor", copy:"Identifie un objet, un lieu ou une routine qui déclenche souvent l’automatisme et rends-le moins accessible aujourd’hui.", method:"Gestion des déclencheurs", reflection:"Qu’est-ce qui est devenu un peu moins automatique ?", sourceKey:"craving" },
  { icon:"🤝", title:"Choisis une personne ressource", copy:"Décide qui tu peux contacter avant le point de rupture. Tu n’as pas besoin de raconter toute ton histoire pour demander quelques minutes de présence.", method:"Soutien social", reflection:"Qu’est-ce qui te faciliterait le fait de demander de l’aide plus tôt ?", sourceKey:"peer" },
  { icon:"⏳", title:"Gagne dix minutes", copy:"Quand l’envie monte, ne décide pas pour toujours. Décide seulement de ce que tu fais pendant les dix prochaines minutes.", method:"Faire face au craving", reflection:"Quelle action courte t’aide le mieux à gagner ce temps ?", sourceKey:"craving" },
  { icon:"📝", title:"Bilan de première semaine", copy:"Relis tes notes : choisis un déclencheur fréquent, une réponse qui a aidé et une situation qui mérite un plan plus précis.", method:"Auto-évaluation", reflection:"Quelle est ta découverte la plus utile de la semaine ?", sourceKey:"motivation" },
  { icon:"🔁", title:"Ton premier plan si/alors", copy:"Écris : « Si [déclencheur précis] arrive, alors je [action concrète] pendant dix minutes. » Garde le plan simple.", method:"Implementation intention", reflection:"Ton “alors” est-il faisable même dans une mauvaise journée ?", sourceKey:"ifthen" },
  { icon:"🧹", title:"Retire une friction inutile", copy:"Prépare à l’avance ce qui facilite ton alternative : bouteille d’eau, chaussures, numéro, trajet, activité ou objet utile.", method:"Architecture du choix", reflection:"Quelle bonne décision devient plus facile grâce à cette préparation ?", sourceKey:"ifthen" },
  { icon:"🧠", title:"Distingue envie et ordre", copy:"Quand une envie arrive, formule : « une envie est présente » plutôt que « j’ai besoin de le faire ». Observe ce que cette formulation change.", method:"Décentration", reflection:"Qu’est-ce qui change quand tu décris l’envie au lieu de lui obéir ?", sourceKey:"craving" },
  { icon:"🗺️", title:"Cartographie ton heure fragile", copy:"Repère la tranche horaire la plus difficile et programme une activité alternative dix à trente minutes avant.", method:"Planification préventive", reflection:"Que peux-tu mettre en place avant que la vague commence ?", sourceKey:"ifthen" },
  { icon:"📞", title:"Prépare ton message d’aide", copy:"Écris une phrase que tu pourrais envoyer sans réfléchir : « Journée compliquée, tu as cinq minutes ? » ou ta propre version.", method:"Soutien social préparé", reflection:"À qui ce message pourrait-il partir en premier ?", sourceKey:"peer" },
  { icon:"🧯", title:"Prépare une sortie", copy:"Pour une situation sociale ou un lieu à risque, choisis avant d’y aller une heure de départ, un moyen de partir et une excuse simple si tu en as besoin.", method:"Plan si/alors", reflection:"Quelle sortie te redonne le plus de contrôle ?", sourceKey:"ifthen" },
  { icon:"🧩", title:"Teste ton plan", copy:"Relis tes plans de la semaine. Modifie celui qui est trop vague, trop long ou dépend de quelqu’un qui n’est pas toujours disponible.", method:"Ajustement comportemental", reflection:"Quel plan devient plus réaliste après cette correction ?", sourceKey:"ifthen" },
  { icon:"🎁", title:"Choisis une vraie petite récompense", copy:"Définis une récompense sûre, concrète et rapide pour une étape que tu choisis. Elle n’a pas besoin d’être coûteuse.", method:"Renforcement personnel", reflection:"Qu’est-ce qui te ferait réellement plaisir sans créer un nouveau problème ?", sourceKey:"reinforcement" },
  { icon:"🏃", title:"Une alternative qui mobilise le corps", copy:"Teste dix minutes d’une activité physique accessible : marche, étirements, rangement, vélo ou autre mouvement compatible avec ta santé.", method:"Alternative comportementale", reflection:"Ton niveau de tension a-t-il changé après le mouvement ?", sourceKey:"craving" },
  { icon:"🫂", title:"Donne du soutien", copy:"Dans la communauté ESSOR ou ailleurs, laisse un signe de soutien à quelqu’un. Aider peut aussi renforcer ton sentiment d’appartenance.", method:"Soutien pair-à-pair", reflection:"Qu’as-tu ressenti en passant de “recevoir” à “donner” ?", sourceKey:"peer" },
  { icon:"🌙", title:"Protège une heure", copy:"Choisis une heure de la journée où tu réduis les décisions inutiles et les situations à risque. Prépare-la comme une zone calme.", method:"Réduction de l’exposition", reflection:"Quelle décision n’as-tu plus besoin de négocier pendant cette heure ?", sourceKey:"craving" },
  { icon:"💰", title:"Rends le gain visible", copy:"Note une chose concrète déjà récupérée : argent, temps, disponibilité, sommeil, relation ou fierté. Même petite.", method:"Renforcement positif", reflection:"Quel bénéfice risque d’être oublié si tu ne le rends pas visible ?", sourceKey:"reinforcement" },
  { icon:"🔧", title:"Répare un plan qui a échoué", copy:"Choisis une situation où ton plan n’a pas tenu. Ne juge pas : change une seule variable pour le rendre plus simple la prochaine fois.", method:"Résolution de problème", reflection:"Quelle modification réduit le plus la difficulté ?", sourceKey:"ifthen" },
  { icon:"📊", title:"Bilan de troisième semaine", copy:"Repère ce qui fonctionne régulièrement, ce qui fonctionne parfois et ce qui ne fonctionne presque jamais. Garde les preuves, pas les promesses.", method:"Auto-évaluation", reflection:"Quelle stratégie mérite de devenir une vraie routine ?", sourceKey:"motivation" },
  { icon:"🤝", title:"Ton protocole après un écart", copy:"Écris trois actions pour les heures qui suivent un écart : te mettre en sécurité, prévenir quelqu’un si nécessaire, puis reprendre sans attendre lundi.", method:"Plan de reprise", reflection:"Quelle première action évite le mieux l’effet “tout est perdu” ?", sourceKey:"motivation" },
  { icon:"🧠", title:"Sépare l’écart de l’identité", copy:"Écris une phrase qui décrit un comportement sans te définir par lui : « j’ai eu un écart » plutôt que « je suis incapable ».", method:"Auto-efficacité", reflection:"Quelle formulation te permet de décider de la suite ?", sourceKey:"motivation" },
  { icon:"📅", title:"Prépare le prochain week-end", copy:"Choisis le moment le plus risqué du prochain week-end et place avant lui une activité, une personne ou une sortie de secours.", method:"Implementation intention", reflection:"Quel détail concret réduit l’improvisation ?", sourceKey:"ifthen" },
  { icon:"🚦", title:"Tes trois signaux d’alerte", copy:"Liste trois signes qui indiquent que tu te fragilises : isolement, fatigue, argent disponible, conflit, pensée répétitive ou autre.", method:"Prévention de la rechute", reflection:"Lequel apparaît généralement en premier ?", sourceKey:"craving" },
  { icon:"🗣️", title:"Prépare une limite", copy:"Écris une phrase courte pour refuser une situation que tu ne veux pas négocier : pas d’explication longue, juste une limite claire.", method:"Préparation comportementale", reflection:"Quelle phrase te ressemble assez pour sortir naturellement ?", sourceKey:"ifthen" },
  { icon:"🌳", title:"Ce que tu reconstruis", copy:"Liste trois choses qui prennent plus de place quand le comportement problématique en prend moins. Choisis-en une à nourrir cette semaine.", method:"Identité de changement", reflection:"Que veux-tu construire, au-delà du simple fait d’arrêter ?", sourceKey:"motivation" },
  { icon:"💌", title:"Écris à ton toi du jour 1", copy:"En quelques lignes, raconte ce que tu comprends aujourd’hui que tu ne voyais pas au début. Garde ce texte ou transforme-le en Histoire ESSOR.", method:"Réflexion narrative", reflection:"Quelle phrase aurais-tu eu besoin de lire au départ ?", sourceKey:"peer" },
  { icon:"🧰", title:"Construis ta trousse de secours", copy:"Choisis cinq outils maximum : une personne, un lieu, une action physique, une distraction utile et une ressource professionnelle.", method:"Plan de coping", reflection:"Lequel de ces cinq outils est disponible presque partout ?", sourceKey:"craving" },
  { icon:"🏁", title:"Bilan du premier mois", copy:"Écris : ce que j’ai appris, ce qui me fragilise, ce qui m’aide, qui peut m’aider et ce que je veux tester pendant les 30 prochains jours.", method:"Consolidation", reflection:"Quelle règle personnelle veux-tu emporter dans le mois 2 ?", sourceKey:"motivation" },
];

const CONSOLIDATION_BLOCKS: Array<{ from: number; to: number; actions: Array<Omit<ProgramMissionV3, "day">> }> = [
  { from:31, to:45, actions:[
    {icon:"⚓",title:"Une routine qui tient sans motivation",copy:"Choisis une protection utile et attache-la à un moment fixe de ta journée plutôt qu’à ton humeur.",method:"Ancrage comportemental",reflection:"Quel signal quotidien peut déclencher automatiquement cette routine ?",sourceKey:"ifthen"},
    {icon:"🔍",title:"Le déclencheur discret",copy:"Cherche aujourd’hui un déclencheur moins évident : ennui, réussite, paie, fin d’une tâche, notification ou transition.",method:"Auto-observation",reflection:"Quel déclencheur positif ou neutre avais-tu sous-estimé ?",sourceKey:"craving"},
    {icon:"🧭",title:"Révise ta raison",copy:"Relis ta raison du jour 1. Garde-la, reformule-la ou remplace-la si ta vraie motivation a changé.",method:"Entretien motivationnel",reflection:"Ta motivation actuelle est-elle différente de celle du départ ?",sourceKey:"motivation"},
    {icon:"🧹",title:"Simplifie ton environnement",copy:"Supprime une friction qui rend ta réponse saine difficile ou une facilité qui nourrit l’ancien automatisme.",method:"Architecture du choix",reflection:"Quelle modification continuera d’aider même les mauvais jours ?",sourceKey:"ifthen"},
    {icon:"🌊",title:"Observe une vague complète",copy:"Si une envie apparaît, note son début, son pic approximatif et son recul. Ne cherche pas à mesurer parfaitement.",method:"Observation du craving",reflection:"Combien de temps la partie la plus intense a-t-elle semblé durer ?",sourceKey:"craving"},
    {icon:"🤝",title:"Actualise ton réseau",copy:"Classe tes soutiens : personne disponible vite, professionnel, lieu sûr, communauté. Comble la case la plus vide.",method:"Soutien social",reflection:"Quel type de soutien te manque encore ?",sourceKey:"peer"},
    {icon:"🎁",title:"Récompense ce qui est répétable",copy:"Accorde-toi une petite récompense pour une action choisie et répétable, pas uniquement pour un nombre de jours.",method:"Renforcement personnel",reflection:"Quelle action veux-tu rendre plus probable demain ?",sourceKey:"reinforcement"},
    {icon:"🧪",title:"Teste une alternative nouvelle",copy:"Essaie une réponse que tu n’utilises pas d’habitude pendant dix minutes et juge-la seulement après l’avoir testée.",method:"Expérimentation comportementale",reflection:"Cette alternative mérite-t-elle une deuxième tentative ?",sourceKey:"craving"},
    {icon:"🪫",title:"Plan pour jour sans énergie",copy:"Crée une version minimale de ton plan : l’action que tu peux faire même fatigué, triste ou débordé.",method:"Plan si/alors",reflection:"Ton plan minimal tient-il en moins de cinq minutes ?",sourceKey:"ifthen"},
    {icon:"📵",title:"Une fenêtre sans déclencheur",copy:"Protège vingt minutes d’une source de stimulation ou d’un contexte qui alimente ton automatisme.",method:"Gestion de l’exposition",reflection:"Qu’as-tu remarqué quand le signal disparaît un moment ?",sourceKey:"craving"},
    {icon:"🧱",title:"Répète ce qui fonctionne",copy:"Aujourd’hui, ne cherche aucune nouveauté : répète volontairement la stratégie qui t’a déjà le plus aidé.",method:"Consolidation",reflection:"Qu’est-ce qui rend cette stratégie fiable ?",sourceKey:"reinforcement"},
    {icon:"📓",title:"Une preuve contre l’oubli",copy:"Écris une difficulté que tu as traversée sans revenir automatiquement à l’ancien comportement.",method:"Auto-efficacité",reflection:"Quelle capacité personnelle cette situation prouve-t-elle ?",sourceKey:"motivation"},
    {icon:"🧯",title:"Répète mentalement ta sortie",copy:"Visualise une situation à risque et déroule ton plan de sortie étape par étape avant qu’elle arrive.",method:"Préparation si/alors",reflection:"À quel moment exact décides-tu de partir ou de demander de l’aide ?",sourceKey:"ifthen"},
    {icon:"🫂",title:"Soutiens quelqu’un sans te sacrifier",copy:"Envoie un signe de soutien bref. Aider n’oblige pas à devenir le sauveur ou le thérapeute de quelqu’un.",method:"Soutien pair-à-pair",reflection:"Quelle limite protège à la fois ton énergie et ton envie d’aider ?",sourceKey:"peer"},
    {icon:"✅",title:"Bilan de stabilisation",copy:"Choisis deux routines à conserver, une à abandonner et une à tester jusqu’au jour 60.",method:"Révision du plan",reflection:"Qu’est-ce qui mérite réellement de rester dans ton système ?",sourceKey:"motivation"},
  ]},
  { from:46, to:60, actions:[
    {icon:"🌤️",title:"Une activité qui n’a rien à prouver",copy:"Fais quelque chose uniquement parce que tu l’apprécies ou que tu veux le redécouvrir, sans objectif de performance.",method:"Élargissement comportemental",reflection:"Qu’est-ce qui t’a donné un peu de plaisir ou de curiosité ?",sourceKey:"reinforcement"},
    {icon:"👤",title:"Qui es-tu en dehors du combat ?",copy:"Complète cinq fois : « Je suis aussi quelqu’un qui… » sans mentionner l’arrêt, l’addiction ou la compulsion.",method:"Identité de changement",reflection:"Quelle identité veux-tu nourrir davantage ?",sourceKey:"motivation"},
    {icon:"🤝",title:"Un lien non centré sur le problème",copy:"Passe un moment ou échange avec quelqu’un sans faire du comportement problématique le sujet principal.",method:"Soutien affiliatif",reflection:"Quel lien te rappelle que ta vie est plus large que ce problème ?",sourceKey:"peer"},
    {icon:"🧠",title:"Repère la pensée automatique",copy:"Quand une justification apparaît — « juste cette fois », « je le mérite » — note-la sans débattre puis choisis ton plan préparé.",method:"Observation cognitive",reflection:"Quelle phrase revient le plus souvent ?",sourceKey:"craving"},
    {icon:"🗺️",title:"Réinvestis un lieu",copy:"Choisis un lieu associé à une ancienne routine et, si c’est sûr, associe-le volontairement à une nouvelle activité neutre ou positive.",method:"Nouvel apprentissage",reflection:"Quelle nouvelle association veux-tu créer ?",sourceKey:"craving"},
    {icon:"💬",title:"Demande quelque chose de précis",copy:"Au lieu de « aide-moi », formule un besoin concret : cinq minutes d’appel, marcher ensemble, garder un objet, changer de sujet.",method:"Soutien social",reflection:"Quel besoin précis est le plus facile à demander ?",sourceKey:"peer"},
    {icon:"🎯",title:"Un objectif qui n’est pas l’abstinence",copy:"Choisis un petit objectif de vie pour les deux prochaines semaines : administratif, créatif, relationnel, sportif ou domestique.",method:"Motivation orientée valeurs",reflection:"Pourquoi cet objectif rend-il ta vie plus grande ?",sourceKey:"motivation"},
    {icon:"🌊",title:"Compare deux envies",copy:"Compare une envie récente forte et une plus faible : contexte, pensée, émotion, réponse et résultat dix minutes plus tard.",method:"Analyse des déclencheurs",reflection:"Quelle différence est la plus utile pour anticiper ?",sourceKey:"craving"},
    {icon:"💡",title:"Une amélioration de 10 %",copy:"Choisis une habitude protectrice et rends-la seulement 10 % plus facile ou plus agréable aujourd’hui.",method:"Renforcement progressif",reflection:"Quel petit changement augmente tes chances de la refaire ?",sourceKey:"reinforcement"},
    {icon:"🚶",title:"Crée un trajet de secours",copy:"Identifie un endroit accessible où tu peux marcher ou te poser quand rester sur place devient risqué.",method:"Plan de coping",reflection:"Ce lieu est-il réellement accessible dans tes heures difficiles ?",sourceKey:"ifthen"},
    {icon:"📱",title:"Nettoie un signal numérique",copy:"Désactive, masque ou éloigne une notification, un compte ou un raccourci qui déclenche inutilement l’ancien automatisme.",method:"Gestion des déclencheurs",reflection:"Quel signal numérique avait plus de pouvoir que tu ne le pensais ?",sourceKey:"craving"},
    {icon:"✨",title:"Raconte une micro-victoire",copy:"Partage une petite victoire dans ESSOR ou à quelqu’un de confiance. Pas besoin qu’elle soit impressionnante.",method:"Soutien et auto-efficacité",reflection:"Qu’est-ce que le fait de la formuler change dans ta perception ?",sourceKey:"peer"},
    {icon:"🧩",title:"Une valeur en action",copy:"Choisis une valeur importante — présence, honnêteté, liberté, santé, famille — et fais une action de dix minutes cohérente avec elle.",method:"Motivation",reflection:"Quelle action rend cette valeur visible aujourd’hui ?",sourceKey:"motivation"},
    {icon:"🔁",title:"Réécris un plan si/alors",copy:"Prends un plan devenu trop facile à ignorer et rends le déclencheur plus précis et la réponse plus courte.",method:"Implementation intention",reflection:"Peux-tu visualiser exactement quand le plan démarre ?",sourceKey:"ifthen"},
    {icon:"🌅",title:"Bilan du jour 60",copy:"Écris ce que tu fais aujourd’hui que tu n’aurais probablement pas fait au jour 1. Choisis ce que tu veux protéger ensuite.",method:"Consolidation identitaire",reflection:"Quelle évolution dépasse le simple compteur ?",sourceKey:"motivation"},
  ]},
  { from:61, to:75, actions:[
    {icon:"🛡️",title:"Ton scénario difficile n°1",copy:"Choisis l’événement futur qui t’inquiète le plus et découpe-le : avant, pendant, sortie, après.",method:"Planification préventive",reflection:"À quelle étape as-tu le plus besoin d’un plan ?",sourceKey:"ifthen"},
    {icon:"💶",title:"Plan pour jour de paie",copy:"Si l’argent disponible est un déclencheur pour toi, décide aujourd’hui ce qui se passe automatiquement quand il arrive.",method:"Implementation intention",reflection:"Quelle décision peux-tu prendre avant d’avoir à la reprendre ?",sourceKey:"ifthen"},
    {icon:"🥳",title:"Plan pour événement social",copy:"Prépare ton arrivée, ta réponse aux propositions, ton allié éventuel et ton heure de sortie.",method:"Plan de coping",reflection:"Quelle partie de l’événement mérite la préparation la plus concrète ?",sourceKey:"craving"},
    {icon:"😤",title:"Plan pour conflit",copy:"Décide ce que tu fais dans les quinze minutes qui suivent une dispute : sortir, appeler, respirer, marcher, différer une décision.",method:"Plan si/alors",reflection:"Quelle action empêche le conflit de devenir un déclencheur automatique ?",sourceKey:"ifthen"},
    {icon:"🌙",title:"Plan pour solitude",copy:"Prépare deux options : une présence humaine et une activité solitaire qui ne nourrit pas l’ancien comportement.",method:"Soutien social",reflection:"Laquelle est disponible tard ou le week-end ?",sourceKey:"peer"},
    {icon:"🪫",title:"Plan pour fatigue",copy:"Réduis les exigences : identifie la réponse minimale qui protège ta soirée quand tu n’as presque plus d’énergie.",method:"Réduction de décision",reflection:"Que peux-tu préparer avant d’être épuisé ?",sourceKey:"craving"},
    {icon:"🎉",title:"Plan pour réussite",copy:"La joie, le soulagement et la récompense peuvent aussi déclencher des automatismes. Prépare une manière différente de célébrer.",method:"Gestion des déclencheurs",reflection:"Quelle célébration te fait réellement du bien après coup ?",sourceKey:"reinforcement"},
    {icon:"🧳",title:"Plan pour déplacement",copy:"Si tu changes de ville, d’hôtel ou de rythme, repère à l’avance une routine, une personne et une sortie de secours.",method:"Implementation intention",reflection:"Quelle protection peut voyager avec toi ?",sourceKey:"ifthen"},
    {icon:"📉",title:"Plan pour baisse de motivation",copy:"Écris ce que tu continueras à faire même si tu n’as plus envie de “travailler sur toi”. Limite-toi à trois éléments.",method:"Maintenance comportementale",reflection:"Quelles trois protections méritent de survivre à la lassitude ?",sourceKey:"motivation"},
    {icon:"📣",title:"Ton signal d’alerte partageable",copy:"Choisis un signe que tu peux dire à une personne de confiance : « si je commence à faire X, j’ai besoin que tu me proposes Y ».",method:"Soutien préparé",reflection:"Quel signe extérieur les autres peuvent-ils réellement remarquer ?",sourceKey:"peer"},
    {icon:"🌊",title:"Craving : reconnais, évite ou fais face",copy:"Pour une envie récente, classe ta meilleure réponse : reconnaître, éviter le déclencheur évitable ou faire face à celui qui ne l’est pas.",method:"Recognize–Avoid–Cope",reflection:"Dans quelle catégorie as-tu encore le moins d’outils ?",sourceKey:"craving"},
    {icon:"🧪",title:"Simulation sans danger",copy:"Répète mentalement une réponse à une situation à risque sans te placer volontairement dans un contexte dangereux.",method:"Répétition comportementale",reflection:"Quel mot ou geste lance ton plan ?",sourceKey:"ifthen"},
    {icon:"🤲",title:"Accepte une aide imparfaite",copy:"Identifie une personne ou ressource utile même si elle ne comprend pas tout parfaitement. Le soutien n’a pas besoin d’être idéal pour aider.",method:"Soutien social",reflection:"Quelle aide avais-tu écartée parce qu’elle n’était pas parfaite ?",sourceKey:"peer"},
    {icon:"🧯",title:"Plan urgence personnelle",copy:"Écris où aller et qui contacter si tu sens que tu perds fortement le contrôle. Pour un risque médical ou suicidaire, utilise les ressources professionnelles d’ESSOR.",method:"Plan de sécurité",reflection:"Peux-tu retrouver ce plan sans réfléchir quand ça va mal ?",sourceKey:"peer"},
    {icon:"🛡️",title:"Bilan des zones à risque",copy:"Garde tes trois scénarios les plus importants et supprime les plans inutiles. Un système lisible vaut mieux qu’une liste infinie.",method:"Consolidation",reflection:"Quels trois plans doivent rester visibles ?",sourceKey:"motivation"},
  ]},
  { from:76, to:90, actions:[
    {icon:"🧱",title:"Tes trois piliers",copy:"Choisis les trois comportements qui protègent le mieux ton équilibre. Ils deviennent le minimum de maintenance.",method:"Plan de maintien",reflection:"Lequel est le plus facile à abandonner quand ça va bien ?",sourceKey:"motivation"},
    {icon:"🔔",title:"Ton rappel précoce",copy:"Identifie le premier signe de dérive et associe-lui une action immédiate plutôt qu’une promesse vague de “faire attention”.",method:"Implementation intention",reflection:"Quelle action commence dès le premier signal ?",sourceKey:"ifthen"},
    {icon:"🧭",title:"Redéfinis la réussite",copy:"Écris une définition de la réussite qui inclut la reprise après difficulté, l’honnêteté et la demande d’aide — pas seulement un compteur parfait.",method:"Auto-efficacité",reflection:"Quelle définition t’aide à continuer après une mauvaise journée ?",sourceKey:"motivation"},
    {icon:"🫂",title:"Ton cercle durable",copy:"Choisis les deux ou trois relations ou ressources que tu veux conserver dans la durée et décide comment les entretenir.",method:"Soutien social",reflection:"Quel lien mérite une action concrète cette semaine ?",sourceKey:"peer"},
    {icon:"🎁",title:"Une récompense de vie",copy:"Choisis une récompense qui nourrit la vie que tu construis : activité, objet utile, moment, projet ou expérience sûre.",method:"Renforcement personnel",reflection:"Cette récompense renforce-t-elle ce que tu veux devenir ?",sourceKey:"reinforcement"},
    {icon:"🌊",title:"Ton manuel de l’envie",copy:"Résume en quatre lignes : mes déclencheurs principaux, mes signes corporels, mes réponses utiles, la personne à contacter.",method:"Gestion du craving",reflection:"Ce manuel tient-il sur un écran de téléphone ?",sourceKey:"craving"},
    {icon:"📆",title:"Plan pour les 30 prochains jours",copy:"Choisis un objectif de maintien, un objectif de vie et un rendez-vous de bilan personnel dans un mois.",method:"Planification",reflection:"Quelle date précise utiliseras-tu pour faire le point ?",sourceKey:"motivation"},
    {icon:"🧩",title:"Ce qui n’a pas marché",copy:"Choisis une méthode ESSOR qui t’aide peu et autorise-toi à l’abandonner. Un programme personnel doit éliminer aussi l’inutile.",method:"Personnalisation",reflection:"Qu’est-ce que tu arrêtes de faire par obligation ?",sourceKey:"motivation"},
    {icon:"🌱",title:"Ce qui mérite de grandir",copy:"Choisis une habitude ou relation positive apparue pendant ces semaines et donne-lui une place régulière dans le mois suivant.",method:"Renforcement",reflection:"Quelle place concrète lui réserves-tu ?",sourceKey:"reinforcement"},
    {icon:"📖",title:"Une histoire transmissible",copy:"Écris ce que quelqu’un à ton ancien point de départ pourrait apprendre de ton parcours, sans lui dire quoi faire médicalement.",method:"Soutien narratif",reflection:"Quelle partie de ton expérience peut réduire la solitude de quelqu’un ?",sourceKey:"peer"},
    {icon:"🧯",title:"Ton plan de reprise en 24 h",copy:"Si un écart survient, décris les premières 24 heures : sécurité, soutien, environnement, reprise du suivi et soin si nécessaire.",method:"Prévention de l’abandon",reflection:"Quelle étape doit arriver en premier pour éviter l’escalade ?",sourceKey:"motivation"},
    {icon:"🧠",title:"Tes justifications favorites",copy:"Liste les trois pensées qui négocient le plus avec toi et associe chacune à une réponse courte déjà décidée.",method:"Plan si/alors",reflection:"Quelle justification est la plus convaincante quand tu es fatigué ?",sourceKey:"ifthen"},
    {icon:"🔐",title:"Ce que tu protèges",copy:"Écris trois choses récupérées que tu ne veux pas remettre en jeu. Garde cette liste accessible pour les périodes de doute.",method:"Motivation",reflection:"Laquelle a le plus de valeur aujourd’hui ?",sourceKey:"motivation"},
    {icon:"🤝",title:"Rendre le soutien réciproque",copy:"Si tu as reçu du soutien, laisse un signe à quelqu’un d’autre sans te rendre responsable de son parcours.",method:"Soutien pair-à-pair",reflection:"Comment aider tout en gardant une limite saine ?",sourceKey:"peer"},
    {icon:"🏁",title:"Jour 90 : ton système à toi",copy:"Résume ton système en une page : déclencheurs, plans, soutiens, routines, signaux d’alerte, plan après écart et prochaine étape de vie.",method:"Plan de maintien",reflection:"Si tu ne gardais qu’une page d’ESSOR, que devrait-elle absolument contenir ?",sourceKey:"motivation"},
  ]},
];

export function programMissionV3(day: number): ProgramMissionV3 {
  const safeDay = Math.max(1, Math.min(90, Math.floor(day || 1)));
  if (safeDay <= 30) return { day: safeDay, ...FIRST_MONTH[safeDay - 1] };
  const block = CONSOLIDATION_BLOCKS.find((item) => safeDay >= item.from && safeDay <= item.to) ?? CONSOLIDATION_BLOCKS[CONSOLIDATION_BLOCKS.length - 1];
  const action = block.actions[safeDay - block.from] ?? block.actions[block.actions.length - 1];
  return { day: safeDay, ...action };
}
