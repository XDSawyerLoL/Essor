import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité et données — ESSOR",
  description: "Notice de confidentialité, stockage local, présence anonyme, Cercle ESSOR et données d’abonnement.",
};

export default function ConfidentialitePage() {
  return (
    <main className="public-policy">
      <header>
        <Link className="brand" href="/" aria-label="Revenir à ESSOR"><span aria-hidden="true">🌱</span><span className="brand-name">ESSOR</span></Link>
        <span>Version bêta · 14 août 2026</span>
      </header>
      <article>
        <p className="section-label">Confidentialité et règles communautaires</p>
        <h1>Une application intime doit être claire sur chaque donnée.</h1>
        <p className="policy-lead">Cette notice décrit le fonctionnement actuel d’ESSOR, édité par VNHZ Studios. ESSOR est un outil de soutien et de motivation : il ne fournit aucun diagnostic et ne remplace ni un médecin, ni un psychologue, ni un service d’urgence.</p>

        <section><h2>1. Données conservées sur l’appareil</h2><p>Le prénom choisi, l’avatar, les parcours, les dates, bilans quotidiens, estimations, progression, réglages et accès fondateur sont conservés dans le stockage local de l’application. Ces données ne sont pas envoyées au Cercle ESSOR.</p><p>Les pages libres du journal sont chiffrées localement par AES-GCM. La clé est dérivée du code PIN avec PBKDF2. Le PIN et la clé ne sont jamais transmis à ESSOR. Oublier le PIN ou effacer les données de l’application rend les pages irrécupérables.</p></section>

        <section><h2>2. Cercle ESSOR</h2><p>Publier dans le Cercle est facultatif. Seuls sont transmis : un identifiant aléatoire, une phrase choisie dans une liste fermée, un nombre de jours facultatif et les soutiens. L’identifiant est transformé en empreinte avant stockage ; ni le prénom, ni l’avatar, ni le parcours ne sont publiés.</p><p>Les signes sont visibles pendant 30 jours maximum puis supprimés avec leurs interactions. L’auteur peut retirer son signe. Les autres membres peuvent le signaler ; trois signalements distincts entraînent son masquage automatique. Il n’existe ni message privé, ni texte libre, ni partage de coordonnées.</p></section>

        <section><h2>3. Présence anonyme</h2><p>Quand l’espace personnel est ouvert, ESSOR envoie un identifiant aléatoire distinct de celui du Cercle. Il est transformé en empreinte avant stockage et sert uniquement à compter les présences actives et celles des dernières 24 heures. Aucun prénom, avatar, parcours, bilan, journal ou position n’est associé à cette présence.</p><p>Une présence est considérée active pendant environ trois minutes. L’empreinte est automatiquement supprimée après 24 heures et peut être retirée immédiatement avec « Tout effacer ».</p></section>

        <section><h2>4. Paiement et abonnement</h2><p>Stripe traite les paiements effectués sur le Web et Google Play ceux effectués dans l’application Android distribuée par le Play Store. ESSOR conserve uniquement les identifiants techniques et l’état nécessaires pour vérifier, restaurer, gérer ou résilier l’accès ESSOR+. Aucune donnée de carte bancaire n’est stockée par ESSOR.</p></section>

        <section><h2>5. Suppression et contrôle</h2><p>Dans les réglages, « Tout effacer » supprime les données locales, la présence anonyme ainsi que les signes et interactions associés à l’identifiant anonyme du Cercle. Cette action ne résilie pas un abonnement : la résiliation s’effectue dans le portail Stripe ou Google Play.</p><p>Un signe peut aussi être retiré individuellement depuis le Cercle. En cas de contenu préoccupant, le bouton « Signaler » permet de le masquer et d’enregistrer le signalement.</p></section>

        <section><h2>6. Sécurité et limites</h2><p>Les échanges avec l’application utilisent HTTPS. Le journal est chiffré au repos, mais les autres données locales restent protégées principalement par le verrouillage de l’appareil et le PIN ESSOR. Un téléphone compromis, déverrouillé ou partagé peut réduire cette protection.</p><p>ESSOR limite volontairement les données collectées. Il n’utilise actuellement ni publicité ciblée, ni vente de données personnelles, ni suivi de localisation, contacts, microphone ou caméra.</p></section>

        <section><h2>7. Santé et urgence</h2><p>Les délais, économies et quantités affichés sont des estimations générales, pas des résultats médicaux individuels. Un arrêt brutal de certaines consommations, notamment l’alcool après une consommation importante et régulière, peut être dangereux. En urgence : 15 ou 112. En cas d’idées suicidaires : 3114.</p></section>

        <aside><strong>Avant la diffusion commerciale</strong><p>Une adresse de contact dédiée à la confidentialité et les informations juridiques complètes de l’éditeur doivent encore être ajoutées à cette page. En attendant, les demandes de retrait du Cercle passent par les commandes intégrées à l’application.</p></aside>
        <Link className="button primary policy-return" href="/">Revenir dans ESSOR</Link>
      </article>
    </main>
  );
}
