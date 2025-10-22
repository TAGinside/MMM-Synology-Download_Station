Module.register("MMM-Synology-Download_Station", {
  defaults: {
    updateInterval: 60 * 1000, // actualisation toutes les 60 secondes
    animationSpeed: 1000,
    maxItems: 5,               // nombre max de tâches affichées
  },

  start() {
    Log.info("MMM-Synology-Download_Station démarre...");
    this.tasks = [];
    this.sendSocketNotification("CONFIG", this.config);
    this.getTasks();
    this.scheduleUpdate();
  },

  getTasks() {
    this.sendSocketNotification("GET_TASKS");
  },

  scheduleUpdate() {
    setInterval(() => {
      this.getTasks();
    }, this.config.updateInterval);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS_DATA") {
      if (payload && Array.isArray(payload)) {
        this.tasks = payload.slice(0, this.config.maxItems);
      } else {
        this.tasks = [];
      }
      this.updateDom(this.config.animationSpeed);
    }
  },

  getStyles() {
    return ["MMM-Synology-Download_Station.css"];
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (!this.tasks.length) {
      wrapper.innerHTML = "Pas de tâches en cours";
      wrapper.className = "dimmed small";
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "synology-download-station";

    // En-tête
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Titre", "Statut", "Progression"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Corps
    const tbody = document.createElement("tbody");
    this.tasks.forEach(task => {
      const tr = document.createElement("tr");

      // Titre
      const tdTitle = document.createElement("td");
      tdTitle.textContent = task.title || "N/A";
      tr.appendChild(tdTitle);

      // Statut
      const tdStatus = document.createElement("td");
      tdStatus.textContent = this.translateStatus(task.status);
      tr.appendChild(tdStatus);

      // Progression en %
      const percent = task.additional && typeof task.additional.percent === "number"
        ? Math.round(task.additional.percent) : 0;
      const tdProgress = document.createElement("td");
      tdProgress.textContent = `${percent}%`;
      tr.appendChild(tdProgress);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    return wrapper;
  },

  translateStatus(status) {
    // Traduction basique des statuts Synology
    const map = {
      "downloading": "Téléchargement",
      "seeding": "Partage",
      "finished": "Terminé",
      "paused": "En pause",
      "error": "Erreur",
      "waiting": "En attente",
      "hash_checking": "Vérification",
      "extracting": "Extraction"
    };
    return map[status] || status;
  }
});
