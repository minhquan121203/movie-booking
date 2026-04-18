import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Product from "../models/product.model.js";
import { generateSlug } from "../utils/slug.js";
dotenv.config();

const seedProducts = async () => {
  await connectDB();
  console.log("🔍 Checking Products...");

  await Product.deleteMany();
  console.log("🗑️ Deleted old products");

  // 🍿 POPCORN
  const popcorns = [
    {
      name: "Bắp rang bơ (M)",
      price: 45000,
      originalPrice: 50000,
      category: "Popcorn",
      size: "M",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/popcorn1.jpg",
      calories: 320,
      tags: ["popcorn", "classic"],
    },
    {
      name: "Bắp rang bơ (L)",
      price: 55000,
      originalPrice: 60000,
      category: "Popcorn",
      size: "L",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/popcorn2.jpg",
      calories: 450,
      tags: ["popcorn", "large"],
    },
    {
      name: "Bắp caramel (L)",
      price: 65000,
      originalPrice: 70000,
      category: "Popcorn",
      size: "L",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/popcorn3.jpg",
      calories: 480,
      tags: ["caramel"],
    },
  ];

  // 🥤 DRINKS
  const drinks = [
    {
      name: "Pepsi (M)",
      price: 35000,
      category: "Drink",
      size: "M",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/pepsi.jpg",
      calories: 150,
      tags: ["drink", "pepsi"],
    },
    {
      name: "Coca Cola (L)",
      price: 40000,
      category: "Drink",
      size: "L",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/cocacola.jpg",
      calories: 200,
      tags: ["drink", "coke"],
    },
    {
      name: "Trà đào (L)",
      price: 45000,
      category: "Drink",
      size: "L",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/peachtea.jpg",
      calories: 180,
      tags: ["tea", "peach"],
    },
  ];

  // 🌭 SNACKS
  const snacks = [
    {
      name: "Hotdog",
      price: 55000,
      category: "Snack",
      size: "N/A",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/hotdog.jpg",
      calories: 300,
      tags: ["snack"],
    },
    {
      name: "Khoai tây chiên",
      price: 50000,
      category: "Snack",
      size: "N/A",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/fries.jpg",
      calories: 380,
      tags: ["snack", "fries"],
    },
  ];

  // Insert base products BEFORE combos to get ObjectId
  const baseProducts = [...popcorns, ...drinks, ...snacks].map((p) => ({
    ...p,
    slug: generateSlug(p.name),
    stockQuantity: 999,
    inStock: true,
  }));

  const insertedBase = await Product.insertMany(baseProducts);

  // Helper find
  const findByName = (name) => insertedBase.find((p) => p.name === name)?._id;

  // 🍿🥤 COMBOS
  const combos = [
    {
      name: "Combo 1 (Bắp M + Pepsi M)",
      price: 75000,
      originalPrice: 90000,
      category: "Combo",
      size: "N/A",
      comboItems: [
        { product: findByName("Bắp rang bơ (M)"), quantity: 1 },
        { product: findByName("Pepsi (M)"), quantity: 1 },
      ],
      slug: generateSlug("Combo 1 (Bắp M + Pepsi M)"),
      imageUrl: "https://res.cloudinary.com/demo/image/upload/combo1.jpg",
    },
    {
      name: "Combo 2 (Bắp L + Coca L)",
      price: 85000,
      originalPrice: 100000,
      category: "Combo",
      size: "N/A",
      comboItems: [
        { product: findByName("Bắp rang bơ (L)"), quantity: 1 },
        { product: findByName("Coca Cola (L)"), quantity: 1 },
      ],
      slug: generateSlug("Combo 2 (Bắp L + Coca L)"),
      imageUrl: "https://res.cloudinary.com/demo/image/upload/combo2.jpg",
    },
  ];

  await Product.insertMany(combos);

  console.log(`🎉 Imported ${insertedBase.length + combos.length} products`);
  process.exit();
};

seedProducts();
