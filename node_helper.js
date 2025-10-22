const NodeHelper = require("node_helper");
const axios = require("axios");
const https = require("https");

module.exports = NodeHelper.create({
  start() {
    console.log("MMM-Synology-Download_Station helper lancé");
    this.sid = null;
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
      console.log("Configuration reçue :", this.config);

      this.config.useHttps = this.config.useHttps || false;
      if (!this.config.port) {
        this.config.port = this.config.useHttps ? 5001 : 5000;
      }
      this.protocol = this.config.useHttps ? "https" : "http";
      this.baseUrl = `${this.protocol}://${this.config.host}:${this.config.port}/webapi`;

      this.session = axios.create({
        baseURL: this.baseUrl,
        timeout: 10000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Autoriser cert. auto-signés
      });

    } else if (notification === "GET_TASKS") {
      this.getTasks();
    }
  },

  async login() {
    try {
      const response = await this.session.get("/auth.cgi", {
        params: {
          api: "SYNO.API.Auth",
          method: "login",
          version: "7",
          account: this.config.user,
          passwd: this.config.passwd,
          session: "DownloadStation",
          format: "sid"
        }
      });
      if (response.data && response.data.success) {
        this.sid = response.data.data.sid;
        console.log("Connexion OK, SID récupéré");
        return true;
      } else {
        console.error("Connexion échouée :", response.data);
        return false;
      }
    } catch (error) {
      console.error("Erreur login API Synology :", error);
      return false;
    }
  },

  async logout() {
    if (!this.sid) return;
    try {
      await this.session.get("/auth.cgi", {
        params: {
          api: "SYNO.API.Auth",
          method: "logout",
          version: "7",
          session: "DownloadStation",
          sid: this.sid
        }
      });
      console.log("Déconnexion OK");
      this.sid = null;
    } catch (error) {
      console.error("Erreur logout :", error);
    }
  },

  async getTasks() {
    if (!this.config) {
      console.error("Pas de configuration");
      return;
    }

    if (!(await this.login())) {
      this.sendSocketNotification("TASKS_DATA", []);
      return;
    }

    try {
      const response = await this.session.get("/entry.cgi", {
        params: {
          api: "SYNO.DownloadStation.Task",
          method: "list",
          version: "1",
          _sid: this.sid
        }
      });

      if (response.data && response.data.success) {
        this.sendSocketNotification("TASKS_DATA", response.data.data.tasks);
      } else {
        this.sendSocketNotification("TASKS_DATA", []);
      }
    } catch (error) {
      console.error("Erreur récupération tâches :", error);
      this.sendSocketNotification("TASKS_DATA", []);
    } finally {
      await this.logout();
    }
  }
});
