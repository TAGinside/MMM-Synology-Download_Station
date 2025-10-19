const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-Synology-Download_Station helper started...");
    this.config = {};
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;
    } else if (notification === "GET_TASKS") {
      this.getDownloadStationTasks();
    }
  },

  getDownloadStationTasks: function () {
    // Simulate an API call to Synology Download Station (to be replaced with real API code)
    // For development, return static example data
    const exampleTasks = [
      { title: "Download Movie", status: "Downloading", percent: 45 },
      { title: "Update Linux ISO", status: "Finished", percent: 100 }
    ];

    // Send data back to module
    this.sendSocketNotification("TASKS_DATA", exampleTasks);
  }
});
