# ESSOR — dossier Google Play

État préparé le 15 août 2026 pour `com.xdsawyer.essor`.

## Identité de l'application

- Nom : **ESSOR — Reprendre le contrôle**
- Nom court : **ESSOR**
- Package Android : `com.xdsawyer.essor`
- Version : `1.2.0`
- Version code : `3`
- Site : `https://essor-app.fr`
- Politique de confidentialité : `https://essor-app.fr/confidentialite`
- Catégorie santé à déclarer : **Mental and Behavioral Health / Santé mentale et comportementale** (programme de soutien aux dépendances et compulsions)
- ESSOR n'est pas un dispositif médical.

## Description courte Play Store

**Reprends le contrôle de tes dépendances, compulsions et habitudes, un jour après l'autre.**

## Description complète Play Store

**ESSOR t'aide à reprendre le contrôle, un jour après l'autre.**

Alcool, tabac, substances, sexualité compulsive, dépendance affective ou autre habitude difficile à maîtriser : ESSOR permet de suivre plusieurs parcours dans un même espace personnel, sans jugement et sans mise en scène.

### Un suivi concret

- visualise le nombre de jours parcourus ;
- réalise un bilan quotidien simple ;
- suis ta progression, tes repères et tes trophées ;
- utilise un journal personnel chiffré ;
- consulte des ressources sur les dépendances, les mécanismes psychologiques et les stratégies de changement ;
- partage certaines victoires lorsque tu le souhaites.

### Rompre l'isolement sans exposer son identité

Le Cercle ESSOR permet d'envoyer des signes de soutien anonymes à partir de messages prédéfinis. Il n'y a ni messagerie privée, ni partage de coordonnées. Un indicateur de présence anonyme permet également de voir que d'autres personnes utilisent ESSOR au même moment, sans révéler leur identité ou leur parcours.

### Vie privée

Le profil, les parcours, les bilans, la progression et le journal restent principalement sur l'appareil. Les pages libres du journal sont chiffrées localement. Les fonctions communautaires utilisent des identifiants aléatoires/pseudonymisés et sont conçues pour limiter les données transmises.

Les fonctions d'aide et les numéros d'urgence restent accessibles indépendamment de l'abonnement.

### ESSOR+

ESSOR+ permet d'accéder aux fonctions premium après une période d'essai de 4 jours. Les abonnements prévus sur Google Play sont mensuels ou annuels et peuvent être gérés depuis Google Play.

### Important — santé

ESSOR est un outil de soutien, de suivi personnel et de motivation dans le cadre des dépendances, compulsions et habitudes. **ESSOR n'est pas un dispositif médical et ne permet pas de diagnostiquer, traiter, guérir ou prévenir un problème de santé.** Pour tout conseil, diagnostic ou traitement médical, consulte un médecin ou un autre professionnel de santé qualifié.

L'arrêt brutal de certaines consommations, notamment après une consommation importante et régulière d'alcool, peut présenter un risque médical. En cas d'urgence, utilise les services d'urgence indiqués dans l'application.

## Abonnements Google Play à créer après validation du compte développeur

### Mensuel

- Product ID : `essor_plus_monthly`
- Prix cible France : **6,99 € / mois**
- Essai gratuit : **4 jours**
- Renouvellement automatique : oui

### Annuel

- Product ID : `essor_plus_annual`
- Prix cible France : **59,99 € / an**
- Essai gratuit : **4 jours**
- Renouvellement automatique : oui

Le backend n'accepte actuellement que ces deux Product IDs.

## Déclaration Health Apps — brouillon

Sélection principale :

- **Mental and Behavioral Health / Santé mentale et comportementale**

Motif : ESSOR propose du soutien, du suivi personnel, de la documentation et des outils de motivation relatifs aux dépendances et compulsions.

Ne pas déclarer ESSOR comme dispositif médical : l'application ne réalise pas de diagnostic, ne prescrit pas de traitement et ne prétend pas prévenir ou guérir une pathologie.

La description Play Store doit conserver l'avertissement médical ci-dessus.

## Data Safety — brouillon conservateur à vérifier dans la Play Console

### Chiffrement et transport

- Données transmises : HTTPS.
- Journal personnel : contenu libre chiffré localement par AES-GCM ; clé dérivée du PIN avec PBKDF2.
- PIN et clé du journal : non envoyés au serveur ESSOR.

### Données qui restent sur l'appareil

Le prénom choisi, l'avatar, les parcours, les dates, bilans quotidiens, estimations, progression, réglages et contenu du journal sont conçus pour rester localement sur l'appareil, sauf action distincte explicitement liée à une fonction serveur.

### Données transmises pour le Cercle / présence

ESSOR peut transmettre :

- un identifiant aléatoire/pseudonyme technique ;
- un message choisi dans une liste fermée ;
- un nombre de jours facultatif ;
- les actions de soutien et signalement ;
- un identifiant de présence anonyme servant au comptage temporaire des personnes actives.

Ces éléments sont utilisés pour la fonction communautaire, la modération et le comptage de présence. Ils ne doivent pas être utilisés à des fins publicitaires.

### Abonnement / achats

ESSOR traite des identifiants techniques et l'état d'abonnement nécessaires à la vérification et à la restauration d'ESSOR+. Les données bancaires sont traitées par Google Play sur Android et ne sont pas stockées par ESSOR.

### Publicité / vente

- Pas de publicité ciblée déclarée dans la version actuelle.
- Pas de vente de données personnelles déclarée dans la version actuelle.
- Pas de collecte de localisation, contacts, microphone ou caméra déclarée dans la version actuelle.

**Attention :** la déclaration Data Safety finale doit être remplie à partir de la version effectivement envoyée à Google Play et des définitions exactes du formulaire Play Console. Ce brouillon sert de base factuelle, pas de validation automatique par Google.

## Permissions Android observées

- `POST_NOTIFICATIONS`
- aucune permission de localisation, contacts, caméra ou microphone dans le manifeste Android préparé.

Play Billing est fourni via Google Android Browser Helper pour la Trusted Web Activity.

## Digital Asset Links

Origine : `https://essor-app.fr`

Package : `com.xdsawyer.essor`

Empreinte actuelle de la clé d'importation :

`5E:F6:D1:6B:28:FE:B0:9B:A3:F8:BA:42:57:BE:09:B2:8A:1C:F7:2B:D0:F6:7E:A8:65:F6:0A:17:85:4C:27:A2`

Après le premier téléversement avec Play App Signing, récupérer dans Play Console l'empreinte SHA-256 du **certificat de signature d'application** et l'ajouter à `public/.well-known/assetlinks.json` en plus de l'empreinte actuelle.

## Politique de confidentialité

Une page existe déjà à `/confidentialite` et décrit : stockage local, chiffrement du journal, Cercle, présence anonyme, abonnements, suppression et sécurité.

Avant diffusion publique sur Google Play, il reste un élément administratif à renseigner sans l'inventer : **une adresse ou un mécanisme de contact confidentialité/support réellement opérationnel et les informations légales d'éditeur requises**. La page actuelle le signale explicitement.

## Checklist après validation d'identité Google

1. Créer/ouvrir l'application Play Console avec le package `com.xdsawyer.essor`.
2. Activer Play App Signing et téléverser l'AAB 1.2.0 / code 3 sur le canal de test interne.
3. Récupérer le SHA-256 de la clé de signature d'application et compléter `assetlinks.json`.
4. Créer `essor_plus_monthly` et `essor_plus_annual` avec leurs offres et l'essai de 4 jours.
5. Ajouter les testeurs de licence.
6. Remplir la déclaration Health Apps : **Mental and Behavioral Health**.
7. Remplir Data Safety à partir de la version réellement envoyée.
8. Renseigner la politique de confidentialité publique.
9. Effectuer un achat test Google Play et vérifier `/api/google-play/verify` avec un vrai purchase token.
10. Vérifier la restauration d'achat, l'expiration/annulation et l'affichage plein écran TWA.
11. Passer ensuite au test fermé/ouvert ou à la production selon les exigences du compte développeur.
