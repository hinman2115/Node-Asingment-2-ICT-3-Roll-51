const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // store hashed password
  department: String,
  role: String
});

module.exports = mongoose.model("Employee", employeeSchema);
