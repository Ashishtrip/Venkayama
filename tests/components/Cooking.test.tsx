import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Cooking from "../../src/components/Cooking"

describe("Cooking Status Component", () => {
  it("renders with status role and Cooking text", () => {
    render(<Cooking />)
    const statusContainer = screen.getByRole("status")
    expect(statusContainer).toBeInTheDocument()
    expect(screen.getByText(/cooking/i)).toBeInTheDocument()
  })

  it("applies custom class names properly", () => {
    render(<Cooking className="custom-cooking-class" />)
    const statusContainer = screen.getByRole("status")
    expect(statusContainer).toHaveClass("custom-cooking-class")
  })
})

