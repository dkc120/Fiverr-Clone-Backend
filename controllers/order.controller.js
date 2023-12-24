import createError from "../utils/createError.js";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import Stripe from "stripe";
import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE);
export const intent = async (req, res, next) => {
  const { id } = req.params;
  const YOUR_DOMAIN = "http://localhost:5173";

  const gig = await Gig.findById(id);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd", // Replace with your desired currency code
          product_data: {
            name: req.body.cat, // Replace with your product name
            description: req.body.desc, // Replace with your product description
          },
          unit_amount: req.body.price * 100, // Replace with the actual amount in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}&order=${JSON.stringify(
      req.body
    )}`,
    cancel_url: `${YOUR_DOMAIN}/success`,
  });
  console.log(session.id, "dsdsdds");
  const newOrder = new Order({
    gigId: gig._id,
    img: gig.cover,
    title: gig.title,
    buyerId: req.userId,
    sellerId: gig.userId,
    price: gig.price,
    payment_intent: session.id,
  });

  await newOrder.save();

  res.status(303).json({ url: session.url });
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }),
      isCompleted: true,
    });

    res.status(200).send(orders);
  } catch (err) {
    next(err);
  }
};
export const confirm = async (req, res, next) => {
  let { order, session_id } = req.body;

  try {
    const order = await Order.findOneAndUpdate(
      { payment_intent: session_id },
      { $set: { isCompleted: true } }
    );
    console.log(order);
    res.status(200).send("order has been confiremed");
  } catch (err) {
    console.log(err);
  }
};
