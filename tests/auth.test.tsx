import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import AuthPage, { displayName } from "../src/Auth"
import type { Session } from "@supabase/supabase-js"

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock("../src/lib/supabase", () => ({
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}))

describe("displayName Helper", () => {
  it("prefers full_name from user_metadata", () => {
    const session = {
      user: {
        email: "arun@example.com",
        user_metadata: { full_name: "Arun Kumar" },
      },
    } as unknown as Session

    expect(displayName(session)).toBe("Arun Kumar")
  })

  it("falls back to email prefix when full_name is absent", () => {
    const session = {
      user: {
        email: "designer.venkayam@gmail.com",
        user_metadata: {},
      },
    } as unknown as Session

    expect(displayName(session)).toBe("designer.venkayam")
  })

  it("falls back to Account when neither is available", () => {
    const session = {
      user: {
        email: undefined,
        user_metadata: {},
      },
    } as unknown as Session

    expect(displayName(session)).toBe("Account")
  })
})

describe("AuthPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it("renders login mode by default when initial is login", async () => {
    render(<AuthPage initial="login" />)

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /log in/i })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("button", { name: /^log in$/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument()
  })

  it("switches to sign up mode and validates input fields", async () => {
    render(<AuthPage initial="login" />)

    const signupTab = screen.getByRole("tab", { name: /sign up/i })
    fireEvent.click(signupTab)

    expect(screen.getByRole("heading", { name: /join the archive/i })).toBeInTheDocument()

    // Submit empty form in sign up mode
    const submitBtn = screen.getByRole("button", { name: /create account/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/enter your name/i)).toBeInTheDocument()
    })
  })

  it("validates password length and confirmation match on signup", async () => {
    const { container } = render(<AuthPage initial="signup" />)

    const nameInput = container.querySelector('input[autocomplete="name"]')!
    const emailInput = container.querySelector('input[autocomplete="email"]')!
    const passInput = container.querySelector('input[autocomplete="new-password"]')!
    const confirmInput = container.querySelectorAll('input[autocomplete="new-password"]')[1]!

    fireEvent.change(nameInput, { target: { value: "Karthik" } })
    fireEvent.change(emailInput, { target: { value: "karthik@example.com" } })
    // Short password (< 8 chars)
    fireEvent.change(passInput, { target: { value: "short" } })
    fireEvent.change(confirmInput, { target: { value: "short" } })

    const submitBtn = screen.getByRole("button", { name: /create account/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })

    // Mismatched passwords
    fireEvent.change(passInput, { target: { value: "validpassword123" } })
    fireEvent.change(confirmInput, { target: { value: "differentpassword123" } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it("toggles password visibility with Show/Hide button", () => {
    const { container } = render(<AuthPage initial="login" />)

    const passInput = container.querySelector('input[autocomplete="current-password"]')!
    expect(passInput).toHaveAttribute("type", "password")

    const toggleBtn = screen.getByText(/^show$/i)
    fireEvent.click(toggleBtn)

    expect(passInput).toHaveAttribute("type", "text")
    expect(screen.getByText(/^hide$/i)).toBeInTheDocument()
  })

  it("handles password reset request in forgot password mode", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<AuthPage initial="login" />)

    const forgotLink = screen.getByText(/forgot password\?/i)
    fireEvent.click(forgotLink)

    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument()

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: "reset@example.com" } })

    const sendResetBtn = screen.getByRole("button", { name: /send reset link/i })
    fireEvent.click(sendResetBtn)

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("reset@example.com", expect.any(Object))
      expect(screen.getByText(/reset link is on its way/i)).toBeInTheDocument()
    })
  })
})
