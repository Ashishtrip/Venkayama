import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, renderHook, act } from "@testing-library/react"
import App from "../../src/App"
import { useUserProfile } from "../../src/lib/userProfile"

// Hoisted mocks for vi.mock
const { mockGetSession, mockOnAuthStateChange } = vi.hoisted(() => {
  return {
    mockGetSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    mockOnAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  }
})

vi.mock("../../src/lib/supabase", () => ({
  ADMIN_EMAILS: ["venkayam@gmail.com", "ashish.deo.tripathi@gmail.com"],
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  }),
}))

describe("Integration: App Header, Navigation & Wishlist Synchronization", () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = "#/"
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
  })

  it("renders main brand identity, navigation bar, and trust highlights", async () => {
    render(<App />)

    // Brand logo & title
    expect(screen.getAllByText(/venkayam/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/india/i).length).toBeGreaterThan(0)

    // Nav items (desktop + mobile navigation links)
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("link", { name: "Shop" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("link", { name: "Drops" }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("link", { name: "About" }).length).toBeGreaterThan(0)

    // Trust strip
    expect(screen.getAllByText(/free shipping/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/easy returns/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/sri lankan cotton/i).length).toBeGreaterThan(0)
  })

  it("renders Admin Gate when user navigates to #/admin without active credentials", async () => {
    window.location.hash = "#/admin"

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/sign in to the control room/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/admin email/i)).toBeInTheDocument()
    })
  })

  it("renders login page when user navigates to #/login", async () => {
    window.location.hash = "#/login"

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /^log in$/i })).toBeInTheDocument()
    })
  })

  it("synchronizes wishlist item count between store and header profile badge", async () => {
    const { result } = renderHook(() => useUserProfile())

    // Toggle items into wishlist using the reactive user profile hook
    act(() => {
      result.current.toggleWishlist("GEN-001")
      result.current.toggleWishlist("GEN-014")
    })

    render(<App />)

    await waitFor(() => {
      // Header profile button displays wishlist badge [2]
      const profileLink = screen.getByTitle("My Profile & Wishlist")
      expect(profileLink).toHaveTextContent("2")
    })
  })
})
