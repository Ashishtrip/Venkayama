import { Hono } from "npm:hono"
import { cors } from "npm:hono/cors"
import { logger } from "npm:hono/logger"
import * as kv from "./kv_store.tsx"
const app = new Hono()

// Enable logger
app.use("*", logger(console.log))

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
)

import { Hono } from "npm:hono"
import { cors } from "npm:hono/cors"
import { logger } from "npm:hono/logger"
import * as kv from "./kv_store.tsx"

const app = new Hono()

// Enable logger
app.use("*", logger(console.log))

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
)

// Health check endpoint
app.get("/make-server-ec741b02/health", (c) => {
  return c.json({ status: "ok" })
})
app.get("/health", (c) => {
  return c.json({ status: "ok" })
})

// Helper for HMAC-SHA256 signature verification in Web Crypto API
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const data = enc.encode(`${orderId}|${paymentId}`)
  const signed = await crypto.subtle.sign("HMAC", key, data)
  const hashArray = Array.from(new Uint8Array(signed))
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hex.toLowerCase() === signature.toLowerCase()
}

// Handler for creating Razorpay Order
const createOrderHandler = async (c: any) => {
  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID")
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")

    const body = await c.req.json()
    const { amount, receipt } = body

    if (!amount || amount <= 0) {
      return c.json({ error: "Invalid order amount" }, 400)
    }

    if (!keyId || !keySecret) {
      console.warn(
        "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment.",
      )
      return c.json(
        {
          error:
            "Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Supabase Secrets.",
        },
        500,
      )
    }

    const amountInPaise = Math.round(Number(amount) * 100)
    const basicAuth = btoa(`${keyId}:${keySecret}`)

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt || `VNK-${Date.now()}`,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      console.error("Razorpay order creation failed:", data.error)
      return c.json(
        { error: data.error?.description || "Failed to create Razorpay order" },
        400,
      )
    }

    return c.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
    })
  } catch (err: any) {
    console.error("Order creation route error:", err)
    return c.json({ error: err.message || "Internal server error" }, 500)
  }
}

// Handler for verifying Razorpay Payment signature
const verifyPaymentHandler = async (c: any) => {
  try {
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")
    const body = await c.req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return c.json(
        { error: "Missing required verification parameters", verified: false },
        400,
      )
    }

    if (!keySecret) {
      return c.json(
        {
          error: "RAZORPAY_KEY_SECRET not set in environment.",
          verified: false,
        },
        500,
      )
    }

    const isValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret,
    )

    return c.json({ verified: isValid })
  } catch (err: any) {
    console.error("Payment verification route error:", err)
    return c.json(
      { error: err.message || "Internal server error", verified: false },
      500,
    )
  }
}

// Register Razorpay routes (with and without prefix)
app.post("/make-server-ec741b02/razorpay/order", createOrderHandler)
app.post("/razorpay/order", createOrderHandler)
app.post("/make-server-ec741b02/razorpay/verify", verifyPaymentHandler)
app.post("/razorpay/verify", verifyPaymentHandler)

Deno.serve(app.fetch)
