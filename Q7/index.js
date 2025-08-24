// app.js
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const app = express();

mongoose.connect("mongodb://localhost:27017/shopcart");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://localhost:27017/shopcart" })
  })
);

// Routes
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");

app.use("/admin", adminRoutes);
app.use("/", userRoutes);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
