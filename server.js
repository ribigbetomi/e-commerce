import express from "express";
import dotenv from "dotenv";
import products from "./data/Products.js";
import connectDatabase from "./Config/MongoDb.js";
import ImportData from "./DataImport.js";
import productRoute from "./Routes/ProductRoutes.js";
import { errorHandler, notFound } from "./Middleware/Errors.js";
import userRouter from "./Routes/UserRoutes.js";
import orderRouter from "./Routes/OrderRoutes.js";

dotenv.config();
connectDatabase();
const app = express();
app.use(express.json());

// API
app.get("/", (req, res) => {
  res.send("API is running...");
});

// app.get("/api/products/:id", (req, res) => {
//   const product = products.find((p) => p._id === req.params.id);
//   res.json(product);
// });

// app.get("/api/products", (req, res) => {
//   res.json(products);
// });

app.use("/api/import", ImportData);
app.use("/api/products", productRoute);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
// app.get("/api/config/paypal", (req, res) => {
//   res.send(process.env.PAYPAL_CLIENT_ID);
// });
app.get("/api/config/paypal", (req, res) => {
  res.send(
    // process.env.PAYPAL_CLIENT_ID
    AdSM_bqsj7vJ7B47DxZ5L03RKFwvHjx5NoB97C9lK7LM9FVKDJJKHdN8KZCFM2T_kbDFKzfS8AOq3ILR
  );
});

// ERROR HANDLER
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 1000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
