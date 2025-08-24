const express = require("express");
const path = require("path");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const fs = require("fs");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use("uploads", express.static(path.join(__dirname, "uploads")));

// Set EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Routes
app.get("/", (req, res) => {
  res.render("form", { errors: {}, old: {} });
});

app.post(
  "/submit",
  upload.fields([{ name: "profilePic", maxCount: 1 }, { name: "otherPics", maxCount: 5 }]),
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 5 }).withMessage("Password must be at least 5 chars"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    }),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("gender").notEmpty().withMessage("Select gender"),
    body("hobbies").notEmpty().withMessage("Select at least one hobby"),
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("form", {
        errors: errors.mapped(),
        old: req.body,
      });
    }

    const data = {
      username: req.body.username,
      email: req.body.email,
      gender: req.body.gender,
      hobbies: Array.isArray(req.body.hobbies) ? req.body.hobbies : [req.body.hobbies],
      profilePic: req.files["profilePic"] ? req.files["profilePic"][0].filename : null,
      otherPics: req.files["otherPics"] ? req.files["otherPics"].map(f => f.filename) : [],
    };

    // Save data in JSON file for download
    const filePath = path.join(__dirname, "uploads", `${data.username}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.render("result", { data, filePath: `/download/${data.username}` });
  }
);

// Download Route
app.get("/download/:username", (req, res) => {
  const filePath = path.join(__dirname, "uploads", `${req.params.username}.json`);
  res.download(filePath);
});

// Start server
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
