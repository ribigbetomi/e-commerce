import express from "express";
import asyncHandler from "express-async-handler";
import { admin, protect } from "../Middleware/AuthMiddleware.js";
import Order from "../Models/OrderModel.js";
import axios from "axios";
// import dotenv from "dotenv";
import stripe from "stripe";
const orderRouter = express.Router();
// dotenv.config();

// CREATE ORDER
orderRouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
      return;
    } else {
      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createOrder = await order.save();
      res.status(201).json(createOrder);
    }
  })
);

// USER LOGIN ORDERS
orderRouter.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.find({ user: req.user._id }).sort({ _id: -1 });
    res.json(order);
  })
);

// ADMIN GET ALL ORDERS
orderRouter.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .sort({ _id: -1 })
      .populate("user", "id name email");
    res.json(orders);
  })
);

// GET ORDER BY ID
orderRouter.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

// ORDER IS PAID
orderRouter.put(
  "/:id/pay",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

// PAYSTACK ORDER IS PAID
orderRouter.put(
  "/:id/:ref/paystack",
  protect,
  asyncHandler(async (req, res) => {
    let secret = process.env.PAYSTACK_SECRET;
    let orderId = req.params.id;
    // console.log(orderId);
    let ref = req.params.ref;
    // console.log(ref);
    // console.log(secret, "secret");
    let output;
    const order = await Order.findById(orderId);
    // console.log(order, "route");
    try {
      await axios
        .get(`https://api.paystack.co/transaction/verify/${ref}`, {
          headers: {
            authorization: `Bearer ${secret}`,
            "content-type": "application/json",
            "cache-control": "no-cache",
          },
        })
        .then((response) => {
          output = response;
        })
        .catch((error) => {
          output = error;
        });
      // console.log(output, "output");

      if (output.data.message === "Verification successful") {
        if (order) {
          order.isPaid = true;
          order.paidAt = Date.now();

          const updatedOrder = await order.save();
          // console.log(updatedOrder, "update");
          res.json(updatedOrder);
        } else {
          res.status(404);
          throw new Error("Order Not Found");
        }
      } else {
        // console.log("Payment Failed");
      }
    } catch (error) {
      // console.log(error);
    }
  })
);

// STRIPE ORDER IS PAID
orderRouter.put(
  "/stripe/:id",
  protect,
  asyncHandler(async (req, res) => {
    let orderId = req.params.id;
    console.log(orderId, "orderId");

    const order = await Order.findById(orderId);
    console.log(order, "order");
    try {
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();

        const updatedOrder = await order.save();
        // console.log(updatedOrder, "update");
        res.json(updatedOrder);
      } else {
        res.status(404);
        throw new Error("Order Not Found");
      }
    } catch (error) {
      console.log(error);
    }
  })
);

orderRouter.post(
  "/intent/stripe",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const Stripe = stripe(`${process.env.STRIPE_SECRET_KEY}`);
      // console.log(process.env.STRIPE_SECRET_KEY, "stripeSecretKey");
      const paymentIntent = await Stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.json({ paymentIntent: paymentIntent.client_secret });
    } catch (e) {
      res.status(400).json({
        error: e.message,
      });
    }
  })
);

export default orderRouter;
