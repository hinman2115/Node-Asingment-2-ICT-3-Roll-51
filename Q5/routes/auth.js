const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const router = express.Router();

// Register (for testing)
router.post("/register", async (req, res) => {
  const { name, email, password, department, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const employee = new Employee({ name, email, password: hashedPassword, department, role });
  await employee.save();
  res.json({ msg: "Employee registered" });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const employee = await Employee.findOne({ email });
  if (!employee) return res.status(400).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign({ id: employee._id }, "jwtsecret", { expiresIn: "1h" });
  res.json({ token, employee });
});

module.exports = router;
