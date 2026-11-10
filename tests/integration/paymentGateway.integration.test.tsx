import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { CartProvider, useCart } from "../../src/Cart"
import { actions, quoteOrder } from "../../src/store"
import type { Session } from "@supabase/supabase-js"

// Mock active user session so user is authenticated
vi.mock("../../src/Auth", () => ({
  useSession: () =>
    ({
      user: { id: "cust_1", email: "ashish@example.com" },
    }) as unknown as Session,
}))

// Mock quoteOrder
vi.mock("../../src/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/store")>()
  return {
    ...actual,
    quoteOrder: vi.fn(),
  }
})

describe("Integration: Razorpay Payment Gateway Lifecycle", () => {
  let mockRazorpayInstance: any
  let razorpayConstructorOptions: any
  let eventListeners: Record<string, Function> = {}

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    eventListeners = {}

    // Mock window.Razorpay constructor
    mockRazorpayInstance = {
      open: vi.fn(),
      on: vi.fn((event: string, callback: Function) => {
        eventListeners[event] = callback
      }),
    }

    ;(window as any).Razorpay = vi.fn(function (options: any) {
      razorpayConstructorOptions = options
      return mockRazorpayInstance
    })

    // Mock fetch for Supabase edge function calls (/razorpay/order and /razorpay/verify)
    global.fetch = vi.fn() as any
  })

  const dummyLine = {
    name: "FREAK MODE",
    size: "M",
    price: 1399,
    img: "/products/01.jpg",
  }

  it("completes happy path: quotes order, initiates Razorpay, verifies signature and confirms order", async () => {
    // 1. Mock DB quote matching cart
    vi.mocked(quoteOrder).mockResolvedValue({
      items: [{ name: "FREAK MODE", size: "M", qty: 1 }],
      subtotal: 1399,
      discount: 0,
      shipping: 0,
      total: 1399,
    })

    // 2. Mock Razorpay order creation API
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              orderId: "order_rzp_12345",
              amount: 139900,
              currency: "INR",
              keyId: "rzp_test_key",
            }),
          ),
      }),
    )

    // 3. Mock Razorpay signature verification API
    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              verified: true,
            }),
          ),
      }),
    )

    // 4. Mock actions.placeOrder
    const placeOrderSpy = vi.spyOn(actions, "placeOrder").mockResolvedValue({
      id: "VNK-5001",
      customer: "Ashish Tripathi",
      phone: "9876543210",
      city: "Delhi",
      address: "Mayur Vihar",
      items: [{ name: "FREAK MODE", size: "M", qty: 1, price: 1399 }],
      amount: 1399,
      pay: "UPI",
      status: "Placed",
      createdAt: Date.now(),
      track: "TRK5001HEX",
      note: "",
    })

    render(
      <CartProvider>
        <TestCheckoutComponent line={dummyLine} />
      </CartProvider>,
    )

    // Open checkout drawer
    fireEvent.click(screen.getByText("Add And Checkout"))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pay ₹1,399/i })).toBeInTheDocument()
    })

    // Fill shipping details
    const nameInput = screen.getByLabelText(/full name/i)
    const phoneInput = screen.getByLabelText(/^phone$/i)
    const addressInput = screen.getByLabelText(/delivery address/i)
    const cityInput = screen.getByLabelText(/city/i)
    const pinInput = screen.getByLabelText(/pin/i)

    fireEvent.change(nameInput, { target: { value: "Ashish Tripathi" } })
    fireEvent.change(phoneInput, { target: { value: "9876543210" } })
    fireEvent.change(addressInput, { target: { value: "Block 21, Mayur Vihar" } })
    fireEvent.change(cityInput, { target: { value: "Delhi" } })
    fireEvent.change(pinInput, { target: { value: "110091" } })

    // Click Pay
    const payBtn = screen.getByRole("button", { name: /pay ₹1,399/i })
    fireEvent.submit(payBtn.closest("form")!)

    // Verify Razorpay initialized with correct payload
    await waitFor(() => {
      expect(mockRazorpayInstance.open).toHaveBeenCalled()
      expect(razorpayConstructorOptions.order_id).toBe("order_rzp_12345")
      expect(razorpayConstructorOptions.amount).toBe(139900)
      expect(razorpayConstructorOptions.currency).toBe("INR")
      expect(razorpayConstructorOptions.prefill.name).toBe("Ashish Tripathi")
      expect(razorpayConstructorOptions.prefill.contact).toBe("9876543210")
    })

    // Simulate Razorpay successful payment callback
    await act(async () => {
      await razorpayConstructorOptions.handler({
        razorpay_order_id: "order_rzp_12345",
        razorpay_payment_id: "pay_rzp_98765",
        razorpay_signature: "valid_signature_hash",
      })
    })

    // Verify order placed in database with payment ID
    expect(placeOrderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "Ashish Tripathi",
        amount: 1399,
        paymentId: "pay_rzp_98765",
      }),
    )
  })

  it("aborts checkout when database price quote differs from cart total", async () => {
    // Database returns updated price (e.g. 1599 instead of 1399)
    vi.mocked(quoteOrder).mockResolvedValue({
      items: [{ name: "FREAK MODE", size: "M", qty: 1 }],
      subtotal: 1599,
      discount: 0,
      shipping: 0,
      total: 1599,
    })

    render(
      <CartProvider>
        <TestCheckoutComponent line={dummyLine} />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add And Checkout"))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pay ₹1,399/i })).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ashish" } })
    fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9876543210" } })
    fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: "Street" } })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: "Delhi" } })
    fireEvent.change(screen.getByLabelText(/pin/i), { target: { value: "110091" } })

    // Click Pay
    const payBtn = screen.getByRole("button", { name: /pay ₹1,399/i })
    fireEvent.submit(payBtn.closest("form")!)

    await waitFor(() => {
      expect(screen.getByText(/prices or shipping changed/i)).toBeInTheDocument()
      expect(mockRazorpayInstance.open).not.toHaveBeenCalled()
    })
  })

  it("handles payment gateway failure events gracefully and displays error description", async () => {
    vi.mocked(quoteOrder).mockResolvedValue({
      items: [{ name: "FREAK MODE", size: "M", qty: 1 }],
      subtotal: 1399,
      discount: 0,
      shipping: 0,
      total: 1399,
    })

    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              orderId: "order_fail_1",
              amount: 139900,
              currency: "INR",
              keyId: "rzp_test_key",
            }),
          ),
      }),
    )

    render(
      <CartProvider>
        <TestCheckoutComponent line={dummyLine} />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add And Checkout"))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pay ₹1,399/i })).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ashish" } })
    fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9876543210" } })
    fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: "Street" } })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: "Delhi" } })
    fireEvent.change(screen.getByLabelText(/pin/i), { target: { value: "110091" } })

    const payBtn = screen.getByRole("button", { name: /pay ₹1,399/i })
    fireEvent.submit(payBtn.closest("form")!)

    await waitFor(() => {
      expect(mockRazorpayInstance.open).toHaveBeenCalled()
    })

    // Trigger payment.failed event
    await act(async () => {
      eventListeners["payment.failed"]?.({
        error: { description: "Card declined by issuing bank" },
      })
    })

    await waitFor(() => {
      expect(screen.getByText("Card declined by issuing bank")).toBeInTheDocument()
    })
  })

  it("handles user dismissing the Razorpay popup modal without completing payment", async () => {
    vi.mocked(quoteOrder).mockResolvedValue({
      items: [{ name: "FREAK MODE", size: "M", qty: 1 }],
      subtotal: 1399,
      discount: 0,
      shipping: 0,
      total: 1399,
    })

    ;(global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        text: () =>
          Promise.resolve(
            JSON.stringify({
              orderId: "order_modal_1",
              amount: 139900,
              currency: "INR",
              keyId: "rzp_test_key",
            }),
          ),
      }),
    )

    render(
      <CartProvider>
        <TestCheckoutComponent line={dummyLine} />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add And Checkout"))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pay ₹1,399/i })).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ashish" } })
    fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9876543210" } })
    fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: "Street" } })
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: "Delhi" } })
    fireEvent.change(screen.getByLabelText(/pin/i), { target: { value: "110091" } })

    const payBtn = screen.getByRole("button", { name: /pay ₹1,399/i })
    fireEvent.submit(payBtn.closest("form")!)

    await waitFor(() => {
      expect(mockRazorpayInstance.open).toHaveBeenCalled()
    })

    // User closes modal
    act(() => {
      razorpayConstructorOptions.modal.ondismiss()
    })

    // Button should be active again, ready for retry
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pay ₹1,399/i })).not.toBeDisabled()
    })
  })
})

function TestCheckoutComponent({ line }: { line: any }) {
  const { add } = useCart()
  return (
    <div>
      <button onClick={() => add(line, true)}>Add And Checkout</button>
    </div>
  )
}
