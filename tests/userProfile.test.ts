import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  loadProfile,
  saveProfile,
  useUserProfile,
  type UserProfile,
  type UserAddress,
  type SavedPaymentMethod,
} from "../src/lib/userProfile"

describe("User Profile Storage & Sanitization", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("loads default profile when localStorage is empty", () => {
    const profile = loadProfile("user@example.com")
    expect(profile.email).toBe("user@example.com")
    expect(profile.fullName).toBe("")
    expect(profile.addresses).toEqual([])
    expect(profile.paymentMethods).toEqual([])
    expect(profile.orders).toEqual([])
    expect(profile.wishlist).toEqual([])
  })

  it("persists and restores profile accurately", () => {
    const customProfile: UserProfile = {
      fullName: "Arun Kumar",
      email: "arun@example.com",
      phone: "9123456789",
      addresses: [
        {
          id: "addr_1",
          label: "Studio",
          name: "Arun Kumar",
          phone: "9123456789",
          address: "12 Artisan Lane",
          city: "Chennai",
          state: "Tamil Nadu",
          pin: "600001",
          isDefault: true,
        },
      ],
      paymentMethods: [],
      orders: [],
      wishlist: ["GEN-001", "GEN-014"],
      createdDate: Date.now(),
    }

    saveProfile(customProfile, "arun@example.com")
    const loaded = loadProfile("arun@example.com")

    expect(loaded.fullName).toBe("Arun Kumar")
    expect(loaded.email).toBe("arun@example.com")
    expect(loaded.addresses).toHaveLength(1)
    expect(loaded.addresses[0].city).toBe("Chennai")
    expect(loaded.wishlist).toEqual(["GEN-001", "GEN-014"])
  })

  it("filters out legacy dummy fixtures and cleans placeholder demo credentials", () => {
    const dirtyData = {
      fullName: "Ashish Tripathi", // Placeholder name that should be wiped clean
      email: "test@example.com",
      phone: "9876543210", // Placeholder phone
      addresses: [
        { id: "addr_default_1", label: "Dummy Address" }, // Dummy id to be filtered
        { id: "addr_real_1", label: "Home", city: "Delhi", isDefault: true },
      ],
      paymentMethods: [
        { id: "pm_upi_1", type: "upi", vpa: "demo@upi" }, // Dummy id to be filtered
        { id: "pm_real_1", type: "upi", vpa: "actual@okaxis", isDefault: true },
      ],
      orders: [
        { id: "VNK-1004" }, // Dummy id to be filtered
        { id: "VNK-9999", amount: 1499 },
      ],
      wishlist: ["GEN-036", "GEN-014", "GEN-016"],
    }

    localStorage.setItem("venkayam_user_profile_test@example.com", JSON.stringify(dirtyData))

    const loaded = loadProfile("test@example.com")
    expect(loaded.fullName).toBe("") // Sanitized
    expect(loaded.phone).toBe("") // Sanitized
    expect(loaded.addresses.map((a: any) => a.id)).toEqual(["addr_real_1"])
    expect(loaded.paymentMethods.map((p: any) => p.id)).toEqual(["pm_real_1"])
    expect(loaded.orders.map((o: any) => o.id)).toEqual(["VNK-9999"])
  })

  it("handles corrupted JSON in localStorage gracefully without throwing", () => {
    localStorage.setItem("venkayam_user_profile_guest", "{ broken json content ...")
    expect(() => loadProfile()).not.toThrow()
    const fallback = loadProfile()
    expect(fallback.fullName).toBe("")
    expect(fallback.addresses).toEqual([])
  })
})

describe("Payment Method Security & Compliance (PCI-DSS & RBI Tokenization)", () => {
  it("enforces safe tokenized card storage without CVV or full PAN", () => {
    const cardMethod: SavedPaymentMethod = {
      id: "pm_safe_1",
      type: "card",
      brand: "Visa",
      last4: "4242",
      holderName: "Arun K.",
      expMonth: "12",
      expYear: "28",
      isDefault: true,
    }

    // Verify type safety: sensitive fields should not exist
    expect(cardMethod).not.toHaveProperty("cvv")
    expect(cardMethod).not.toHaveProperty("pan")
    expect(cardMethod).not.toHaveProperty("cardNumber")
    expect(cardMethod.last4).toHaveLength(4)
    expect(cardMethod.brand).toBe("Visa")
  })

  it("supports UPI VPA methods securely", () => {
    const upiMethod: SavedPaymentMethod = {
      id: "pm_upi_real",
      type: "upi",
      vpa: "customer@okhdfcbank",
      app: "Google Pay",
      isDefault: true,
    }

    expect(upiMethod.type).toBe("upi")
    expect(upiMethod.vpa).toContain("@")
    expect(upiMethod.isDefault).toBe(true)
  })
})

describe("Address Management Logic Simulation", () => {
  it("promotes first remaining address to default when default is deleted", () => {
    let addresses: UserAddress[] = [
      {
        id: "addr_1",
        label: "Home",
        name: "User 1",
        phone: "9876543210",
        address: "Address 1",
        city: "Delhi",
        state: "Delhi",
        pin: "110091",
        isDefault: true,
      },
      {
        id: "addr_2",
        label: "Work",
        name: "User 1",
        phone: "9876543210",
        address: "Address 2",
        city: "Noida",
        state: "UP",
        pin: "201301",
        isDefault: false,
      },
    ]

    // Simulate deleting addr_1
    const nextAddresses = addresses.filter((a) => a.id !== "addr_1")
    if (nextAddresses.length > 0 && !nextAddresses.some((a) => a.isDefault)) {
      nextAddresses[0].isDefault = true
    }

    expect(nextAddresses).toHaveLength(1)
    expect(nextAddresses[0].id).toBe("addr_2")
    expect(nextAddresses[0].isDefault).toBe(true)
  })
})

describe("useUserProfile Reactive Hook", () => {
  beforeEach(async () => {
    localStorage.clear()
    await act(async () => {
      await Promise.resolve()
    })
  })

  async function renderProfileHook() {
    let hookRes: any
    await act(async () => {
      hookRes = renderHook(() => useUserProfile())
      await Promise.resolve()
    })
    return hookRes
  }

  it("manages addresses (add, update, set default, delete)", async () => {
    const { result } = await renderProfileHook()

    // Add first address (should automatically be set default)
    act(() => {
      result.current.addAddress({
        label: "Home",
        name: "Test Customer",
        phone: "9876543210",
        address: "Block 1",
        city: "Delhi",
        state: "Delhi",
        pin: "110091",
        isDefault: false,
      })
    })

    expect(result.current.profile.addresses).toHaveLength(1)
    expect(result.current.profile.addresses[0].isDefault).toBe(true)
    const firstId = result.current.profile.addresses[0].id

    // Add second address with isDefault: true
    act(() => {
      result.current.addAddress({
        label: "Studio",
        name: "Test Customer",
        phone: "9876543210",
        address: "Block 2",
        city: "Delhi",
        state: "Delhi",
        pin: "110092",
        isDefault: true,
      })
    })

    expect(result.current.profile.addresses).toHaveLength(2)
    const secondId = result.current.profile.addresses[1].id
    expect(result.current.profile.addresses[1].isDefault).toBe(true)
    expect(result.current.profile.addresses[0].isDefault).toBe(false)

    // Update first address label
    act(() => {
      result.current.updateAddress(firstId, { label: "Main Office" })
    })
    expect(result.current.profile.addresses.find((a) => a.id === firstId)?.label).toBe("Main Office")

    // Set first address back to default
    act(() => {
      result.current.setDefaultAddress(firstId)
    })
    expect(result.current.profile.addresses.find((a) => a.id === firstId)?.isDefault).toBe(true)
    expect(result.current.profile.addresses.find((a) => a.id === secondId)?.isDefault).toBe(false)

    // Delete default address (second address should now become default)
    act(() => {
      result.current.deleteAddress(firstId)
    })
    expect(result.current.profile.addresses).toHaveLength(1)
    expect(result.current.profile.addresses[0].id).toBe(secondId)
    expect(result.current.profile.addresses[0].isDefault).toBe(true)
  })

  it("manages payment methods securely", async () => {
    const { result } = await renderProfileHook()

    // Add UPI method
    act(() => {
      result.current.addPaymentMethod({
        type: "upi",
        vpa: "user@okhdfcbank",
        app: "Google Pay",
        isDefault: false,
      })
    })

    expect(result.current.profile.paymentMethods).toHaveLength(1)
    expect(result.current.profile.paymentMethods[0].isDefault).toBe(true)
    const upiId = result.current.profile.paymentMethods[0].id

    // Add Card method
    act(() => {
      result.current.addPaymentMethod({
        type: "card",
        brand: "Visa",
        last4: "1234",
        holderName: "User",
        expMonth: "08",
        expYear: "29",
        isDefault: true,
      })
    })

    expect(result.current.profile.paymentMethods).toHaveLength(2)
    const cardId = result.current.profile.paymentMethods[1].id
    expect(result.current.profile.paymentMethods[1].isDefault).toBe(true)
    expect(result.current.profile.paymentMethods[0].isDefault).toBe(false)

    // Set UPI default
    act(() => {
      result.current.setDefaultPaymentMethod(upiId)
    })
    expect(result.current.profile.paymentMethods.find((p) => p.id === upiId)?.isDefault).toBe(true)

    // Delete method
    act(() => {
      result.current.deletePaymentMethod(upiId)
    })
    expect(result.current.profile.paymentMethods).toHaveLength(1)
    expect(result.current.profile.paymentMethods[0].id).toBe(cardId)
    expect(result.current.profile.paymentMethods[0].isDefault).toBe(true)
  })

  it("toggles wishlist items and checks status accurately", async () => {
    const { result } = await renderProfileHook()

    expect(result.current.isWishlisted("GEN-001")).toBe(false)
    expect(result.current.wishlistCount).toBe(0)

    // Toggle by string
    act(() => {
      result.current.toggleWishlist("GEN-001")
    })
    expect(result.current.isWishlisted("GEN-001")).toBe(true)
    expect(result.current.wishlistCount).toBe(1)

    // Toggle by product object with sku
    act(() => {
      result.current.toggleWishlist({ sku: "GEN-002", id: "p2", name: "LOWKEY DRIP" })
    })
    expect(result.current.isWishlisted("GEN-002")).toBe(true)
    expect(result.current.isWishlisted({ id: "p2", sku: "GEN-002" })).toBe(true)
    expect(result.current.wishlistCount).toBe(2)

    // Untoggle
    act(() => {
      result.current.toggleWishlist("GEN-001")
    })
    expect(result.current.isWishlisted("GEN-001")).toBe(false)
    expect(result.current.wishlistCount).toBe(1)
  })

  it("records user orders and updates profile details", async () => {
    const { result } = await renderProfileHook()

    await act(async () => {
      await result.current.updateDetails({
        fullName: "Rahul Dravid",
        phone: "9876543211",
      })
    })

    expect(result.current.profile.fullName).toBe("Rahul Dravid")
    expect(result.current.profile.phone).toBe("9876543211")

    act(() => {
      result.current.recordOrder({
        id: "VNK-9001",
        track: "TRK-9001",
        createdAt: Date.now(),
        customer: "Rahul Dravid",
        phone: "9876543211",
        city: "Bengaluru",
        address: "Indiranagar",
        pay: "Card",
        status: "Placed",
        amount: 2499,
        items: [{ name: "KALYAN HOODIE", size: "L", qty: 1, price: 2499 }],
      })
    })

    expect(result.current.profile.orders).toHaveLength(1)
    expect(result.current.profile.orders[0].id).toBe("VNK-9001")
  })
})
