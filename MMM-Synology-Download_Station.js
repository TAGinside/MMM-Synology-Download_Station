Module.register("MMM-Synology-Download_Station", {
  defaults: {
    updateInterval: 10 * 1000,
    maxItems: 10,
    compactMode: false,
    displayColumns: {
      status_icon: true,
      title: true,
      percent_completed: true,
      size: true,
      speed_download: true,
      speed_upload: true
    },
    displayTasks: {
      seeding: true,
      downloading: true,
      finished: true,
      error: true,
      paused: true
    }
  },

  start() {
    this.tasks = [];
    this.sendSocketNotification("CONFIG", this.config);
    this.updateTasks();
    this.scheduleUpdate();
  },

  scheduleUpdate() {
    setInterval(() => {
      this.updateTasks();
    }, this.config.updateInterval);
  },

  updateTasks() {
    this.sendSocketNotification("GET_TASKS");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TASKS_DATA") {
      if (payload && Array.isArray(payload)) {
        this.tasks = payload.filter(task =>
          this.config.displayTasks[task.status] !== false
        ).slice(0, this.config.maxItems);
      } else {
        this.tasks = [];
      }
      this.updateDom(1000);
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "synology-wrapper";

    if (!this.tasks.length) {
      wrapper.innerHTML = "<div class='no-tasks'>Aucune tâche en cours</div>";
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "synology-table";

    // La ligne d'en-tête
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    if (this.config.displayColumns.status_icon) {
      const thIcon = document.createElement("th");
      thIcon.style.width = "30px";
      trHead.appendChild(thIcon);
    }
    if (this.config.displayColumns.title) {
      const thTitle = document.createElement("th");
      thTitle.textContent = "Titre";
      trHead.appendChild(thTitle);
    }
    if (this.config.displayColumns.percent_completed) {
      const thPercent = document.createElement("th");
      thPercent.textContent = "%";
      trHead.appendChild(thPercent);
    }
    if (this.config.displayColumns.speed_download) {
      const thSpeedD = document.createElement("th");
      thSpeedD.textContent = "↓ Débit";
      trHead.appendChild(thSpeedD);
    }
    if (this.config.displayColumns.speed_upload) {
      const thSpeedU = document.createElement("th");
      thSpeedU.textContent = "↑ Débit";
      trHead.appendChild(thSpeedU);
    }
    if (this.config.displayColumns.size) {
      const thSize = document.createElement("th");
      thSize.textContent = "Taille";
      trHead.appendChild(thSize);
    }

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Corps du tableau
    const tbody = document.createElement("tbody");
    this.tasks.forEach(task => {
      const tr = document.createElement("tr");

      // Icône statut
      if (this.config.displayColumns.status_icon) {
        const tdIcon = document.createElement("td");
        tdIcon.style.textAlign = "center";

        let icon = "⏳"; // default
        switch (task.status) {
          case "downloading": icon = "⬇️"; break;
          case "seeding": icon = "⬆️"; break;
          case "finished": icon = "✔️"; break;
          case "error": icon = "❌"; break;
          case "paused": icon = "⏸️"; break;
        }
        tdIcon.textContent = icon;
        tr.appendChild(tdIcon);
      }

      // Titre
      if (this.config.displayColumns.title) {
        const tdTitle = document.createElement("td");
        tdTitle.textContent = task.title || "Inconnu";
        tr.appendChild(tdTitle);
      }

      // % avancé
      if (this.config.displayColumns.percent_completed) {
        const tdPercent = document.createElement("td");
        tdPercent.textContent =
          task.additional && task.additional.percent
            ? `${task.additional.percent}%`
            : "N/A";
        tdPercent.style.textAlign = "center";
        tr.appendChild(tdPercent);
      }

      // Vitesse download
      if (this.config.displayColumns.speed_download) {
        const tdSpeedD = document.createElement("td");
        tdSpeedD.textContent =
          task.additional && task.additional.speed_download
            ? this.formatSpeed(task.additional.speed_download)
            : "-";
        tdSpeedD.style.textAlign = "right";
        tr.appendChild(tdSpeedD);
      }

      // Vitesse upload
      if (this.config.displayColumns.speed_upload) {
        const tdSpeedU = document.createElement("td");
        tdSpeedU.textContent =
          task.additional && task.additional.speed_upload
            ? this.formatSpeed(task.additional.speed_upload)
            : "-";
        tdSpeedU.style.textAlign = "right";
        tr.appendChild(tdSpeedU);
      }

      // Taille
      if (this.config.displayColumns.size) {
        const tdSize = document.createElement("td");
        tdSize.textContent = this.formatSize(task.size);
        tdSize.style.textAlign = "right";
        tr.appendChild(tdSize);
      }

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    return wrapper;
  },

  formatSize(bytes) {
    if (!bytes) return "-";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < sizes.length -1) {
      size /= 1024;
      i++;
    }
    return size.toFixed(1) + " " + sizes[i];
  },

  formatSpeed(bytesPerSec) {
    return this.formatSize(bytesPerSec) + "/s";
  }
});
