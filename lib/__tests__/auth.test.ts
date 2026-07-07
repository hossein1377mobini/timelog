import { describe, it, expect, beforeAll } from "vitest"
import { signToken, verifyToken } from "@/lib/auth"

describe("signToken / verifyToken", () => {
  it("signs a token and verifies it correctly", async () => {
    const token = await signToken("user-123", "testuser")
    expect(token).toBeTruthy()
    expect(typeof token).toBe("string")

    const payload = await verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.sub).toBe("user-123")
    expect(payload!.username).toBe("testuser")
  })

  it("verifying a corrupted token returns null", async () => {
    const payload = await verifyToken("bogus.token.here")
    expect(payload).toBeNull()
  })

  it("handles empty string token", async () => {
    const payload = await verifyToken("")
    expect(payload).toBeNull()
  })
})

describe("token expiry", () => {
  it("tampering with the token returns null", async () => {
    const token = await signToken("user-456", "tampered")
    const parts = token.split(".")
    const tampered = parts[0] + "." + parts[1] + ".invalidsig"
    const payload = await verifyToken(tampered)
    expect(payload).toBeNull()
  })
})
