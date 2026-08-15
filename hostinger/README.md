# ESSOR sur Hostinger Business

Cette branche prépare ESSOR pour un hébergement Node.js géré sur Hostinger Business.

## Architecture cible

- Frontend ESSOR V2 exporté dans `hostinger-dist/public`
- Serveur Express : `hostinger/server.mjs`
- API même origine : `/api/*`
- Base : MySQL Hostinger
- Domaine cible : `https://essor-app.fr`
- Android TWA : `com.xdsawyer.essor`

Le backend Vercel et le Worker/D1 actuels restent intacts tant que la migration n'est pas validée et que le trafic n'a pas été basculé.

## Réglages de déploiement Hostinger

- Branche de staging : `hostinger-migration`
- Node.js : 22.x
- Build : `npm run build:hostinger`
- Start : `npm start`
- Entry file si demandé : `hostinger/server.mjs`
- Port : utiliser `PORT` fourni par l'hébergeur, avec fallback 3000

## Variables d'environnement

Copier les noms présents dans `hostinger/.env.example` dans hPanel. Ne jamais committer les valeurs réelles.

Variables indispensables pour le backend complet :

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `PUBLIC_ORIGIN=https://essor-app.fr`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PORTAL_URL`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

## Endpoints de contrôle

- `GET /api/health` : vérifie Node + MySQL
- `GET /api/circle?member=<uuid>` : Cercle
- `POST /api/presence` : présence réelle
- `POST /api/stripe/verify`
- `POST /api/stripe/portal`
- `POST /api/stripe/webhook`
- `POST /api/google-play/verify`

## Digital Asset Links

Le build place `public/.well-known/assetlinks.json` à la racine du site final. La réponse finale doit être disponible sans redirection sur :

`https://essor-app.fr/.well-known/assetlinks.json`

## Ordre de bascule production

1. Déployer cette branche sur une URL de prévisualisation Hostinger.
2. Créer/configurer MySQL et vérifier `/api/health`.
3. Tester Cercle, présence, Stripe et Google Play.
4. Importer les données D1 utiles dans MySQL avant la bascule.
5. Attacher `essor-app.fr` au site Hostinger.
6. Vérifier HTTPS, manifestes et Digital Asset Links.
7. Mettre à jour le webhook Stripe vers `https://essor-app.fr/api/stripe/webhook`.
8. Fusionner la migration sur `main` uniquement après validation.
9. Publier ensuite l'AAB Android 1.2.0.
