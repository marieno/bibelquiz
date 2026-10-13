# Bible Tycoon V23.3 — Village partagé

- Salons privés avec code à six chiffres, cinq joueurs actifs maximum.
- SQLite côté serveur, toutes les actions économiques et de construction sont validées et exécutées dans une transaction.
- Les joueurs récupèrent le même village et les mêmes ressources; les actions concurrentes sont sérialisées.
- Actualisation toutes les 1,8 secondes, sans chevauchement de requêtes, délai de 9 secondes.
- Déconnexion automatique des membres inactifs après 90 secondes; les salons sont persistants.
- Le village solo local est préservé lorsque l'on quitte le salon.
- Les sessions de salon ne survivent pas encore au rechargement de page (rejoindre avec le code).
- L'hôte n'a pas de privilèges spéciaux; tout joueur peut construire et utiliser les ressources partagées.
- Tests automatiques: création, adhésion, construction commune, rejet des collisions, compilation Python et syntaxe JS.
- À valider: fonctionnement sur 2 à 5 vrais téléphones, accès aux données SQLite sur PythonAnywhere, stabilité des sessions et UX mobile.
