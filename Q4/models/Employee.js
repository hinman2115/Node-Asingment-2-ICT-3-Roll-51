// models/Employee.js
const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    empId: { type: String, unique: true, index: true }, // e.g., EMP0001
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    department: { type: String },

    // Salary inputs
    basic: { type: Number, required: true, min: 0 },
    hraPercent: { type: Number, default: 20, min: 0 }, // % of basic
    daPercent: { type: Number, default: 10, min: 0 },  // % of basic
    deductions: { type: Number, default: 0, min: 0 },

    // Salary computed
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },

    // Auth fields
    passwordHash: { type: String, required: true }, // hashed generated password (emailed only once)
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compute salary before save
EmployeeSchema.pre("save", function (next) {
  const basic = this.basic || 0;
  const hra = Math.round((basic * (this.hraPercent || 0)) / 100);
  const da  = Math.round((basic * (this.daPercent  || 0)) / 100);
  const gross = basic + hra + da;
  const net = Math.max(0, gross - (this.deductions || 0));
  this.hra = hra;
  this.da = da;
  this.grossSalary = gross;
  this.netSalary = net;
  next();
});

module.exports = mongoose.model("Employee", EmployeeSchema);
