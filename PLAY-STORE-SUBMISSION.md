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
- Catégories Health Apps à déclarer :
  - **Mental and Behavioral Health / Santé mentale et comportementale** ;
  - **Medication and Treatment Management / Gestion des médicaments et des traitements** pour les rappels de prises saisis par l'utilisateur.
- ESSOR n'est pas un dispositif médical.

## Description courte Play Store

**Reprends le contrôle de tes dépendances, compulsions et habitudes, un jour après l'autre.**

## Description complète Play Store

**ESSOR t'aide à reprendre le contrôle, un jour après l'autre.**

Alcool, nicotine, substances, sexualité compulsive, dépendance affective ou autre habitude difficile à maîtriser : ESSOR permet de suivre plusieurs parcours dans un même espace personnel, sans jugement et sans mise en scène.

### Un suivi concret

- visualise le nombre de jours parcourus ;
- réalise un bilan quotidien simple ;
- suis ta progression, tes repères et tes trophées ;
- utilise un journal personnel chiffré ;
- consulte des ressources sur les dépendances, les mécanismes psychologiques et les stratégies de changement ;
- utilise un agenda personnel pour rappeler des prises déjà prescrites, des rendez-vous médicaux et des activités sportives ;
- partage certaines victoires lorsque tu le souhaites.

### Un agenda sans prescrire

L'agenda ESSOR permet à l'utilisateur de saisir lui-même un traitement déjà prescrit, un rendez-vous ou une activité. ESSOR peut ensuite rappeler l'horaire choisi. L'application ne calcule pas de dose, ne modifie pas une ordonnance, ne décide pas de la fréquence d'un médicament et ne recommande aucun traitement.

Les notifications Android sont volontairement génériques : le nom du médicament n'est pas affiché dans la notification. Les noms et notes de l'agenda restent dans le stockage local de l'appareil.

### Rompre l'isolement sans exposer son identité

Le Cercle ESSOR permet d'envoyer des signes de soutien anonymes à partir de messages prédéfinis. Il n'y a ni messagerie privée, ni partage de coordonnées. Un indicateur de présence anonyme permet également de voir que d'autres personnes utilisent ESSOR au même moment, sans révéler leur identité ou leur parcours.

### Vie privée

Le profil, les parcours, les bilans, la progression, l'agenda et le journal restent principalement sur l'appareil. Les pages libres du journal sont chiffrées localement. Les fonctions communautaires utilisent des identifiants aléatoires/pseudonymisés et sont conçues pour limiter les données transmises.

Les fonctions d'aide et les numéros d'urgence restent accessibles indépendamment de l'abonnement.

### ESSOR+

ESSOR+ permet d'accéder aux fonctions premium après une période d'essai de 4 jours. Les abonnements prévus sur Google Play sont mensuels ou annuels et peuvent être gérés depuis Google Play.

### Important — santé

ESSOR est un outil de soutien, de suivi personnel, de rappel et de motivation dans le cadre des dépendances, compulsions et habitudes. **ESSOR n'est pas un dispositif médical et ne permet pas de diagnostiquer, traiter, guérir ou prévenir un problème de santé.** Pour tout conseil, diagnostic ou traitement médical, consulte un médecin ou un autre professionnel de santé qualifié.

Un rappel de médicament dans ESSOR sert uniquement à mémoriser une consigne déjà saisie par l'utilisateur. Il ne remplace pas une ordonnance ni l'avis d'un médecin ou d'un pharmacien.

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

Sélections :

- **Mental and Behavioral Health / Santé mentale et comportementale** : soutien, suivi personnel, documentation et outils de motivation relatifs aux dépendances et compulsions.
- **Medication and Treatment Management / Gestion des médicaments et des traitements** : agenda permettant à l'utilisateur de saisir et recevoir des rappels pour des prises déjà prescrites.

Ne pas déclarer ESSOR comme dispositif médical : l'application ne réalise pas de diagnostic, ne prescrit pas de traitement et ne prétend pas prévenir ou guérir une pathologie.

La description Play Store doit conserver l'avertissement médical ci-dessus et préciser que les rappels ne constituent pas une prescription.

## Data Safety — brouillon conservateur à vérifier dans la Play Console

### Chiffrement et transport

- Données transmises : HTTPS.
- Journal personnel : contenu libre chiffré localement par AES-GCM ; clé dérivée du PIN avec PBKDF2.
- PIN et clé du journal : non envoyés au serveur ESSOR.

### Données qui restent sur l'appareil

Le prénom choisi, l'avatar, les parcours, les dates, bilans quotidiens, estimations, progression, réglages, contenu du journal et détails de l'agenda sont conçus pour rester localement sur l'appareil, sauf action distincte explicitement liée à une fonction serveur.

Pour l'agenda :

- nom du médicament : local uniquement ;
- note personnelle / motif de rendez-vous : local uniquement ;
- date, heure et répétition : local uniquement ;
- sur Android, le planificateur natif conserve localement seulement un identifiant technique, l'heure du rappel, sa répétition et le type général (`medication`, `medical`, `sport`) ;
- aucune donnée d'agenda n'est envoyée à l'API ESSOR.

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

- `POST_NOTIFICATIONS` : afficher les rappels choisis par l'utilisateur ;
- `SCHEDULE_EXACT_ALARM` : permettre à l'utilisateur d'autoriser des rappels à heure précise. Si cet accès spécial n'est pas accordé, ESSOR utilise un rappel inexact de repli ;
- `RECEIVE_BOOT_COMPLETED` : restaurer les rappels locaux après redémarrage de l'appareil ;
- aucune permission de localisation, contacts, caméra ou microphone dans le manifeste Android préparé.

ESSOR n'utilise pas `USE_EXACT_ALARM`. L'accès « Alarmes et rappels » est demandé dans le contexte de la programmation d'un rappel et reste révocable par l'utilisateur.

Play Billing est fourni via Google Android Browser Helper pour la Trusted Web Activity.

## Digital Asset Links

Origine : `https://essor-app.fr`

Package : `com.xdsawyer.essor`

Empreinte actuelle de la clé d'importation :

`5E:F6:D1:6B:28:FE:B0:9B:A3:F8:BA:42:57:BE:09:B2:8A:1C:F7:2B:D0:F6:7E:A8:65:F6:0A:17:85:4C:27:A2`

Après le premier téléversement avec Play App Signing, récupérer dans Play Console l'empreinte SHA-256 du **certificat de signature d'application** et l'ajouter à `public/.well-known/assetlinks.json` en plus de l'empreinte actuelle.

## Politique de confidentialité

La page `/confidentialite` décrit désormais : stockage local, chiffrement du journal, agenda et rappels, Cercle, présence anonyme, abonnements, suppression et sécurité.

Avant diffusion publique sur Google Play, il reste un élément administratif à renseigner sans l'inventer : **une adresse ou un mécanisme de contact confidentialité/support réellement opérationnel et les informations légales d'éditeur requises**. La page actuelle le signale explicitement.

## Checklist après validation d'identité Google

1. Créer/ouvrir l'application Play Console avec le package `com.xdsawyer.essor`.
2. Activer Play App Signing et téléverser l'AAB sur le canal de test interne.
3. Récupérer le SHA-256 de la clé de signature d'application et compléter `assetlinks.json`.
4. Créer `essor_plus_monthly` et `essor_plus_annual` avec leurs offres et l'essai de 4 jours.
5. Ajouter les testeurs de licence.
6. Remplir la déclaration Health Apps : **Mental and Behavioral Health** + **Medication and Treatment Management**.
7. Justifier `SCHEDULE_EXACT_ALARM` par la fonctionnalité de rappels à heure précise et vérifier que la demande reste conforme aux règles Play au moment de la soumission.
8. Remplir Data Safety à partir de la version réellement envoyée.
9. Renseigner la politique de confidentialité publique et l'adresse de support.
10. Tester sur Android 13+ l'autorisation de notifications et sur Android 12+ l'accès « Alarmes et rappels ».
11. Tester un rappel médicament, un rendez-vous, un rappel sportif, une répétition quotidienne, une répétition hebdomadaire et la restauration après redémarrage.
12. Effectuer un achat test Google Play et vérifier `/api/google-play/verify` avec un vrai purchase token.
13. Vérifier la restauration d'achat, l'expiration/annulation et l'affichage plein écran TWA.
14. Passer ensuite au test fermé/ouvert ou à la production selon les exigences du compte développeur.
