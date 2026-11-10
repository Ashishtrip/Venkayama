import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import AdminGate from "../../src/AdminGate"

// Mock supabase client methods
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

vi.mock("../../src/lib/supabase", () => ({
  ADMIN_EMAILS: ["venkayam@gmail.com", "ashish.deo.tripathi@gmail.com"],
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  }),
}))

// Mock Admin screen component to avoid deep rendering of admin dashboard in gate test
vi.mock("../../src/Admin", () => ({
  default: ({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) => (
    <div data-testid="admin-dashboard">
      <h1>Admin Dashboard for {userEmail}</h1>
      <button onClick={onSignOut}>Sign out</button>
    </div>
  ),
}))

describe("AdminGate Authentication Boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it("renders sign in form when there is no active session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    render(<AdminGate />)

    await waitFor(() => {
      expect(screen.getByText(/sign in to the control room/i)).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText(/admin email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByText(/back to storefront/i)).toBeInTheDocument()
  })

  it("validates empty email or short password on form submit", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    render(<AdminGate />)

    await waitFor(() => {
      expect(screen.getByText(/sign in to the control room/i)).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole("button", { name: /^sign in$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/enter your email and a password of 8\+ characters/i)).toBeInTheDocument()
    })
  })

  it("rejects unauthorized signup if email is not on admin whitelist", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    render(<AdminGate />)

    await waitFor(() => {
      expect(screen.getByText(/sign in to the control room/i)).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText(/admin email/i)
    const passInput = screen.getByPlaceholderText(/password/i)

    fireEvent.change(emailInput, { target: { value: "unauthorized@example.com" } })
    fireEvent.change(passInput, { target: { value: "securepassword123" } })

    const createAccountBtn = screen.getByRole("button", { name: /create admin account/i })
    fireEvent.click(createAccountBtn)

    await waitFor(() => {
      expect(screen.getByText(/that email is not on the admin list/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it("renders Admin Dashboard when user session belongs to whitelist", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { email: "venkayam@gmail.com" },
        },
      },
    })

    render(<AdminGate />)

    await waitFor(() => {
      expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument()
      expect(screen.getByText(/admin dashboard for venkayam@gmail.com/i)).toBeInTheDocument()
    })
  })

  it("displays authorization error message when signed-in user is not authorized", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { email: "stranger@gmail.com" },
        },
      },
    })

    render(<AdminGate />)

    await waitFor(() => {
      expect(screen.getByText(/stranger@gmail.com is not authorised/i)).toBeInTheDocument()
    })
  })
})

