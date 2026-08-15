import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Règles de la communauté — ESSOR",
  description: "Conditions d’utilisation des Histoires et Signes de la communauté ESSOR.",
};

export default function CommunityTermsPage() {
  return (
    <main className="public-policy">
      <header>
        <Link className="brand" href="/" aria-label="Revenir à ESSOR"><span aria-hidden="true">🌱</span><span className="brand-name">ESSOR</span></Link>
        <span>Règles communauté · 15 août 2026</span>
      </header>
      <article>
        <p className="section-label">Conditions d’utilisation de la communauté</p>
        <h1>On peut parler vrai sans mettre les autres en danger.</h1>
        <p className="policy-lead">La communauté ESSOR est un espace de témoignage et de soutien entre pairs. Elle n’est ni un service médical, ni une messagerie privée, ni un espace de rencontre. Ces règles doivent être acceptées avant de publier un Signe ou une Histoire.</p>

        <section><h2>1. Accès à la communauté</h2><p>La partie communautaire d’ESSOR est réservée aux personnes âgées de 18 ans ou plus. Si tu as moins de 18 ans, n’utilise pas les Histoires ou les Signes. Les fonctions d’aide et d’urgence d’ESSOR restent distinctes de cet espace communautaire.</p></section>

        <section><h2>2. Ce que tu peux partager</h2><p>Tu peux raconter ton contexte, une difficulté, un déclencheur, une action qui t’a aidé et ce que tu aurais aimé entendre à cette étape. Tu peux aussi envoyer un Signe à partir des phrases proposées par ESSOR.</p><p>Parle de ton expérience comme d’une expérience personnelle. Une méthode qui t’a aidé n’est pas automatiquement adaptée ou sûre pour une autre personne.</p></section>

        <section><h2>3. Ce qui est interdit</h2><p>Sont interdits : menaces, harcèlement, intimidation, haine ou attaques contre une personne ou un groupe ; exploitation ou mise en danger de mineurs ; contenu sexuel explicite ; promotion ou facilitation d’activités illégales ; publicité, démarchage, arnaque ou sollicitation financière.</p><p>Ne publie pas d’instructions permettant de consommer, fabriquer, acheter ou dissimuler des substances, ni de recommandations de dosage. Ne conseille pas à une autre personne de commencer, arrêter ou modifier un médicament ou un traitement. Ne publie pas d’instructions favorisant l’automutilation, le suicide ou une autre conduite dangereuse.</p></section>

        <section><h2>4. Protège ton identité</h2><p>Ne publie pas de nom complet, adresse postale, e-mail, numéro de téléphone, identifiant de réseau social, lien externe ou autre moyen de contacter directement une personne. ESSOR refuse automatiquement plusieurs formes courantes de coordonnées dans les Histoires, mais cette protection ne remplace pas ta vigilance.</p></section>

        <section><h2>5. Signaler et bloquer</h2><p>Chaque publication d’une autre personne permet de <strong>signaler</strong> le contenu et de <strong>bloquer</strong> son auteur séparément. Signaler alerte le système de modération ; bloquer masque localement les publications de cet auteur sur ton appareil.</p><p>Trois signalements distincts entraînent le masquage automatique d’un contenu. ESSOR peut également retirer des contenus ou limiter l’accès communautaire lorsque cela est nécessaire pour appliquer ces règles ou protéger les utilisateurs.</p></section>

        <section><h2>6. Pas de concours de popularité</h2><p>Les réactions disponibles sont des signes de soutien prédéfinis. ESSOR ne propose pas de messagerie privée et ne classe pas les personnes selon leur popularité. Les Histoires sans soutien peuvent être remontées afin de réduire le risque qu’une personne reste invisible.</p></section>

        <section><h2>7. Santé, urgence et témoignages</h2><p>Les Histoires sont rédigées par des utilisateurs et ne sont pas validées comme conseils médicaux. Pour une question de traitement, de sevrage ou de santé, demande l’avis d’un professionnel qualifié. En cas d’urgence, utilise les ressources d’aide affichées dans ESSOR plutôt que la communauté.</p></section>

        <section><h2>8. Conservation et retrait</h2><p>Tu peux retirer tes propres publications. Les Signes sont conservés au maximum 30 jours et les Histoires au maximum 180 jours dans la version actuelle. Les modalités de traitement des données sont détaillées séparément dans la notice de confidentialité.</p></section>

        <aside><strong>En publiant</strong><p>Tu confirmes avoir au moins 18 ans, avoir lu ces règles et accepter de les respecter. L’acceptation est enregistrée localement sur ton appareil pour la version actuelle des règles.</p></aside>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button primary policy-return" href="/communaute">Revenir à la communauté</Link>
          <Link className="button ghost policy-return" href="/confidentialite">Confidentialité</Link>
        </div>
      </article>
    </main>
  );
}
