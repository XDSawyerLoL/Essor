# ESSOR — dossier Google Play

État préparé le 15 août 2026 pour `com.xdsawyer.essor`.

## Identité

- Nom : **ESSOR — Reprendre le contrôle**
- Package : `com.xdsawyer.essor`
- Version préparée : `1.2.0` / code `3`
- Site : `https://essor-app.fr`
- Politique de confidentialité : `https://essor-app.fr/confidentialite`
- Règles UGC : `https://essor-app.fr/conditions-communaute`
- Catégories Health Apps à déclarer :
  - **Mental and Behavioral Health / Santé mentale et comportementale** ;
  - **Medication and Treatment Management / Gestion des médicaments et des traitements**.
- ESSOR n'est pas un dispositif médical.

## Description courte

**Reprends le contrôle de tes dépendances, compulsions et habitudes, un jour après l'autre.**

## Description complète — base

**ESSOR t'aide à reprendre le contrôle, un jour après l'autre.**

Alcool, nicotine, substances, sexualité compulsive, dépendance affective ou autre habitude difficile à maîtriser : ESSOR permet de suivre plusieurs parcours dans un même espace personnel.

### Un compagnon, pas seulement un compteur

- programme guidé jusqu'au **jour 90** : 30 jours d'installation puis 60 jours de consolidation ;
- missions quotidiennes avec méthode, question de réflexion et source visible ;
- compagnon anti-craving ;
- bilans, déclencheurs, progression et trophées ;
- journal personnel chiffré ;
- bibliothèque documentée ;
- agenda pour des médicaments déjà prescrits, rendez-vous médicaux et activités sportives ;
- communauté gratuite : Signes anonymes et Histoires guidées.

### Communauté ESSOR

La communauté est gratuite et distincte de l'abonnement ESSOR+. Elle est réservée aux personnes qui confirment avoir 18 ans ou plus et exige l'acceptation des règles communautaires avant l'accès au contenu UGC.

Les **Signes** utilisent uniquement des phrases prédéfinies. Les **Histoires** suivent quatre champs courts : contexte, moment difficile, ce qui a aidé et message de transmission. Les utilisateurs disposent de commandes distinctes pour signaler un contenu et bloquer son auteur. Il n'existe pas de messagerie privée.

Les coordonnées, liens, e-mails, numéros et identifiants sociaux sont refusés dans les Histoires. Les contenus peuvent être signalés et trois signalements distincts entraînent leur masquage automatique. Les auteurs peuvent retirer leurs propres publications.

### Agenda sans prescrire

L'utilisateur saisit lui-même une consigne déjà prescrite, un rendez-vous ou une activité. ESSOR peut rappeler l'horaire choisi mais ne calcule aucune dose, ne modifie aucune ordonnance et ne recommande aucun traitement. Les notifications Android restent génériques et n'affichent pas le nom du médicament.

### Vie privée

Le profil, les parcours, bilans, progression, agenda et journal restent principalement sur l'appareil. Les pages libres du journal sont chiffrées localement. Les fonctions communautaires utilisent des identifiants aléatoires/pseudonymisés. Le blocage d'auteurs est enregistré localement sur l'appareil.

Les fonctions d'aide et les numéros d'urgence restent accessibles indépendamment de l'abonnement.

### ESSOR+

ESSOR+ ouvre les fonctions premium après **4 jours d'essai**. La communauté de base n'est pas verrouillée par l'abonnement.

### Important — santé

ESSOR est un outil de soutien, de suivi personnel, de rappel et de motivation. **ESSOR n'est pas un dispositif médical et ne permet pas de diagnostiquer, traiter, guérir ou prévenir un problème de santé.** Pour tout conseil, diagnostic ou traitement médical, consulte un professionnel de santé qualifié.

Un rappel de médicament ne remplace pas une ordonnance. Les Histoires communautaires sont des témoignages d'utilisateurs, pas des conseils médicaux.

L'arrêt brutal de certaines consommations, notamment après une consommation importante et régulière d'alcool, peut présenter un risque médical. En cas d'urgence, utiliser les services d'urgence indiqués dans l'application.

## Abonnements Google Play

### Mensuel
- Product ID : `essor_plus_monthly`
- France : **6,99 € / mois**
- Essai : **4 jours**
- Renouvellement automatique : oui

### Annuel
- Product ID : `essor_plus_annual`
- France : **59,99 € / an**
- Essai : **4 jours**
- Renouvellement automatique : oui

Le backend n'accepte que ces deux Product IDs.

## Health Apps — brouillon

- **Mental and Behavioral Health** : soutien, suivi personnel, documentation et outils de motivation relatifs aux dépendances et compulsions.
- **Medication and Treatment Management** : agenda permettant à l'utilisateur de saisir et recevoir des rappels pour des prises déjà prescrites.

Ne pas déclarer ESSOR comme dispositif médical.

## UGC / communauté — checklist Play

La version à envoyer doit conserver :

- contrôle d'âge avant accès à la communauté ;
- acceptation non contournable des règles avant accès / publication ;
- règles communautaires distinctes de la confidentialité ;
- bouton **Signaler** sur les contenus d'autres utilisateurs ;
- bouton **Bloquer** distinct sur les auteurs ;
- possibilité de débloquer ;
- retrait de ses propres publications ;
- pas de messagerie privée ;
- filtrage serveur des coordonnées courantes ;
- masquage automatique après trois signalements distincts ;
- limitations anti-spam ;
- modération continue à prévoir opérationnellement après lancement.

Répondre précisément au questionnaire de classification de contenu concernant le contenu généré par les utilisateurs.

## Data Safety — brouillon conservateur

### Local uniquement / principalement local

- prénom et avatar ;
- parcours, dates, bilans et progression ;
- journal personnel chiffré AES-GCM ;
- agenda et détails de médicaments/rendez-vous ;
- PIN / clé du journal non transmis ;
- acceptation des règles communautaires et contrôle d'âge local ;
- liste pseudonyme des auteurs bloqués localement.

### Données communautaires transmises

Pour Signes / Histoires / présence, ESSOR peut transmettre :

- identifiant technique aléatoire puis empreinte pseudonyme ;
- pseudonyme généré ;
- phrase prédéfinie d'un Signe ;
- quatre champs d'une Histoire publiés volontairement ;
- étape générale et nombre de jours facultatif ;
- réactions de soutien et signalements ;
- présence anonyme temporaire.

Finalités : fournir la communauté, la modération, la sécurité et le comptage anonyme. Pas de finalité publicitaire.

### Conservation serveur

- présence : jusqu'à 24 h ;
- Signes : jusqu'à 30 jours ;
- Histoires : jusqu'à 180 jours ;
- interactions liées supprimées avec la publication via les clés étrangères ;
- commandes de retrait disponibles dans l'application.

### Paiements

ESSOR traite les identifiants techniques et l'état d'abonnement nécessaires à la vérification/restauration d'ESSOR+. Les données bancaires sont traitées par Google Play sur Android et ne sont pas stockées par ESSOR.

### Publicité / vente / capteurs

- pas de publicité ciblée ;
- pas de vente de données personnelles ;
- pas de localisation, contacts, microphone ou caméra.

**La déclaration Data Safety finale doit être remplie à partir de l'AAB réellement envoyé et des définitions exactes affichées dans la Play Console.**

## Permissions Android

- `POST_NOTIFICATIONS` : rappels choisis par l'utilisateur ;
- `SCHEDULE_EXACT_ALARM` : rappels à heure précise ; repli inexact si refus ;
- `RECEIVE_BOOT_COMPLETED` : restaurer les rappels après redémarrage ;
- pas de localisation, contacts, caméra ou microphone.

ESSOR n'utilise pas `USE_EXACT_ALARM`.

## Digital Asset Links

Origine : `https://essor-app.fr`

Package : `com.xdsawyer.essor`

Empreinte actuelle de la clé d'importation :

`5E:F6:D1:6B:28:FE:B0:9B:A3:F8:BA:42:57:BE:09:B2:8A:1C:F7:2B:D0:F6:7E:A8:65:F6:0A:17:85:4C:27:A2`

Après le premier téléversement avec Play App Signing, ajouter également l'empreinte SHA-256 du certificat de **signature d'application** à `public/.well-known/assetlinks.json`.

## Point administratif restant

Avant diffusion commerciale, ajouter une adresse / un mécanisme de contact confidentialité-support réellement opérationnel ainsi que les informations juridiques requises de l'éditeur. Ne pas les inventer.

## Checklist après validation d'identité Google

1. Ouvrir/créer l'application Play Console `com.xdsawyer.essor`.
2. Activer Play App Signing et téléverser l'AAB sur le test interne.
3. Ajouter le SHA-256 de la clé de signature d'application à `assetlinks.json`.
4. Créer les deux abonnements et l'essai de 4 jours.
5. Ajouter les testeurs de licence.
6. Remplir Health Apps.
7. Remplir la déclaration UGC / classification de contenu et vérifier les règles communautaires dans l'AAB réellement testé.
8. Remplir Data Safety.
9. Renseigner support et informations légales.
10. Tester notifications, rappels exacts/inexacts, redémarrage, communauté, signalement, blocage et déblocage.
11. Effectuer un achat test Play et vérifier `/api/google-play/verify` avec un vrai purchase token.
12. Vérifier restauration, annulation, expiration et plein écran TWA.
13. Passer ensuite au canal exigé par le type de compte développeur.
