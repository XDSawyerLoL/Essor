# 🌱 ESSOR

**L’application qui enlève le mauvais sort.**

Application : **https://essor-app.fr**

ESSOR transforme les efforts quotidiens en progrès visibles : un arbre qui grandit, des niveaux, des trophées à débloquer et des victoires à célébrer. L’expérience reste chaleureuse et ludique sans minimiser les difficultés liées à un changement d’habitude.

## Ce que l’application propose

- douze parcours : tabac, alcool, cannabis, cocaïne, sucre, viande, jeux d’argent, écrans et réseaux sociaux, jeux vidéo, achats compulsifs, comportements sexuels compulsifs et dépendance affective ;
- une navigation en cinq vues courtes : Aujourd’hui, Progrès, Journal, Comprendre et Aide ; Progrès est lui-même séparé en Jardin, Trophées et Repères ;
- une navigation mobile réellement bord à bord, avec un mode Android immersif ;
- un journal intime local chiffré par AES-GCM à partir du code PIN, avec migration automatique des anciennes pages ;
- un Cercle ESSOR anonyme : messages encadrés, pseudonymes automatiques, gestes de soutien, retrait, signalement et suppression après 30 jours, sans messages privés ;
- un compteur réel de présences anonymes pour rappeler que personne n’avance seul, sans prénom, parcours ou géolocalisation et avec suppression après 24 heures ;
- une bibliothèque guidée sur la psychologie de l’addiction, le craving, la motivation, l’autopersuasion, les écarts et les relations ;
- ESSOR+ avec 4 jours d’essai, un programme guidé de 30 jours et un accès fondateur privé pendant la validation Google Play ;
- un compteur personnel avec estimations des unités évitées et de l’argent économisé ;
- un arbre évolutif, des niveaux XP et six récompenses ;
- des cartes de victoire et de médaille partageables sur les réseaux sociaux, avec le parcours masqué par défaut ;
- un bilan quotidien sans remise à zéro punitive ;
- des repères santé adaptés à chaque parcours ;
- une pause guidée de trois minutes pour traverser une envie ;
- des numéros d’aide officiels toujours accessibles ;
- un profil local avec prénom et avatar, sans compte externe ;
- un verrouillage par code PIN à quatre chiffres à chaque ouverture ;
- un mode discret avec un nom et une icône d’installation neutres ;
- des données de suivi conservées sur l’appareil ; seuls les signes volontairement publiés dans le Cercle, les présences anonymisées et les états de facturation nécessaires sont traités côté serveur.

## Démarrage local

Prérequis : Node.js 22.13.0 ou supérieur.

```bash
npm ci
npm run dev
```

Puis ouvrir l’adresse indiquée par Vite.

## Vérifications

```bash
npm run build
npm test
```

## Production

- domaine public : `https://essor-app.fr` ;
- hébergement : Hostinger Business, Node.js / Express ;
- base serveur : MySQL Hostinger ;
- API et application servies en même origine ;
- Stripe pour la facturation web ESSOR+ ;
- Google Play Billing prévu pour la distribution Android ;
- Trusted Web Activity Android : `com.xdsawyer.essor` ;
- Digital Asset Links exposé sous `/.well-known/assetlinks.json`.

## Architecture

- React 19 et TypeScript ;
- Next.js 16 via Vinext ;
- Vite pour le build du frontend ;
- Express pour le serveur de production ;
- MySQL pour les abonnements, les publications anonymisées du Cercle, les soutiens, signalements et présences anonymes ;
- stockage local du profil, du suivi et du journal chiffré.

## Responsabilité

ESSOR est un outil de soutien et de motivation, pas un dispositif médical. Les messages de sécurité et les coordonnées d’aide intégrés à l’application doivent rester visibles et exacts.
