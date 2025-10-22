const NodeHelper = require("node_helper");
const Synology = require("synology-api");
const FileType = require('file-type');
const fs = require('fs');

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-Synology-Download_Station helper started...");
    this.config = null;
    this.syno = null;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
      console.log("Configuration reçue :", this.config);
      this.syno = new Synology(
        this.config.host,
        this.config.port,
        this.config.user,
        this.config.passwd,
        false, // https false si pas activé
        false, // cert_verify false pour éviter problème certificat auto-signé
        7,     // version DSM 7
        false  // debug false, mettez true pour journaliser les appels API
      );
      console.log("Connexion à Synology API initialisée");
    } else if (notification === "GET_TASKS") {
      this.getDownloadStationTasks();
    } else if (notification === "DETECT_FILE_TYPE") {
      this.detectFileType(payload); // payload = chemin fichier local
    }
  },

  getDownloadStationTasks: function () {
    if (!this.syno) {
      console.error("Synology API non initialisée");
      return;
    }

    console.log("Connexion à Synology pour récupération des tâches...");
    this.syno.Auth.Connect().then(() => {
      return this.syno.DS.getTasks();
    }).then((response) => {
      console.log("Réponse API reçu :", response);
      if (response && response.success) {
        let tasks = [];
        const allTasks = response.data.tasks || [];
        allTasks.forEach(task => {
          tasks.push({
            title: task.title,
            status: task.status,
            percent: task.additional && task.additional.percent ? task.additional.percent : 0
          });
        });
        this.sendSocketNotification("TASKS_DATA", tasks);
      } else {
        this.sendSocketNotification("TASKS_DATA", []);
      }
      return this.syno.Auth.Logout();
    }).catch((error) => {
      console.error("Erreur Synology API :", error);
      this.sendSocketNotification("TASKS_DATA", []);
    });
  },

  // Nouvelle fonction pour détecter le type MIME d’un fichier avec file-type
  detectFileType: async function (filePath) {
    try {
      const stream = fs.createReadStream(filePath);
      const fileType = await FileType.fromStream(stream);
      console.log(`Type détecté pour ${filePath} :`, fileType);
      this.sendSocketNotification("FILE_TYPE_DETECTED", { filePath, fileType });
    } catch (error) {
      console.error("Erreur détection type fichier :", error);
      this.sendSocketNotification("FILE_TYPE_DETECTED", { filePath, fileType: null });
    }
  }

});
