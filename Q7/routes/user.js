const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");

const router = express.Router();

// Homepage - show categories
router.get("/", async (req, res) => {
  const categories = await Category.find({ parent: null });
  res.render("user/home", { categories });
});

// Show products in category
router.get("/category/:id", async (req, res) => {
  const products = await Product.find({ category: req.params.id });
  res.render("user/products", { products });
});

// Cart (stored in session)
router.get("/cart", (req, res) => {
  res.render("user/cart", { cart: req.session.cart || [] });
});

router.post("/cart/add/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!req.session.cart) req.session.cart = [];
  req.session.cart.push({ product, qty: 1 });
  res.redirect("/cart");
});

// Checkout
router.post("/checkout", async (req, res) => {
  if (!req.session.cart) return res.redirect("/cart");

  let total = 0;
  let items = [];
  req.session.cart.forEach((item) => {
    total += item.product.price * item.qty;
    items.push({ product: item.product._id, qty: item.qty });
  });

  await Order.create({
    user: req.session.user._id,
    items,
    total
  });

  req.session.cart = [];
  res.send("Order placed successfully!");
});

module.exports = router;
