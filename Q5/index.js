const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employee");

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/employeeDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
