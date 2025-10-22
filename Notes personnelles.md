# Script de lancement MM

```
cd ~/MagicMirror/
npm start
```

# Update Magic mirror

Update Magic mirror
```
cd ~/MagicMirror/
git pull && node --run install-mm
```

## Update node.js

Je pense que pour que mon module fonctionne il faut la verison 20 de node.js

```
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
cd ~/MagicMirror/
git pull
npm run install-mm
```

## backup/restaure

Faire Backup
```
bash -c  "$(curl -sL https://raw.githubusercontent.com/sdetweil/MagicMirror-backup-restore/main/mm_backup.sh)" with any parms
```

Faire Restauration
```
bash -c  "$(curl -sL https://raw.githubusercontent.com/sdetweil/MagicMirror-backup-restore/main/mm_restore.sh)" with any parms
```


### Notes A part
Après avoir fait `npm install` api synology

```
cd ~/MagicMirror/modules/MMM-Synology-Download_Station
ls node_modules
```

`Vérifier que le dossier node_modules contenant synology-api existe`
`Confirmez que le dossier node_modules/synology-api est bien présent dans le dossier du module.`

### comment fonctionne magic mirror et dépendances

Quand il y a plusieur dépendances à installé et simplifié le code il faut ajouter dans le package.json les dépendances comme ça lors du `npm install` il fera toutes les opérations et cela simplifie l'installation

npm install - `clean install`
```
npm ci
```