const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session setup
app.use(
  session({
    store: new FileStore(),
    secret: "secret_key_here",       // Change to a strong secret
    resave: false,
    saveUninitialized: false,
  })
);

// Dummy user (in real apps, check DB)
const USER = {
  username: "admin",
  password: "12345",
};

// Routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && password === USER.password) {
    req.session.user = username;
    return res.redirect("/dashbord");
  }
  res.render("login", { error: "Invalid credentials" });
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", { user: req.session.user });
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send("Error logging out");
    }
    res.redirect("/login");
  });
});

// Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
