const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");

const router = express.Router();

// Show categories
router.get("/categories", async (req, res) => {
  const categories = await Category.find();
  res.render("admin/categories", { categories });
});

// Add category
router.post("/categories", async (req, res) => {
  await Category.create({ name: req.body.name, parent: req.body.parent || null });
  res.redirect("/admin/categories");
});

// Show products
router.get("/products", async (req, res) => {
  const products = await Product.find().populate("category");
  const categories = await Category.find();
  res.render("admin/products", { products, categories });
});

// Add product
router.post("/products", async (req, res) => {
  await Product.create({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category
  });
  res.redirect("/admin/products");
});

module.exports = router;
