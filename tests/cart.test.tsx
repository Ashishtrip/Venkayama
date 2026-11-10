import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, renderHook, act } from "@testing-library/react"
import { CartProvider, useCart } from "../src/Cart"
import type { Session } from "@supabase/supabase-js"

// Mock useSession from Auth
const mockSession = vi.fn<() => Session | null>()
vi.mock("../src/Auth", () => ({
  useSession: () => mockSession(),
}))

// Mock checkPromo from store
const mockCheckPromo = vi.fn()
vi.mock("../src/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/store")>()
  return {
    ...actual,
    checkPromo: (...args: any[]) => mockCheckPromo(...args),
  }
})

describe("Cart Context & Calculations", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockSession.mockReturnValue({
      user: { id: "u_1", email: "customer@example.com" },
    } as unknown as Session)
  })

  const dummyItem = {
    name: "FREAK MODE",
    size: "M",
    price: 1399,
    img: "/products/01.jpg",
  }

  it("initializes with empty bag when storage is clear", async () => {
    let hookRes: any
    await act(async () => {
      hookRes = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      })
      await Promise.resolve()
    })

    expect(hookRes.result.current.lines).toEqual([])
    expect(hookRes.result.current.count).toBe(0)
  })

  it("prompts login when guest attempts to add item to bag", async () => {
    mockSession.mockReturnValue(null) // Unauthenticated guest

    render(
      <CartProvider>
        <TestCartConsumer item={dummyItem} />
      </CartProvider>,
    )

    const addBtn = screen.getByText("Add To Bag")
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByText(/login required/i)).toBeInTheDocument()
      expect(screen.getByText(/you need to log in or create an account/i)).toBeInTheDocument()
    })
  })

  it("adds item and increments quantity for authenticated user", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
    })

    act(() => {
      result.current.add(dummyItem)
    })

    expect(result.current.lines).toHaveLength(1)
    expect(result.current.lines[0].name).toBe("FREAK MODE")
    expect(result.current.lines[0].qty).toBe(1)
    expect(result.current.count).toBe(1)

    // Adding same item + size increments quantity
    act(() => {
      result.current.add(dummyItem)
    })

    expect(result.current.lines).toHaveLength(1)
    expect(result.current.lines[0].qty).toBe(2)
    expect(result.current.count).toBe(2)
  })

  it("persists cart lines into localStorage", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
    })

    act(() => {
      result.current.add(dummyItem)
    })

    const stored = JSON.parse(localStorage.getItem("venkayam_cart_v1") || "[]")
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe("FREAK MODE")
  })
})

describe("Cart UI Drawer Interactions", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockSession.mockReturnValue({
      user: { id: "u_1", email: "customer@example.com" },
    } as unknown as Session)
  })

  it("displays free shipping unlocked when subtotal exceeds threshold", async () => {
    const expensiveItem = {
      name: "KALYAN HOODIE",
      size: "L",
      price: 2499,
      img: "ce1cd.png",
    }

    render(
      <CartProvider>
        <TestCartConsumer item={expensiveItem} />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add To Bag"))

    await waitFor(() => {
      expect(screen.getByText(/free shipping unlocked/i)).toBeInTheDocument()
    })
  })

  it("allows increasing, decreasing and removing item from drawer", async () => {
    const item = {
      name: "ONION CAP",
      size: "One size",
      price: 899,
      img: "37da8.png",
    }

    render(
      <CartProvider>
        <TestCartConsumer item={item} />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add To Bag"))

    await waitFor(() => {
      expect(screen.getByText("ONION CAP")).toBeInTheDocument()
    })

    // Increase qty: click +
    const increaseBtn = screen.getByRole("button", { name: "Increase" })
    fireEvent.click(increaseBtn)

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument()
    })

    // Decrease qty twice: click −
    const decreaseBtn = screen.getByRole("button", { name: "Decrease" })
    fireEvent.click(decreaseBtn)
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument()
    })

    fireEvent.click(decreaseBtn)
    await waitFor(() => {
      expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument()
    })
  })

  it("validates promo code application and removal", async () => {
    mockCheckPromo.mockResolvedValue({
      code: "DROP10",
      type: "percent",
      value: 10,
    })

    const item = {
      name: "TEST ITEM",
      size: "M",
      price: 1000,
      img: "/products/01.jpg",
    }

    render(
      <CartProvider>
        <TestCartConsumer item={item} />
      </CartProvider>,
    )

    fireEvent.click(screen.getByText("Add To Bag"))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/promo code/i)).toBeInTheDocument()
    })

    // Empty code submit
    const applyBtn = screen.getByRole("button", { name: /apply/i })
    fireEvent.click(applyBtn)

    await waitFor(() => {
      expect(screen.getByText(/enter a promo code/i)).toBeInTheDocument()
    })

    // Valid code submit
    const promoInput = screen.getByPlaceholderText(/promo code/i)
    fireEvent.change(promoInput, { target: { value: "drop10" } })
    fireEvent.click(applyBtn)

    await waitFor(() => {
      expect(mockCheckPromo).toHaveBeenCalledWith("DROP10")
      expect(screen.getByText(/drop10 applied/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument()
    })

    // Remove promo
    const removeBtn = screen.getByRole("button", { name: /remove/i })
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(screen.queryByText(/drop10 applied/i)).not.toBeInTheDocument()
    })
  })
})

// Helper component to trigger Cart context methods from UI
function TestCartConsumer({ item }: { item: any }) {
  const { add, open } = useCart()
  return (
    <div>
      <button onClick={() => add(item)}>Add To Bag</button>
      <button onClick={() => add(item, true)}>Buy Now</button>
      <button onClick={open}>Open Bag</button>
    </div>
  )
}
