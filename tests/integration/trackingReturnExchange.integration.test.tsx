import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TrackOrder, Returns, ReturnTimeline } from "../../src/Pages"
import { actions, trackOrder, getReturn, type Order, type ReturnReq } from "../../src/store"
import * as invoiceGen from "../../src/lib/invoiceGenerator"

// Mock store calls
vi.mock("../../src/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/store")>()
  const seeded = actual.seed()
  return {
    ...actual,
    trackOrder: vi.fn(),
    getReturn: vi.fn(),
    useDB: vi.fn((sel: any) => sel(seeded)),
    actions: {
      ...actual.actions,
      requestReturn: vi.fn(),
    },
  }
})

describe("Integration: Tracking, Return and Exchange Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const mockDeliveredOrder: Order = {
    id: "VNK-8001",
    customer: "Ashish Tripathi",
    phone: "9876543210",
    city: "Delhi",
    address: "Mayur Vihar Phase 1",
    amount: 1399,
    pay: "UPI",
    status: "Delivered",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // Delivered 2 days ago (within 7-day window)
    deliveredAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    track: "3FA91C07BE",
    note: "",
    items: [
      {
        name: "FREAK MODE",
        size: "M",
        qty: 1,
        price: 1399,
      },
    ],
  }

  describe("1. TrackOrder Page", () => {
    it("validates tracking code regex and phone format, rejecting malformed input without calling API", async () => {
      render(<TrackOrder />)

      const refInput = screen.getByPlaceholderText(/tracking code/i)
      const phoneInput = screen.getByPlaceholderText(/98765 43210/i)
      const trackBtn = screen.getByRole("button", { name: /^track$/i })

      // Invalid tracking code (not 10 hex characters) & phone < 10 digits
      fireEvent.change(refInput, { target: { value: "invalid-code" } })
      fireEvent.change(phoneInput, { target: { value: "12345" } })
      fireEvent.click(trackBtn)

      await waitFor(() => {
        expect(
          screen.getByText(/check the tracking code \(10 hex characters\) and a 10 digit phone number/i),
        ).toBeInTheDocument()
      })

      expect(trackOrder).not.toHaveBeenCalled()
    })

    it("handles order-not-found lookup gracefully with user-friendly alert", async () => {
      vi.mocked(trackOrder).mockResolvedValue(null)

      render(<TrackOrder />)

      const refInput = screen.getByPlaceholderText(/tracking code/i)
      const phoneInput = screen.getByPlaceholderText(/98765 43210/i)
      const trackBtn = screen.getByRole("button", { name: /^track$/i })

      fireEvent.change(refInput, { target: { value: "3FA91C07BE" } })
      fireEvent.change(phoneInput, { target: { value: "9876543210" } })
      fireEvent.click(trackBtn)

      await waitFor(() => {
        expect(trackOrder).toHaveBeenCalledWith("3FA91C07BE", "9876543210")
        expect(screen.getByText(/no order found for that reference and phone number/i)).toBeInTheDocument()
      })
    })

    it("renders active order timeline, status badge, items text, and invoice download button", async () => {
      const orderInTransit: Order = {
        ...mockDeliveredOrder,
        id: "VNK-9002",
        status: "Printing",
      }

      vi.mocked(trackOrder).mockResolvedValue({
        order: orderInTransit,
        returns: [],
      })

      const invoiceSpy = vi.spyOn(invoiceGen, "downloadGSTInvoice").mockImplementation(() => {})

      render(<TrackOrder />)

      fireEvent.change(screen.getByPlaceholderText(/tracking code/i), { target: { value: "3FA91C07BE" } })
      fireEvent.change(screen.getByPlaceholderText(/98765 43210/i), { target: { value: "9876543210" } })
      fireEvent.click(screen.getByRole("button", { name: /^track$/i }))

      await waitFor(() => {
        expect(screen.getByText("VNK-9002")).toBeInTheDocument()
        expect(screen.getAllByText("Printing").length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText(/FREAK MODE/i)).toBeInTheDocument()
      })

      // Click GST invoice download button
      const invoiceBtn = screen.getByRole("button", { name: /download gst invoice/i })
      fireEvent.click(invoiceBtn)
      expect(invoiceSpy).toHaveBeenCalledWith(orderInTransit)
    })

    it("renders associated return timeline when order has an active return or exchange", async () => {
      const activeReturn: ReturnReq = {
        id: "RET-4001",
        orderId: mockDeliveredOrder.id,
        trackCode: mockDeliveredOrder.track!,
        phone: mockDeliveredOrder.phone,
        type: "Exchange",
        newSize: "L",
        item: mockDeliveredOrder.items[0],
        reason: "Too small",
        comment: "Need larger fit",
        status: "Approved",
        createdAt: Date.now() - 10000,
        history: [
          { s: "Requested", t: Date.now() - 20000 },
          { s: "Approved", t: Date.now() - 10000, note: "Size L is reserved." },
        ],
      }

      vi.mocked(trackOrder).mockResolvedValue({
        order: mockDeliveredOrder,
        returns: [activeReturn],
      })

      render(<TrackOrder />)

      fireEvent.change(screen.getByPlaceholderText(/tracking code/i), { target: { value: "3FA91C07BE" } })
      fireEvent.change(screen.getByPlaceholderText(/98765 43210/i), { target: { value: "9876543210" } })
      fireEvent.click(screen.getByRole("button", { name: /^track$/i }))

      await waitFor(() => {
        expect(screen.getByText("RET-4001")).toBeInTheDocument()
        expect(screen.getByText(/exchange · order vnk-8001/i)).toBeInTheDocument()
        expect(screen.getByText(/size L is reserved/i)).toBeInTheDocument()
      })
    })
  })

  describe("2. Returns & Exchange Flow (StartRequest)", () => {
    it("blocks request submission when order is not yet delivered", async () => {
      const undeliveredOrder: Order = {
        ...mockDeliveredOrder,
        status: "Printing",
      }

      vi.mocked(trackOrder).mockResolvedValue({
        order: undeliveredOrder,
        returns: [],
      })

      render(<Returns />)

      // Look up order
      fireEvent.change(screen.getByLabelText(/tracking code/i), { target: { value: "3FA91C07BE" } })
      fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9876543210" } })
      fireEvent.click(screen.getByRole("button", { name: /find my order/i }))

      await waitFor(() => {
        expect(screen.getByText(/order vnk-8001/i)).toBeInTheDocument()
      })

      // Ineligible reason displayed
      expect(screen.getAllByText(/returns open once the order is delivered/i).length).toBeGreaterThanOrEqual(1)

      // Submit button should be disabled
      const submitBtn = screen.getByRole("button", { name: /submit exchange request/i })
      expect(submitBtn).toBeDisabled()
    })

    it("requires selecting a replacement size when initiating an exchange", async () => {
      vi.mocked(trackOrder).mockResolvedValue({
        order: mockDeliveredOrder,
        returns: [],
      })

      render(<Returns />)

      // Find order
      fireEvent.change(screen.getByLabelText(/tracking code/i), { target: { value: "3FA91C07BE" } })
      fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9876543210" } })
      fireEvent.click(screen.getByRole("button", { name: /find my order/i }))

      await waitFor(() => {
        expect(screen.getByText(/order vnk-8001/i)).toBeInTheDocument()
      })

      // Attempt submit without selecting newSize
      const form = screen.getByRole("button", { name: /submit exchange request/i }).closest("form")!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText(/choose the size you want instead/i)).toBeInTheDocument()
      })
      expect(actions.requestReturn).not.toHaveBeenCalled()
    })

    it("successfully creates and confirms an Exchange request with selected size and reason", async () => {
      vi.mocked(trackOrder).mockResolvedValue({
        order: mockDeliveredOrder,
        returns: [],
      })

      const mockCreatedReturn: ReturnReq = {
        id: "RET-7788",
        orderId: mockDeliveredOrder.id,
        trackCode: mockDeliveredOrder.track!,
        phone: mockDeliveredOrder.phone,
        type: "Exchange",
        newSize: "L",
        item: mockDeliveredOrder.items[0],
        reason: "Too small",
        comment: "Please provide size L",
        status: "Requested",
        createdAt: Date.now(),
        history: [{ s: "Requested", t: Date.now() }],
      }

      vi.mocked(actions.requestReturn).mockResolvedValue(mockCreatedReturn)

      render(<Returns />)

      // Find order
      fireEvent.change(screen.getByLabelText(/tracking code/i), { target: { value: "3FA91C07BE" } })
      fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9876543210" } })
      fireEvent.click(screen.getByRole("button", { name: /find my order/i }))

      await waitFor(() => {
        expect(screen.getByText(/order vnk-8001/i)).toBeInTheDocument()
      })

      // Select new size "L"
      const sizeSelect = screen.getByLabelText(/new size/i)
      fireEvent.change(sizeSelect, { target: { value: "L" } })

      // Select reason
      const reasonSelect = screen.getByLabelText(/reason/i)
      fireEvent.change(reasonSelect, { target: { value: "Size does not fit" } })

      // Add comment
      const commentInput = screen.getByPlaceholderText(/anything we should know/i)
      fireEvent.change(commentInput, { target: { value: "Please provide size L" } })

      // Submit
      const submitBtn = screen.getByRole("button", { name: /submit exchange request/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(actions.requestReturn).toHaveBeenCalledWith(
          expect.objectContaining({
            code: "3FA91C07BE",
            phone: "9876543210",
            type: "Exchange",
            newSize: "L",
            reason: "Size does not fit",
            comment: "Please provide size L",
          }),
        )
      })

      // Confirmation screen rendered
      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument()
        expect(screen.getByText(/exchange request received/i)).toBeInTheDocument()
        expect(screen.getByText("RET-7788")).toBeInTheDocument()
      })

      // Reset form on "New request" click
      fireEvent.click(screen.getByRole("button", { name: /new request/i }))
      expect(screen.getByLabelText(/tracking code/i)).toBeInTheDocument()
    })
  })

  describe("3. ReturnStatus & ReturnTimeline", () => {
    it("checks status of existing return request and renders progression through timeline steps", async () => {
      const existingReq: ReturnReq = {
        id: "RET-5050",
        orderId: "VNK-3000",
        trackCode: "TRACKHEX12",
        phone: "9876543210",
        type: "Return",
        item: { name: "FREAK MODE", size: "XL", qty: 1, price: 1399 },
        reason: "Changed my mind",
        status: "Pickup scheduled",
        courier: "DELHIVERY-998877",
        createdAt: Date.now() - 3600000,
        history: [
          { s: "Requested", t: Date.now() - 3600000 },
          { s: "Approved", t: Date.now() - 2400000 },
          { s: "Pickup scheduled", t: Date.now() - 1200000, note: "Pickup set for tomorrow afternoon" },
        ],
      }

      vi.mocked(getReturn).mockResolvedValue(existingReq)

      render(<Returns />)

      // Switch to Check status tab
      fireEvent.click(screen.getByRole("tab", { name: /check status/i }))

      // Fill request lookup
      fireEvent.change(screen.getByLabelText(/request id/i), { target: { value: "RET-5050" } })
      fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: "9876543210" } })
      fireEvent.click(screen.getByRole("button", { name: /check status/i }))

      await waitFor(() => {
        expect(getReturn).toHaveBeenCalledWith("RET-5050", "9876543210")
        expect(screen.getByText("RET-5050")).toBeInTheDocument()
        expect(screen.getByText(/courier ref delhivery-998877/i)).toBeInTheDocument()
        expect(screen.getByText(/pickup set for tomorrow afternoon/i)).toBeInTheDocument()
      })
    })

    it("renders rejected return request with alert notice and customer service contact", () => {
      const rejectedReq: ReturnReq = {
        id: "RET-9999",
        orderId: "VNK-1111",
        trackCode: "TRACK99999",
        phone: "9876543210",
        type: "Return",
        item: { name: "FREAK MODE", size: "M", qty: 1, price: 1399 },
        reason: "Changed my mind",
        status: "Rejected",
        createdAt: Date.now() - 86400000,
        history: [
          { s: "Requested", t: Date.now() - 86400000 },
          { s: "Rejected", t: Date.now() - 43200000, note: "Security tag was removed." },
        ],
      }

      render(<ReturnTimeline r={rejectedReq} />)

      expect(screen.getByText("RET-9999")).toBeInTheDocument()
      expect(screen.getByText(/rejected/i)).toBeInTheDocument()
      expect(screen.getByText(/security tag was removed/i)).toBeInTheDocument()
      expect(screen.getByText(/care@venkayam\.in/i)).toBeInTheDocument()
    })
  })
})
