const NodeHelper = require("node_helper");
const axios = require("axios");
const https = require("https");
const querystring = require("querystring");

module.exports = NodeHelper.create({
  start() {
    console.log("MMM-Synology-Download_Station helper lancé");
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
        timeout: 60000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });

    } else if (notification === "GET_TASKS") {
      this.getTasks();
    } else if (notification === "CHECK_API") {
      this.getApiInfo();
    }
  },

  async login() {
    try {
      const params = querystring.stringify({
        api: "SYNO.API.Auth",
        method: "login",
        version: "7",
        account: this.config.user,
        passwd: this.config.passwd,
        session: "DownloadStation",
        format: "sid"
      });

      const response = await this.session.get(`/auth.cgi?${params}`);

      if (response.data && response.data.success) {
        console.log("Connexion OK, SID récupéré");
        return response.data.data.sid;
      } else {
        console.error("Connexion échouée :", response.data);
        return null;
      }
    } catch (error) {
      console.error("Erreur login API Synology :", error.message || error);
      return null;
    }
  },

  async getTasks() {
    if (!this.config) {
      console.error("Pas de configuration");
      return;
    }

    const sid = await this.login();
    console.log("SID récupéré et utilisé :", sid);

    if (!sid) {
      this.sendSocketNotification("TASKS_DATA", []);
      return;
    }

    try {
      const response = await this.session.get("/DownloadStation/task.cgi", {
        params: {
          api: "SYNO.DownloadStation.Task",
          method: "list",
          version: "1",
          _sid: sid
        }
      });

      console.log("Réponse API tâches (brute) :", JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        this.sendSocketNotification("TASKS_DATA", response.data.data.tasks);
      } else {
        this.sendSocketNotification("TASKS_DATA", []);
      }
    } catch (error) {
      console.error("Erreur récupération tâches :", error.message || error);
      this.sendSocketNotification("TASKS_DATA", []);
    }
  },

  async getApiInfo() {
    const sid = await this.login();
    if (!sid) {
      console.log("Impossible de récupérer le SID");
      return;
    }

    try {
      const response = await this.session.get("/query.cgi", {
        params: {
          api: "SYNO.API.Info",
          version: "1",
          method: "query",
          query: "SYNO.DownloadStation.Task",
          _sid: sid
        }
      });

      console.log("API Info SYNO.DownloadStation.Task :", JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Erreur lors de la récupération des infos API :", error.message || error);
    }
  }
});
