const express = require("express");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const auth = require("../middleware/auth");
const router = express.Router();

// Profile
router.get("/profile", auth, async (req, res) => {
  const employee = await Employee.findById(req.user.id).select("-password");
  res.json(employee);
});

// Apply Leave
router.post("/leave", auth, async (req, res) => {
  const { date, reason } = req.body;
  const leave = new Leave({ employeeId: req.user.id, date, reason });
  await leave.save();
  res.json({ msg: "Leave applied", leave });
});

// List Leaves
router.get("/leave", auth, async (req, res) => {
  const leaves = await Leave.find({ employeeId: req.user.id });
  res.json(leaves);
});

module.exports = router;
