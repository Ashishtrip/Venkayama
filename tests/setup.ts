import "@testing-library/jest-dom/vitest"

// Polyfill IntersectionObserver for JSDOM
class MockIntersectionObserver {
  observe = () => {}
  unobserve = () => {}
  disconnect = () => {}
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

// Polyfill window.scrollTo for JSDOM
window.scrollTo = () => {}



