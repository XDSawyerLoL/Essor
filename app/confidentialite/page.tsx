import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité et données — ESSOR",
  description: "Notice de confidentialité, stockage local, agenda, communauté ESSOR, Histoires et données d’abonnement.",
};

export default function ConfidentialitePage() {
  return (
    <main className="public-policy">
      <header>
        <Link className="brand" href="/" aria-label="Revenir à ESSOR"><span aria-hidden="true">🌱</span><span className="brand-name">ESSOR</span></Link>
        <span>Version bêta · 15 août 2026</span>
      </header>
      <article>
        <p className="section-label">Confidentialité et règles communautaires</p>
        <h1>Une application intime doit être claire sur chaque donnée.</h1>
        <p className="policy-lead">Cette notice décrit le fonctionnement actuel d’ESSOR, édité par VNHZ Studios. ESSOR est un outil de soutien et de motivation : il ne fournit aucun diagnostic et ne remplace ni un médecin, ni un psychologue, ni un service d’urgence.</p>

        <section><h2>1. Données conservées sur l’appareil</h2><p>Le prénom choisi, l’avatar, les parcours, les dates, bilans quotidiens, estimations, progression, réglages, agenda et accès fondateur sont conservés dans le stockage local de l’application. Ces données ne sont pas automatiquement publiées dans la communauté ESSOR.</p><p>Les pages libres du journal sont chiffrées localement par AES-GCM. La clé est dérivée du code PIN avec PBKDF2. Le PIN et la clé ne sont jamais transmis à ESSOR. Oublier le PIN ou effacer les données de l’application rend les pages irrécupérables.</p><p>Pour la communauté, l’appareil conserve également l’acceptation de la version actuelle des règles, la réponse au contrôle d’âge et, le cas échéant, la liste pseudonyme des auteurs que tu as bloqués. Cette liste de blocage reste sur l’appareil.</p></section>

        <section><h2>2. Agenda, traitements et rendez-vous</h2><p>L’agenda est facultatif. Le nom saisi pour un médicament, les notes personnelles, le motif d’un rendez-vous médical et les activités sportives restent dans le stockage local de l’appareil et ne sont pas envoyés au serveur ESSOR.</p><p>Sur Android, lorsqu’un rappel est activé, la partie native de l’application conserve localement uniquement un identifiant technique, l’horaire du prochain rappel, sa répétition et son type général — médicament, rendez-vous ou activité. La notification affichée reste volontairement générique et ne révèle pas le nom du médicament sur l’écran verrouillé. ESSOR ne calcule aucune dose, ne modifie aucune ordonnance et ne recommande pas de traitement.</p></section>

        <section><h2>3. Communauté ESSOR : Signes et Histoires</h2><p>La communauté est facultative, gratuite et réservée aux personnes qui confirment avoir 18 ans ou plus. Avant d’accéder aux contenus communautaires, l’utilisateur doit accepter les <Link href="/conditions-communaute">règles de la communauté</Link>. Un identifiant aléatoire local est transformé en empreinte avant stockage ; le pseudonyme protecteur est dérivé de cette empreinte. Le prénom, l’avatar et les données privées du journal ne sont pas publiés automatiquement.</p><p><strong>Signes :</strong> une phrase est choisie dans une liste fermée. Un nombre de jours peut être ajouté volontairement. Les Signes sont conservés 30 jours maximum.</p><p><strong>Histoires :</strong> l’utilisateur peut publier quatre courts champs libres — contexte, moment difficile, ce qui l’a aidé et message de transmission — ainsi qu’une étape générale et, facultativement, un nombre de jours. Les liens, adresses e-mail, numéros de téléphone et identifiants sociaux sont refusés par le serveur afin de limiter l’exposition de coordonnées. Les Histoires sont conservées 180 jours maximum.</p><p>Il n’existe pas de messagerie privée. Les réactions sont limitées à des signes de soutien prédéfinis. Une personne peut retirer ses propres publications. Les autres peuvent les <strong>signaler</strong> et peuvent <strong>bloquer séparément leur auteur</strong>. Trois signalements distincts entraînent le masquage automatique d’un contenu. Bloquer un auteur masque ses Signes et Histoires sur l’appareil sans révéler son identité réelle. Les Histoires sans soutien peuvent être affichées en priorité et celles proches de l’étape choisie par l’utilisateur peuvent être remontées dans le flux.</p></section>

        <section><h2>4. Présence anonyme</h2><p>Quand ESSOR ou la communauté est ouverte, l’application peut envoyer un identifiant aléatoire distinct servant uniquement à compter les présences actives et celles des dernières 24 heures. Cet identifiant est transformé en empreinte avant stockage. Aucun prénom, avatar, journal ou position n’y est associé.</p><p>Une présence est considérée active pendant environ trois minutes. L’empreinte est automatiquement supprimée après 24 heures.</p></section>

        <section><h2>5. Paiement et abonnement</h2><p>Stripe traite les paiements effectués sur le Web et Google Play ceux effectués dans l’application Android distribuée par le Play Store. ESSOR conserve uniquement les identifiants techniques et l’état nécessaires pour vérifier, restaurer, gérer ou résilier l’accès ESSOR+. Aucune donnée de carte bancaire n’est stockée par ESSOR.</p></section>

        <section><h2>6. Suppression et contrôle</h2><p>Dans les réglages, « Tout effacer » supprime immédiatement les données locales ESSOR, y compris l’agenda et les préférences communautaires locales, sans attendre une réponse du serveur. L’application envoie en parallèle une demande de suppression des Signes, Histoires, réactions, signalements associés à son identifiant anonyme et de la présence anonyme. Sur Android, elle annule aussi les rappels natifs programmés. Cette action ne résilie pas un abonnement.</p><p>Si une demande serveur ne peut pas être remise au moment de l’effacement, la suppression locale reste effective ; les présences expirent automatiquement, les Signes restent soumis à leur durée maximale de 30 jours et les Histoires à leur durée maximale de 180 jours. Une publication peut aussi être retirée individuellement tant que l’identifiant local existe.</p></section>

        <section><h2>7. Sécurité et limites</h2><p>Les échanges avec l’application utilisent HTTPS. Le journal est chiffré au repos, mais les autres données locales — y compris l’agenda — restent protégées principalement par le verrouillage de l’appareil et le PIN ESSOR. Un téléphone compromis, déverrouillé ou partagé peut réduire cette protection.</p><p>ESSOR limite volontairement les données collectées. Il n’utilise actuellement ni publicité ciblée, ni vente de données personnelles, ni suivi de localisation, contacts, microphone ou caméra.</p></section>

        <section><h2>8. Santé et urgence</h2><p>Les délais, économies et quantités affichés sont des estimations générales, pas des résultats médicaux individuels. Les Histoires sont des témoignages d’utilisateurs, pas des conseils médicaux. Les rappels de médicaments servent uniquement à mémoriser une consigne saisie par l’utilisateur ; ils ne constituent pas une prescription. Un arrêt brutal de certaines consommations, notamment l’alcool après une consommation importante et régulière, peut être dangereux. En urgence : 15 ou 112. En cas d’idées suicidaires : 3114.</p></section>

        <aside><strong>Avant la diffusion commerciale</strong><p>Une adresse de contact dédiée à la confidentialité et les informations juridiques complètes de l’éditeur doivent encore être ajoutées à cette page. En attendant, les commandes de retrait, signalement et blocage sont intégrées à la communauté ESSOR.</p></aside>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link className="button primary policy-return" href="/">Revenir dans ESSOR</Link><Link className="button ghost policy-return" href="/communaute">Voir la communauté</Link><Link className="button ghost policy-return" href="/conditions-communaute">Règles communauté</Link></div>
      </article>
    </main>
  );
}
