const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  date: String,
  reason: String,
  grant: { type: String, default: "Pending" } // Yes / No / Pending
});

module.exports = mongoose.model("Leave", leaveSchema);
