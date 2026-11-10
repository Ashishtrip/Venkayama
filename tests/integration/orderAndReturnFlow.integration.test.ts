import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  actions,
  getDB,
  seed,
  returnEligibility,
  rLabel,
  RNOTES,
  type Order,
  type ReturnReq,
  type Product,
} from "../../src/store"

describe("Integration: Order Lifecycle, Return & Inventory Delta Flow", () => {
  beforeEach(() => {
    // Reset store database with clean seeded data
    const initialDb = seed()
    // Inject test product with specific known inventory
    const testProduct: Product = {
      id: "p_flow_test",
      sku: "TEST-FLOW-01",
      name: "TEST FLOW HOODIE",
      cat: "hoodies",
      price: 2499,
      was: 3199,
      tag: "HEAVY TERRY",
      badge: "LIMITED",
      img: "ce1cd.png",
      sizes: { M: 10, L: 10, XL: 5 },
      sold: 0,
      threshold: 2,
      active: true,
      drop: false,
      claimed: 0,
    }

    initialDb.products = [testProduct, ...initialDb.products]
    actions.save("products", testProduct, "Initial test product")
  })

  it("completes full order progression from Placed to Delivered and verifies return eligibility window", () => {
    const orderId = "VNK-9876"
    const initialOrder: Order = {
      id: orderId,
      customer: "Karthik Subramanian",
      phone: "9876543210",
      city: "Chennai",
      address: "12 Anna Salai, Chennai 600002",
      items: [
        { name: "TEST FLOW HOODIE", size: "M", qty: 1, price: 2499 },
      ],
      amount: 2499,
      pay: "UPI",
      status: "Placed",
      createdAt: Date.now() - 3 * 864e5, // Placed 3 days ago
      note: "",
    }

    // Step 1: Save placed order
    actions.save("orders", initialOrder, "Order placed")
    let order = getDB().orders.find((o) => o.id === orderId)!
    expect(order).toBeDefined()
    expect(order.status).toBe("Placed")

    const orderItem = order.items[0]

    // Step 2: Return before delivery should be rejected
    expect(returnEligibility(order, orderItem, [])).toBe("Returns open once the order is delivered.")

    // Step 3: Advance order through manufacturing & shipping flow
    actions.setStatus(orderId, "Printing")
    expect(getDB().orders.find((o) => o.id === orderId)!.status).toBe("Printing")

    actions.setStatus(orderId, "Packed")
    expect(getDB().orders.find((o) => o.id === orderId)!.status).toBe("Packed")

    actions.setStatus(orderId, "Shipped")
    expect(getDB().orders.find((o) => o.id === orderId)!.status).toBe("Shipped")

    // Step 4: Deliver order (sets deliveredAt)
    actions.setStatus(orderId, "Delivered")
    order = getDB().orders.find((o) => o.id === orderId)!
    expect(order.status).toBe("Delivered")
    expect(order.deliveredAt).toBeDefined()

    // Step 5: Verify return eligibility immediately upon delivery (within 7-day window)
    expect(returnEligibility(order, orderItem, [])).toBe("")
  })

  it("handles return exchange flow with inventory reservation and resolution restock", () => {
    const orderId = "VNK-9877"
    const orderItem = { name: "TEST FLOW HOODIE", size: "M", qty: 1, price: 2499 }
    const deliveredOrder: Order = {
      id: orderId,
      customer: "Divya Prakash",
      phone: "9876501234",
      city: "New Delhi",
      address: "Preet Vihar, Delhi 110092",
      items: [orderItem],
      amount: 2499,
      pay: "Card",
      status: "Delivered",
      createdAt: Date.now() - 864e5,
      deliveredAt: Date.now() - 864e5, // 1 day ago
      note: "",
    }
    actions.save("orders", deliveredOrder, "Delivered order for exchange")

    const product = getDB().products.find((p) => p.name === "TEST FLOW HOODIE")!
    const initialStockM = product.sizes["M"] // 10
    const initialStockXL = product.sizes["XL"] // 5

    // Step 1: Customer creates exchange request for size XL
    const returnReqId = "ret_exchange_01"
    const exchangeRequest: ReturnReq = {
      id: returnReqId,
      orderId,
      track: "EXCH-TRK-01",
      customer: deliveredOrder.customer,
      phone: deliveredOrder.phone,
      address: deliveredOrder.address,
      type: "Exchange",
      item: orderItem,
      newSize: "XL",
      reason: "Size too small",
      comment: "Need larger size",
      status: "Requested",
      createdAt: Date.now(),
      history: [{ t: Date.now(), s: "Requested", note: "Customer submitted exchange" }],
      courier: "Delhivery",
      refund: 0,
      note: "",
    }

    // Save initial return request directly into store returns state
    getDB().returns!.push(exchangeRequest)

    // Step 2: Duplicate return should be blocked
    expect(returnEligibility(deliveredOrder, orderItem, getDB().returns!)).toBe(
      "A request is already open for this piece.",
    )

    // Step 3: Admin approves pickup -> status "Pickup scheduled"
    // For exchanges, moving beyond Requested should reserve the new size inventory (XL - 1)
    actions.setReturnStatus(returnReqId, "Pickup scheduled", "Pickup booked")
    const updatedProductAfterReserve = getDB().products.find((p) => p.name === "TEST FLOW HOODIE")!
    expect(updatedProductAfterReserve.sizes["XL"]).toBe(initialStockXL - 1)

    // Step 4: Courier picks up piece
    actions.setReturnStatus(returnReqId, "Picked up", "Courier collected")
    expect(rLabel("Picked up", "Exchange")).toBe("Picked up")

    // Step 5: Item received at studio & inspected -> restocks returned size M (M + 1)
    actions.setReturnStatus(returnReqId, "Received", RNOTES["Received"])
    const updatedProductAfterReceive = getDB().products.find((p) => p.name === "TEST FLOW HOODIE")!
    expect(updatedProductAfterReceive.sizes["M"]).toBe(initialStockM + 1)

    // Step 6: Resolved -> Replacement shipped
    actions.setReturnStatus(returnReqId, "Resolved", "Exchange complete")
    expect(rLabel("Resolved", "Exchange")).toBe("Replacement shipped")
  })
})
