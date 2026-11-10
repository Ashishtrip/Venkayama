import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import OnionLogo from "../../src/components/OnionLogo"

describe("OnionLogo Component", () => {
  it("renders with proper accessibility attributes", () => {
    render(<OnionLogo />)
    const logoContainer = screen.getByRole("img", { name: /venkayam onion logo/i })
    expect(logoContainer).toBeInTheDocument()
  })

  it("applies custom class names properly", () => {
    render(<OnionLogo className="h-24 custom-test-class" />)
    const logoContainer = screen.getByRole("img", { name: /venkayam onion logo/i })
    expect(logoContainer).toHaveClass("h-24")
    expect(logoContainer).toHaveClass("custom-test-class")
    expect(logoContainer).toHaveClass("aspect-[860/1193]")
  })

  it("renders both onion-body and onion-tip layered images", () => {
    const { container } = render(<OnionLogo />)
    const images = container.querySelectorAll("img")
    expect(images).toHaveLength(2)

    const bodyImg = images[0]
    const tipImg = images[1]

    expect(bodyImg).toHaveAttribute("src", "/assets/onion-body.png")
    expect(tipImg).toHaveAttribute("src", "/assets/onion-tip.png")
    expect(tipImg).toHaveClass("onion-tip")
  })
})

