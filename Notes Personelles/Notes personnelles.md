# notes amélioration
## graphiques
- pouvoir avoir une vue si en pause (logo gris)
## fonctionnels



# Script de lancement MM

```
cd ~/MagicMirror/
npm start
```

# suppression complète du module et réinstallation en une fois
```
cd ~/MagicMirror/modules
rm -rf MMM-Synology-Download_Station
git clone --branch Beta https://github.com/TAGinside/MMM-Synology-Download_Station
cd MMM-Synology-Download_Station
npm install
```

# Update Magic mirror

Update Magic mirror
```
cd ~/MagicMirror/
git pull && node --run install-mm
```

# explication comment creer un user dédié pour synology d'abord

ne pas oublié de faire ça

## Update node.js

Je pense que pour que mon module fonctionne il faut la verison 20 de node.js
Installez ou utilisez une autre version de Node.js, par exemple la version 20 (LTS) :
```
nvm install 22
nvm use 22
nvm alias default 22
```
Vérifiez que vous utilisez bien la version 22.18 ou plus haut mais pas la 23 :
```
node -v
```
Une fois que la version 23 n'est plus active, désinstallez-la avec :
```
nvm uninstall 23
```
Ensuite, pour vérifier que la désinstallation a réussi, listez les versions encore installées avec :
```
nvm ls
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


# Notes A part
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

Fait important si le node.js est trop vieux ou pas adapté la commande suivante NE FONCTIONNE PAS
```
node --run install-mm
```

impossible d'installer le Magic Mirror
