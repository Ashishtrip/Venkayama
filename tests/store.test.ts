import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  catLabel,
  sizeOrder,
  sortSizes,
  sizeKeys,
  imgSrc,
  isMono,
  totalStock,
  offLabel,
  stockLabel,
  newTrackCode,
  returnEligibility,
  itemsText,
  promoAmount,
  seed,
  rowMappers,
  DEFAULT_STOREFRONT,
  loadStorefront,
  saveStorefront,
  type Product,
  type Order,
  type ReturnReq,
} from "../src/store"

describe("Category & Size Utilities", () => {
  it("formats category labels correctly", () => {
    expect(catLabel("tees")).toBe("Tees")
    expect(catLabel("hoodies")).toBe("Hoodies")
    expect(catLabel("caps")).toBe("Caps")
    expect(catLabel("acc")).toBe("Accessories")
    expect(catLabel("outerwear")).toBe("outerwear") // fallback
  })

  it("determines expected sizes per category", () => {
    expect(sizeKeys("caps")).toEqual(["One size"])
    expect(sizeKeys("acc")).toEqual(["One size"])
    expect(sizeKeys("tees")).toEqual(["XS", "S", "M", "L", "XL", "XXL"])
    expect(sizeKeys("hoodies")).toEqual(["XS", "S", "M", "L", "XL", "XXL"])
  })

  it("sorts apparel sizes according to standard hierarchy", () => {
    expect(sizeOrder("XS", "S")).toBeLessThan(0)
    expect(sizeOrder("M", "L")).toBeLessThan(0)
    expect(sizeOrder("XXL", "XS")).toBeGreaterThan(0)
    expect(sizeOrder("M", "M")).toBe(0)

    const unordered = ["XXL", "S", "XL", "XS", "M", "L"]
    expect(sortSizes(unordered)).toEqual(["XS", "S", "M", "L", "XL", "XXL"])
  })

  it("sorts size tuple entries like [size, count]", () => {
    const tuples: [string, number][] = [
      ["XXL", 5],
      ["M", 28],
      ["S", 14],
      ["XL", 10],
      ["XS", 8],
      ["L", 22],
    ]
    const sorted = sortSizes(tuples)
    expect(sorted.map((t) => t[0])).toEqual(["XS", "S", "M", "L", "XL", "XXL"])
  })

  it("handles non-standard custom sizes gracefully in sorting", () => {
    expect(sizeOrder("Custom-1", "Custom-2")).toBeLessThan(0)
    expect(sizeOrder("XS", "Custom-1")).toBeLessThan(0)
    expect(sizeOrder("Custom-1", "XS")).toBeGreaterThan(0)
  })
})

describe("Image & Media Utilities", () => {
  it("preserves absolute, web, and data URLs for imgSrc", () => {
    expect(imgSrc("https://cdn.venkayam.in/pic.jpg")).toBe("https://cdn.venkayam.in/pic.jpg")
    expect(imgSrc("http://example.com/asset.png")).toBe("http://example.com/asset.png")
    expect(imgSrc("data:image/png;base64,...")).toBe("data:image/png;base64,...")
    expect(imgSrc("/products/01.jpg")).toBe("/products/01.jpg")
  })

  it("prefixes relative asset filenames with /assets/", () => {
    expect(imgSrc("ce1cd.png")).toBe("/assets/ce1cd.png")
    expect(imgSrc("37da8.png")).toBe("/assets/37da8.png")
  })

  it("identifies monochrome artwork vs full-colour images", () => {
    expect(isMono("f1497.png")).toBe(true)
    expect(isMono("ce1cd.png")).toBe(true)
    expect(isMono("/products/01.jpg")).toBe(false)
    expect(isMono("https://example.com/image.jpg")).toBe(false)
    expect(isMono("data:image/jpeg;base64,...")).toBe(false)
  })
})

describe("Stock & Product Calculations", () => {
  const dummyProduct: Product = {
    id: "p_test_1",
    sku: "TEST-01",
    name: "TEST PRODUCT",
    cat: "tees",
    price: 1399,
    was: 1799,
    tag: "TAG",
    badge: "BADGE",
    img: "/products/01.jpg",
    sizes: { XS: 5, S: 10, M: 15, L: 5 },
    sold: 10,
    threshold: 5,
    active: true,
    drop: false,
    claimed: 50,
  }

  it("computes totalStock correctly", () => {
    expect(totalStock(dummyProduct)).toBe(35)
    expect(totalStock({ ...dummyProduct, sizes: {} })).toBe(0)
  })

  it("formats discount percentage with offLabel", () => {
    expect(offLabel(dummyProduct)).toBe("22% OFF")
    expect(offLabel({ ...dummyProduct, was: 2000, price: 1000 })).toBe("50% OFF")
    expect(offLabel({ ...dummyProduct, was: 1000, price: 1000 })).toBe("")
    expect(offLabel({ ...dummyProduct, was: 900, price: 1000 })).toBe("")
  })

  it("returns appropriate inventory labels with stockLabel", () => {
    expect(stockLabel({ ...dummyProduct, price: 0 })).toBe("COMING SOON")
    expect(stockLabel({ ...dummyProduct, sizes: { S: 0, M: 0 } })).toBe("SOLD OUT")
    expect(stockLabel({ ...dummyProduct, sizes: { S: 5, M: 10 } })).toBe("LIMITED [15 PCS]")
    expect(stockLabel({ ...dummyProduct, sizes: { S: 20, M: 20 } })).toBe("IN STOCK")
  })
})

describe("Tracking Code & Orders", () => {
  it("generates a 10-character uppercase hexadecimal tracking code", () => {
    const code = newTrackCode()
    expect(code).toHaveLength(10)
    expect(code).toMatch(/^[0-9A-F]{10}$/)
  })

  it("avoids duplicate codes present in taken list", () => {
    const existing = "ABCDEF0123"
    const code = newTrackCode([existing])
    expect(code).not.toBe(existing)
  })

  it("formats itemsText with multiple items and quantities", () => {
    const order: Order = {
      id: "VNK-100",
      customer: "Test",
      phone: "1234567890",
      city: "Delhi",
      address: "Street",
      items: [
        { name: "FREAK MODE", size: "M", qty: 1, price: 1399 },
        { name: "LOWKEY DRIP", size: "L", qty: 2, price: 1399 },
      ],
      amount: 4197,
      pay: "UPI",
      status: "Placed",
      createdAt: Date.now(),
      note: "",
    }
    expect(itemsText(order)).toBe("FREAK MODE (M), LOWKEY DRIP ×2 (L)")
  })
})

describe("Promo Calculation", () => {
  it("calculates flat discounts capped at subtotal", () => {
    expect(promoAmount({ type: "flat", value: 200 }, 1000)).toBe(200)
    expect(promoAmount({ type: "flat", value: 1500 }, 1000)).toBe(1000)
    expect(promoAmount({ type: "flat", value: 50 }, 0)).toBe(0)
  })

  it("calculates percentage discounts rounded to nearest integer", () => {
    expect(promoAmount({ type: "percent", value: 10 }, 1499)).toBe(150)
    expect(promoAmount({ type: "percent", value: 25 }, 2000)).toBe(500)
    expect(promoAmount({ type: "percent", value: 15 }, 999)).toBe(150)
  })
})

describe("Return Eligibility Policy", () => {
  const baseOrder: Order = {
    id: "VNK-200",
    customer: "Test User",
    phone: "9876543210",
    city: "Delhi",
    address: "Mayur Vihar",
    items: [{ name: "FREAK MODE", size: "M", qty: 1, price: 1399 }],
    amount: 1399,
    pay: "UPI",
    status: "Delivered",
    createdAt: Date.now() - 2 * 864e5, // 2 days ago
    deliveredAt: Date.now() - 2 * 864e5,
    note: "",
  }
  const item = baseOrder.items[0]

  it("allows return within 7-day delivery window", () => {
    expect(returnEligibility(baseOrder, item, [])).toBe("")
  })

  it("rejects return if order is not delivered", () => {
    const placedOrder = { ...baseOrder, status: "Shipped" as const }
    expect(returnEligibility(placedOrder, item, [])).toBe("Returns open once the order is delivered.")
  })

  it("rejects return if order is already marked Returned", () => {
    const returnedOrder = { ...baseOrder, status: "Returned" as const }
    expect(returnEligibility(returnedOrder, item, [])).toBe("This order was already returned.")
  })

  it("rejects return if 7-day window has expired", () => {
    const expiredOrder = {
      ...baseOrder,
      deliveredAt: Date.now() - 8 * 864e5, // 8 days ago
    }
    expect(returnEligibility(expiredOrder, item, [])).toBe("The 7 day window has closed.")
  })

  it("rejects return if a request is already open for this piece", () => {
    const existingReturns: ReturnReq[] = [
      {
        id: "ret-1",
        orderId: baseOrder.id,
        track: "TRK-01",
        customer: baseOrder.customer,
        phone: baseOrder.phone,
        address: baseOrder.address,
        type: "Return",
        item,
        reason: "Size too small",
        comment: "",
        status: "Requested",
        createdAt: Date.now(),
        history: [],
        courier: "",
        refund: 1399,
        note: "",
      },
    ]
    expect(returnEligibility(baseOrder, item, existingReturns)).toBe("A request is already open for this piece.")
  })

  it("allows a new return request if the previous one was Rejected", () => {
    const rejectedReturns: ReturnReq[] = [
      {
        id: "ret-1",
        orderId: baseOrder.id,
        track: "TRK-01",
        customer: baseOrder.customer,
        phone: baseOrder.phone,
        address: baseOrder.address,
        type: "Return",
        item,
        reason: "Size too small",
        comment: "",
        status: "Rejected",
        createdAt: Date.now(),
        history: [],
        courier: "",
        refund: 0,
        note: "",
      },
    ]
    expect(returnEligibility(baseOrder, item, rejectedReturns)).toBe("")
  })
})

describe("Database Seed & Schema Mappers", () => {
  it("generates a complete seeded database structure", () => {
    const initialDb = seed()
    expect(initialDb.products.length).toBeGreaterThan(30)
    expect(initialDb.zones.length).toBe(5)
    expect(initialDb.looks.length).toBe(6)
    expect(initialDb.settings.freeShip).toBe(999)
    expect(initialDb.settings.shipFee).toBe(79)

    // Verify product model integrity
    const p = initialDb.products[0]
    expect(p).toHaveProperty("id")
    expect(p).toHaveProperty("sku")
    expect(p).toHaveProperty("name")
    expect(p).toHaveProperty("price")
    expect(p).toHaveProperty("sizes")
  })

  it("maps row objects to Supabase database schema via rowMappers", () => {
    const p = seed().products[0]
    const rowP = rowMappers.toProduct(p)
    expect(rowP.is_drop).toBe(p.drop)
    expect(rowP.sku).toBe(p.sku)
    expect(rowP.price).toBe(p.price)

    const promo = {
      id: "p1",
      code: "SAVE10",
      desc: "Save 10 percent",
      type: "percent" as const,
      value: 10,
      used: 5,
      cap: 100,
      on: true,
    }
    const rowPromo = rowMappers.toPromo(promo)
    expect(rowPromo.descr).toBe(promo.desc)
    expect(rowPromo.active).toBe(promo.on)
  })
})

describe("Storefront Persistence", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("falls back to DEFAULT_STOREFRONT when storage is empty", () => {
    const sf = loadStorefront()
    expect(sf.hero1.productName).toBe(DEFAULT_STOREFRONT.hero1.productName)
    expect(sf.categories.length).toBe(DEFAULT_STOREFRONT.categories.length)
  })

  it("persists and reloads modified storefront configurations", () => {
    const custom = {
      ...DEFAULT_STOREFRONT,
      hero1: { ...DEFAULT_STOREFRONT.hero1, productName: "CUSTOM ARCHIVE" },
    }
    saveStorefront(custom)
    const loaded = loadStorefront()
    expect(loaded.hero1.productName).toBe("CUSTOM ARCHIVE")
  })
})

