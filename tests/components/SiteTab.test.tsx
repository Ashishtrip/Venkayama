import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import SiteTab from "../../src/components/SiteTab"
import { actions, DEFAULT_STOREFRONT } from "../../src/store"

describe("SiteTab Storefront Visuals Editor", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("renders all four management panels with titles and kickers", () => {
    render(<SiteTab />)

    expect(screen.getByRole("heading", { name: /home hero cards/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /category thumbnails/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /past drops/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /archive poster/i })).toBeInTheDocument()
  })

  it("allows editing Hero Card 1 sticker and heading", () => {
    render(<SiteTab />)

    const stickerInputs = screen.getAllByDisplayValue(DEFAULT_STOREFRONT.hero1.sticker || "Staff pick")
    const headingInputs = screen.getAllByDisplayValue(DEFAULT_STOREFRONT.hero1.heading || "Series 004 // Hero spec")

    expect(stickerInputs.length).toBeGreaterThan(0)
    expect(headingInputs.length).toBeGreaterThan(0)

    fireEvent.change(stickerInputs[0], { target: { value: "Top Trend" } })
    expect(screen.getByDisplayValue("Top Trend")).toBeInTheDocument()
  })

  it("supports adding and removing past drops", async () => {
    render(<SiteTab />)

    const initialRemoveBtns = screen.getAllByRole("button", { name: /remove/i })
    const initialCount = initialRemoveBtns.length

    // Click "+ Add past drop"
    const addDropBtn = screen.getByRole("button", { name: /\+ add past drop/i })
    fireEvent.click(addDropBtn)

    await waitFor(() => {
      const nextRemoveBtns = screen.getAllByRole("button", { name: /remove/i })
      expect(nextRemoveBtns.length).toBe(initialCount + 1)
    })

    // Remove the newly added drop
    const removeBtns = screen.getAllByRole("button", { name: /remove/i })
    fireEvent.click(removeBtns[removeBtns.length - 1])

    await waitFor(() => {
      const finalRemoveBtns = screen.getAllByRole("button", { name: /remove/i })
      expect(finalRemoveBtns.length).toBe(initialCount)
    })
  })

  it("saves storefront modifications and triggers actions.updateStorefront", async () => {
    const updateSpy = vi.spyOn(actions, "updateStorefront").mockImplementation(() => {})

    render(<SiteTab />)

    // Save hero section
    const saveButtons = screen.getAllByRole("button", { name: /^save$/i })
    expect(saveButtons.length).toBeGreaterThan(0)

    fireEvent.click(saveButtons[0])

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled()
      expect(screen.getByText("SAVED ✓")).toBeInTheDocument()
    })
  })
})

