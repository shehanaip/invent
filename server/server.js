const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");

const connectDB = require("./config/db");

// Load env
dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// ================= CORS =================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL
    ],
    credentials: true
  })
);

// ================= BODY PARSER =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= PASSPORT =================
app.use(passport.initialize());
require("./config/passport");

// ================= API ROUTES =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/auth", require("./routes/googleAuth"));

app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/suppliers", require("./routes/supplierRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/cashflow", require("./routes/cashflow"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/stores", require("./routes/store"));
app.use("/api/payments", require("./routes/payments"));

// ================= STATIC FILES =================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Inventory API is running");
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);

  res.status(500).json({
    msg: err.message || "Internal Server Error"
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});