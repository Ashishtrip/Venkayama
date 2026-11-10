import { describe, it, expect } from "vitest"
import {
  getHSNCode,
  numberToWordsINR,
  generateInvoiceHTML,
  downloadGSTInvoice,
  SELLER_DETAILS,
  type InvoiceOrderData,
} from "../src/lib/invoiceGenerator"

describe("SELLER_DETAILS", () => {
  it("contains complete and valid GST compliant seller details", () => {
    expect(SELLER_DETAILS.companyName).toBe("VENKAYAM INDIA CLOTHING CORP.")
    expect(SELLER_DETAILS.brandName).toBe("Venkayam India")
    expect(SELLER_DETAILS.gstin).toMatch(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    expect(SELLER_DETAILS.stateCode).toBe("07")
    expect(SELLER_DETAILS.state).toBe("Delhi")
    expect(SELLER_DETAILS.pan).toBe("AAACV9876Q")
    expect(SELLER_DETAILS.email).toBe("care@venkayam.in")
  })
})

describe("getHSNCode", () => {
  it("identifies headwear as HSN 6505", () => {
    expect(getHSNCode("ONION 5-PANEL CAP")).toBe("6505")
    expect(getHSNCode("Madras Stencil Snapback")).toBe("6505")
    expect(getHSNCode("Classic 5-panel Hat")).toBe("6505")
    expect(getHSNCode("Street Headwear")).toBe("6505")
  })

  it("identifies bags and totes as HSN 4202", () => {
    expect(getHSNCode("16 OZ DUCK CANVAS TOTE")).toBe("4202")
    expect(getHSNCode("Cinema Archive Tote Bag")).toBe("4202")
    expect(getHSNCode("Utility Carrier")).toBe("4202")
  })

  it("defaults apparel and tees to HSN 6109", () => {
    expect(getHSNCode("FREAK MODE")).toBe("6109")
    expect(getHSNCode("DISCIPLINE")).toBe("6109")
    expect(getHSNCode("Kalyan Terry Hoodie")).toBe("6109")
    expect(getHSNCode("Heavy Drop T-Shirt")).toBe("6109")
    expect(getHSNCode("")).toBe("6109")
  })

  it("handles case-insensitivity and whitespace", () => {
    expect(getHSNCode("   black cAp  ")).toBe("6505")
    expect(getHSNCode("TOTE")).toBe("4202")
    expect(getHSNCode("t-shirt")).toBe("6109")
  })
})

describe("numberToWordsINR", () => {
  it("converts zero correctly", () => {
    expect(numberToWordsINR(0)).toBe("Zero Rupees Only")
    expect(numberToWordsINR(0.75)).toBe("Zero Rupees Only")
  })

  it("converts single digit and teens numbers", () => {
    expect(numberToWordsINR(5)).toBe("Five Rupees Only")
    expect(numberToWordsINR(14)).toBe("Fourteen Rupees Only")
    expect(numberToWordsINR(19)).toBe("Nineteen Rupees Only")
  })

  it("converts tens and compound numbers", () => {
    expect(numberToWordsINR(20)).toBe("Twenty Rupees Only")
    expect(numberToWordsINR(42)).toBe("Forty Two Rupees Only")
    expect(numberToWordsINR(99)).toBe("Ninety Nine Rupees Only")
  })

  it("converts hundreds and thousands correctly", () => {
    expect(numberToWordsINR(100)).toBe("One Hundred Rupees Only")
    expect(numberToWordsINR(450)).toBe("Four Hundred Fifty Rupees Only")
    expect(numberToWordsINR(1000)).toBe("One Thousand Rupees Only")
    expect(numberToWordsINR(1499)).toBe("One Thousand Four Hundred Ninety Nine Rupees Only")
    expect(numberToWordsINR(2499)).toBe("Two Thousand Four Hundred Ninety Nine Rupees Only")
  })

  it("converts lakhs correctly", () => {
    expect(numberToWordsINR(100000)).toBe("One Lakh Rupees Only")
    expect(numberToWordsINR(250000)).toBe("Two Lakh Fifty Thousand Rupees Only")
    expect(numberToWordsINR(999999)).toBe("Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine Rupees Only")
  })

  it("converts crores correctly", () => {
    expect(numberToWordsINR(10000000)).toBe("One Crore Rupees Only")
    expect(numberToWordsINR(10500000)).toBe("One Crore Five Lakh Rupees Only")
  })

  it("truncates fractional paise and formats integer rupees", () => {
    expect(numberToWordsINR(1499.99)).toBe("One Thousand Four Hundred Ninety Nine Rupees Only")
  })
})

describe("generateInvoiceHTML", () => {
  const baseOrder: InvoiceOrderData = {
    id: "VNK-2480",
    customer: "Arjun K.",
    phone: "9876543210",
    city: "New Delhi",
    address: "Block 12, Preet Vihar, Delhi 110092",
    items: [
      { name: "FREAK MODE", size: "M", qty: 1, price: 1399 },
      { name: "ONION 5-PANEL CAP", size: "One size", qty: 2, price: 899 },
    ],
    amount: 3197,
    pay: "UPI",
    createdAt: 1731234567890,
    track: "A1B2C3D4E5",
    promo: "DROP10",
  }

  it("generates a complete HTML invoice containing order reference", () => {
    const html = generateInvoiceHTML(baseOrder)
    expect(html).toContain("<!doctype html>")
    expect(html).toContain("INV-2480")
    expect(html).toContain("VNK-2480")
    expect(html).toContain("A1B2C3D4E5")
    expect(html).toContain("Arjun K.")
    expect(html).toContain("Block 12, Preet Vihar, Delhi 110092")
    expect(html).toContain("9876543210")
    expect(html).toContain("UPI")
    expect(html).toContain("DROP10")
    expect(html).toContain(SELLER_DETAILS.companyName)
    expect(html).toContain(SELLER_DETAILS.gstin)
  })

  it("applies Delhi intra-state GST (CGST + SGST) for Delhi addresses", () => {
    const html = generateInvoiceHTML(baseOrder)
    expect(html).toContain("Place of Supply: <b>Delhi (07)</b>")
    expect(html).toContain("CGST")
    expect(html).toContain("SGST")
    expect(html).not.toContain("IGST Total")
  })

  it("applies inter-state IGST for addresses outside Delhi", () => {
    const interStateOrder: InvoiceOrderData = {
      ...baseOrder,
      city: "Bengaluru",
      address: "12th Main, Indiranagar, Bengaluru 560038",
    }
    const html = generateInvoiceHTML(interStateOrder)
    expect(html).toContain("Place of Supply: <b>Bengaluru (Inter-State)</b>")
    expect(html).toContain("IGST")
    expect(html).not.toContain("CGST Total")
    expect(html).not.toContain("SGST Total")
  })

  it("calculates appropriate HSN and GST tax tiers per item", () => {
    const mixedOrder: InvoiceOrderData = {
      id: "VNK-1002",
      customer: "Karthik S.",
      phone: "9876512345",
      city: "Chennai",
      address: "Anna Nagar, Chennai 600040",
      items: [
        { name: "RAW TOTE BAG", size: "One size", qty: 1, price: 699 }, // HSN 4202 -> 18%
        { name: "BUDGET TEE", size: "L", qty: 1, price: 799 }, // HSN 6109 <= 1000 -> 5%
        { name: "PREMIUM HOODIE", size: "XL", qty: 1, price: 2499 }, // HSN 6109 > 1000 -> 12%
      ],
      amount: 3997,
      pay: "Card",
      createdAt: Date.now(),
    }
    const html = generateInvoiceHTML(mixedOrder)
    expect(html).toContain("4202")
    expect(html).toContain("6109")
    expect(html).toContain("18%")
    expect(html).toContain("5%")
    expect(html).toContain("12%")
    expect(html).toContain("Three Thousand Nine Hundred Ninety Seven Rupees Only")
  })

  it("omits promo row when no promo code is provided", () => {
    const noPromoOrder: InvoiceOrderData = {
      ...baseOrder,
      promo: undefined,
    }
    const html = generateInvoiceHTML(noPromoOrder)
    expect(html).not.toContain("Promo Coupon")
  })
})

describe("downloadGSTInvoice", () => {
  const testOrder: InvoiceOrderData = {
    id: "VNK-1001",
    customer: "Priya N.",
    phone: "9876543210",
    city: "Delhi",
    address: "Mayur Vihar",
    items: [{ name: "TEST TEE", size: "M", qty: 1, price: 1499 }],
    amount: 1499,
    pay: "UPI",
    createdAt: Date.now(),
  }

  it("creates blob and opens new window when popup is allowed", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-uuid")
    const revokeObjectURLMock = vi.fn()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock

    const mockOpen = vi.fn().mockReturnValue({ closed: false })
    window.open = mockOpen

    downloadGSTInvoice(testOrder)

    expect(createObjectURLMock).toHaveBeenCalled()
    expect(mockOpen).toHaveBeenCalledWith("blob:http://localhost/test-uuid", "_blank")
  })

  it("falls back to hidden iframe when popup window is blocked", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-iframe")
    window.URL.createObjectURL = createObjectURLMock
    window.open = vi.fn().mockReturnValue(null) // Simulate blocked popup

    const appendChildSpy = vi.spyOn(document.body, "appendChild")

    downloadGSTInvoice(testOrder)

    expect(appendChildSpy).toHaveBeenCalled()
    const iframe = document.querySelector("iframe")
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute("src", "blob:http://localhost/test-iframe")
  })
})
