import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import HeroCards from "../../src/components/HeroCards"

describe("HeroCards Component", () => {
  const mockItems = [
    {
      card: { kicker: "SERIES 004", badge: "Staff pick", img: "/products/36.jpg" },
      product: {
        id: "p_1",
        name: "THE GUARDIAN",
        price: 1499,
        img: "/products/36.jpg",
        stock: "LIMITED [12 PCS]",
      },
      href: "#/product/p_1",
    },
    {
      card: { kicker: "ARCHIVE DROP", badge: "Hot right now" },
      product: {
        id: "p_2",
        name: "DISCIPLINE",
        price: 0,
        img: "/products/14.jpg",
      },
      href: "#/product/p_2",
    },
  ]

  it("returns null when items array is empty", () => {
    const { container } = render(<HeroCards items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders product cards with proper labels, links and badges", () => {
    render(<HeroCards items={mockItems} />)

    expect(screen.getByText("THE GUARDIAN")).toBeInTheDocument()
    expect(screen.getByText("DISCIPLINE")).toBeInTheDocument()
    expect(screen.getByText("SERIES 004")).toBeInTheDocument()
    expect(screen.getByText("Staff pick")).toBeInTheDocument()
    expect(screen.getByText("Hot right now")).toBeInTheDocument()
    expect(screen.getByText("LIMITED [12 PCS]")).toBeInTheDocument()

    // Price formatting check: inr(1499) -> ₹1,499
    expect(screen.getByText(/₹1,499/)).toBeInTheDocument()
    // Zero price shows COMING SOON
    expect(screen.getByText("COMING SOON")).toBeInTheDocument()

    // Links check
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute("href", "#/product/p_1")
    expect(links[1]).toHaveAttribute("href", "#/product/p_2")
  })
})

