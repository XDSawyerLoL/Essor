# ESSOR Android

Application Android `com.xdsawyer.essor`, générée comme Trusted Web Activity et ciblant Android API 36.

## Facturation Google Play

La passerelle Google Play Billing est activée. Les deux abonnements attendus dans Play Console sont :

- `essor_plus_monthly` — 6,99 € par mois, essai gratuit de 4 jours ;
- `essor_plus_annual` — 59,99 € par an, essai gratuit de 4 jours.

La version Android ne redirige jamais vers Stripe. La version web continue d’utiliser Stripe.

La validation et l’acquittement des achats passent par `/api/google-play/verify`. Le secret Sites `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` doit contenir le JSON complet d’un compte de service autorisé dans Play Console ; sans lui, aucun abonnement Android n’est déverrouillé.

## Compilation GitHub Actions

Le workflow `.github/workflows/android-build.yml` produit :

- un APK debug installable pour les essais ;
- un AAB release, signé lorsque les quatre secrets GitHub suivants sont configurés : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

L’AAB définitif doit être signé avec une clé d’upload conservée durablement. Ne jamais committer cette clé ni ses mots de passe.

## Publication Play Console

Après la première mise en ligne, ajouter l’empreinte SHA-256 fournie par Play App Signing au fichier `public/.well-known/assetlinks.json`. Sans cette association, Android ouvre le site dans un onglet sécurisé au lieu du plein écran natif.
