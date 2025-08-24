require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
const nodemailer = require("nodemailer");

const Employee = require("./models/Employee");

const app = express();

// ----- DB -----
mongoose
  .connect(process.env.MONGO_URI, { dbName: "erp_demo" })
  .then(() => console.log("MongoDB connected"))
  .catch((e) => console.error("Mongo error:", e));

// ----- Views & Middleware -----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public"))); // optional

// ----- Sessions (Mongo-backed) -----
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "erp_demo",
      collectionName: "sessions",
      ttl: 60 * 60 * 2, // 2 hours
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 2, httpOnly: true },
  })
);

// ----- Simple Admin (hard-coded for demo) -----
const ADMIN = {
  username: "admin",
  // Hash for "Admin@123" for demo (but we compare plain for simplicity below)
  password: "Admin@123",
};

// ----- Mail Transport -----
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ----- Auth middleware -----
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect("/login");
}

// ----- Routes -----
// Home -> Dashboard or Login
app.get("/", (req, res) => {
  if (req.session.admin) return res.redirect("/dashboard");
  return res.redirect("/login");
});

// Login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    req.session.admin = { username };
    return res.redirect("/dashboard");
  }
  return res.status(401).render("login", { error: "Invalid credentials" });
});

// Dashboard
app.get("/dashboard", requireAdmin, async (req, res) => {
  const totalEmployees = await Employee.countDocuments({});
  res.render("dashboard", { admin: req.session.admin, totalEmployees });
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Employees: index
app.get("/employees", requireAdmin, async (req, res) => {
  const employees = await Employee.find().sort({ createdAt: -1 });
  res.render("employees/index", { employees });
});

// Employees: new
app.get("/employees/new", requireAdmin, (req, res) => {
  res.render("employees/new", { errors: null, values: {} });
});

// Utility: generate next empId like EMP0001
async function generateEmpId() {
  const last = await Employee.findOne().sort({ createdAt: -1 }).select("empId");
  let nextNum = 1;
  if (last && last.empId) {
    const n = parseInt(last.empId.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(n)) nextNum = n + 1;
  }
  return `EMP${String(nextNum).padStart(4, "0")}`;
}

// Utility: random plain password
function generatePlainPassword(length = 10) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

// Employees: create
app.post("/employees", requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, department, basic, hraPercent, daPercent, deductions } = req.body;

    if (!name || !email || !basic) {
      return res.status(400).render("employees/new", {
        errors: "Name, Email, and Basic Salary are required.",
        values: req.body,
      });
    }

    const empId = await generateEmpId();
    const plainPassword = generatePlainPassword(); // emailed to employee

    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const employee = await Employee.create({
      empId,
      name,
      email,
      phone,
      department,
      basic: Number(basic),
      hraPercent: Number(hraPercent || 20),
      daPercent: Number(daPercent || 10),
      deductions: Number(deductions || 0),
      passwordHash,
    });

    // Send email with credentials (only once)
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: employee.email,
      subject: `Welcome to ERP | Your Employee ID & Password`,
      html: `
        <p>Dear ${employee.name},</p>
        <p>Your employee account has been created.</p>
        <ul>
          <li><strong>Employee ID:</strong> ${employee.empId}</li>
          <li><strong>Temporary Password:</strong> ${plainPassword}</li>
        </ul>
        <p>Please login to the ERP portal and change your password immediately.</p>
        <p>Regards,<br/>ERP Admin</p>
      `,
    });

    return res.redirect(`/employees/${employee._id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).render("employees/new", {
      errors: "Could not create employee. Possibly duplicate email.",
      values: req.body,
    });
  }
});

// Employees: show
app.get("/employees/:id", requireAdmin, async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.redirect("/employees");
  res.render("employees/show", { employee });
});

// Employees: edit
app.get("/employees/:id/edit", requireAdmin, async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.redirect("/employees");
  res.render("employees/edit", { employee, errors: null });
});

// Employees: update
app.put("/employees/:id", requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, department, basic, hraPercent, daPercent, deductions } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.redirect("/employees");

    employee.name = name;
    employee.email = email;
    employee.phone = phone;
    employee.department = department;
    employee.basic = Number(basic);
    employee.hraPercent = Number(hraPercent || 20);
    employee.daPercent = Number(daPercent || 10);
    employee.deductions = Number(deductions || 0);

    // salary recomputed in pre('save')
    await employee.save();
    res.redirect(`/employees/${employee._id}`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Update failed");
  }
});

// Employees: delete
app.delete("/employees/:id", requireAdmin, async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.redirect("/employees");
});

// ----- Start -----
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ERP Admin running at http://localhost:${port}`));
