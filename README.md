# 🌱 ESSOR

**L’application qui enlève le mauvais sort.**

Application : **[ouvrir ESSOR](https://essor-app.valentin88hernandez.chatgpt.site)**

Le dossier `docs` permet à GitHub Pages de rediriger vers cette version afin d’afficher exactement la même application.

ESSOR transforme les efforts quotidiens en progrès visibles : un arbre qui grandit, des niveaux, des trophées à débloquer et des victoires à célébrer. L’expérience reste chaleureuse et ludique sans minimiser les difficultés liées à un changement d’habitude.

## Ce que l’application propose

- six parcours : tabac, alcool, cannabis, cocaïne, sucre et viande ;
- un compteur personnel avec estimations des unités évitées et de l’argent économisé ;
- un arbre évolutif, des niveaux XP et six récompenses ;
- un bilan quotidien sans remise à zéro punitive ;
- des repères santé adaptés à chaque parcours ;
- une pause guidée de trois minutes pour traverser une envie ;
- des numéros d’aide officiels toujours accessibles ;
- un profil local avec prénom et avatar, sans compte externe ;
- un verrouillage par code PIN à quatre chiffres à chaque ouverture ;
- un mode discret avec un nom et une icône d’installation neutres ;
- des données conservées uniquement dans le navigateur (localStorage).

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

## Architecture

- React 19 et TypeScript ;
- Next.js 16 via Vinext ;
- Vite et Cloudflare Workers pour le rendu et l’hébergement ;
- CSS natif pour l’identité visuelle et les animations ;
- aucune base de données requise pour le MVP.

## Responsabilité

ESSOR est un outil de soutien et de motivation, pas un dispositif médical. Les messages de sécurité et les coordonnées d’aide intégrés à l’application doivent rester visibles et exacts.
