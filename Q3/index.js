const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");

const app = express();

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Redis client
const redisClient = new Redis({
  host: "127.0.0.1",  // Redis server host
  port: 6379,         // Redis server port
});

// Session setup with Redis
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: "my_super_secret_key",   // use strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 10 }, // 10 min session expiry
  })
);

// Dummy user (replace with DB check)
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
    return res.redirect("/dashboard");
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
