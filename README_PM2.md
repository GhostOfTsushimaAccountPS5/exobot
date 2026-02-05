# Utilisation de PM2 pour faire tourner ExoBot en continu

## Installation de PM2

Si ce n'est pas déjà fait, installez PM2 globalement avec la commande :

```bash
npm install -g pm2
```

## Démarrer le bot avec PM2

Lancez votre bot avec PM2 pour qu'il tourne en arrière-plan et redémarre automatiquement en cas de crash :

```bash
pm2 start index.js --name exobot
```

## Gérer le processus PM2

- Voir les processus en cours :

```bash
pm2 list
```

- Voir les logs du bot :

```bash
pm2 logs exobot
```

- Redémarrer le bot :

```bash
pm2 restart exobot
```

- Arrêter le bot :

```bash
pm2 stop exobot
```

## Démarrage automatique au reboot

Pour que PM2 redémarre automatiquement votre bot après un redémarrage de la machine, exécutez :

```bash
pm2 startup
pm2 save
```

Cela configure PM2 pour démarrer au boot avec les processus sauvegardés.

---

Avec cette configuration, vous n'aurez plus besoin d'exécuter `node index.js` manuellement, votre bot fonctionnera en continu en arrière-plan.
