import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  generateInvoiceHTML,
  getHSNCode,
  numberToWordsINR,
  SELLER_DETAILS,
  type InvoiceOrderData,
} from "../../src/lib/invoiceGenerator"
import {
  loadProfile,
  saveProfile,
  type UserProfile,
  type UserAddress,
} from "../../src/lib/userProfile"
import { actions, promoAmount, getDB, type Order } from "../../src/store"

describe("Integration: Checkout, UserProfile & GST Invoice Generation Flow", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("integrates customer profile with order placement and generates accurate GST invoice", () => {
    // 1. Setup Customer Profile with Default Address in Tamil Nadu
    const customerEmail = "meenakshi@example.com"
    const defaultAddress: UserAddress = {
      id: "addr_tn_1",
      label: "Home Studio",
      name: "Meenakshi Ramanathan",
      phone: "9444012345",
      address: "45 Besant Avenue, Adyar",
      city: "Chennai",
      state: "Tamil Nadu",
      pin: "600020",
      isDefault: true,
    }

    const initialProfile: UserProfile = {
      fullName: "Meenakshi Ramanathan",
      email: customerEmail,
      phone: "9444012345",
      addresses: [defaultAddress],
      paymentMethods: [
        {
          id: "pm_upi_tn",
          type: "upi",
          vpa: "meenakshi@okaxis",
          app: "Google Pay",
          isDefault: true,
        },
      ],
      orders: [],
      wishlist: [],
      createdDate: Date.now(),
    }
    saveProfile(initialProfile, customerEmail)

    const loadedProfile = loadProfile(customerEmail)
    expect(loadedProfile.addresses[0].city).toBe("Chennai")

    // 2. Cart Items Selection: 1 T-shirt (Apparel > 1000 => HSN 6109, 12%) + 1 Merch Tote (Bags => HSN 4202, 18%)
    const cartLines = [
      { name: "THE GUARDIAN", size: "M", qty: 1, price: 1499 },
      { name: "16 OZ DUCK CANVAS TOTE", size: "One size", qty: 1, price: 699 },
    ]

    const subtotal = cartLines.reduce((acc, it) => acc + it.price * it.qty, 0) // 1499 + 699 = 2198
    expect(subtotal).toBe(2198)

    // 3. Apply Promo Code: 10% discount
    const promo = { code: "FESTIVE10", type: "percent" as const, value: 10 }
    const discount = promoAmount(promo, subtotal) // round(2198 * 10 / 100) = 220
    expect(discount).toBe(220)

    const finalAmount = subtotal - discount // 2198 - 220 = 1978 (Free shipping unlocked above 999)
    expect(finalAmount).toBe(1978)

    // 4. Place Order using Customer Profile details
    const orderId = "VNK-7788"
    const trackingCode = "TN7788ARCH"
    const placedOrder: Order = {
      id: orderId,
      customer: loadedProfile.addresses[0].name,
      phone: loadedProfile.addresses[0].phone,
      city: loadedProfile.addresses[0].city,
      address: `${loadedProfile.addresses[0].address}, ${loadedProfile.addresses[0].pin}`,
      items: cartLines,
      amount: finalAmount,
      pay: "UPI",
      status: "Placed",
      createdAt: Date.now(),
      promo: promo.code,
      track: trackingCode,
      note: "Prepaid via Google Pay UPI",
    }

    actions.save("orders", placedOrder, "Customer order placed")
    expect(getDB().orders.some((o) => o.id === orderId)).toBe(true)

    // 5. Record into User Profile History
    loadedProfile.orders.unshift({
      id: placedOrder.id,
      track: placedOrder.track!,
      createdAt: placedOrder.createdAt,
      customer: placedOrder.customer,
      phone: placedOrder.phone,
      city: placedOrder.city,
      address: placedOrder.address,
      pay: placedOrder.pay,
      status: placedOrder.status,
      amount: placedOrder.amount,
      items: placedOrder.items,
    })
    saveProfile(loadedProfile, customerEmail)

    const updatedProfile = loadProfile(customerEmail)
    expect(updatedProfile.orders).toHaveLength(1)
    expect(updatedProfile.orders[0].id).toBe(orderId)

    // 6. Generate GST Tax Invoice from Placed Order
    const invoiceData: InvoiceOrderData = {
      id: placedOrder.id,
      customer: placedOrder.customer,
      phone: placedOrder.phone,
      city: placedOrder.city,
      address: placedOrder.address,
      items: placedOrder.items,
      amount: placedOrder.amount,
      pay: placedOrder.pay,
      createdAt: placedOrder.createdAt,
      track: placedOrder.track,
      promo: placedOrder.promo,
    }

    const invoiceHTML = generateInvoiceHTML(invoiceData)

    // 7. Verify GST Invoice Compliance
    expect(invoiceHTML).toContain("INV-7788")
    expect(invoiceHTML).toContain(placedOrder.id)
    expect(invoiceHTML).toContain("Meenakshi Ramanathan")
    expect(invoiceHTML).toContain("45 Besant Avenue, Adyar, 600020")
    expect(invoiceHTML).toContain(SELLER_DETAILS.gstin)

    // Inter-State Place of supply: Chennai, Tamil Nadu -> IGST applied
    expect(invoiceHTML).toContain("Place of Supply: <b>Chennai (Inter-State)</b>")
    expect(invoiceHTML).toContain("IGST Total")
    expect(invoiceHTML).not.toContain("CGST Total")

    // Verify HSN mappings in invoice
    expect(getHSNCode("THE GUARDIAN")).toBe("6109")
    expect(getHSNCode("16 OZ DUCK CANVAS TOTE")).toBe("4202")
    expect(invoiceHTML).toContain("6109")
    expect(invoiceHTML).toContain("4202")

    // Verify Words Total in INR
    const expectedWords = numberToWordsINR(finalAmount)
    expect(expectedWords).toBe("One Thousand Nine Hundred Seventy Eight Rupees Only")
    expect(invoiceHTML).toContain(expectedWords)
  })

  it("handles intra-state Delhi orders with 50/50 CGST and SGST allocation", () => {
    const delhiOrder: InvoiceOrderData = {
      id: "VNK-1099",
      customer: "Vignesh M.",
      phone: "9811223344",
      city: "New Delhi",
      address: "Pocket B, Mayur Vihar Phase 1, Delhi 110091",
      items: [
        { name: "KALYAN TERRY HOODIE", size: "XL", qty: 1, price: 2499 },
      ],
      amount: 2499,
      pay: "Card",
      createdAt: Date.now(),
    }

    const invoiceHTML = generateInvoiceHTML(delhiOrder)

    // Delhi intra-state supply check
    expect(invoiceHTML).toContain("Place of Supply: <b>Delhi (07)</b>")
    expect(invoiceHTML).toContain("CGST Total:")
    expect(invoiceHTML).toContain("SGST Total:")
    expect(invoiceHTML).not.toContain("IGST Total:")
    expect(invoiceHTML).toContain("Two Thousand Four Hundred Ninety Nine Rupees Only")
  })
})

