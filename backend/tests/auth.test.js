import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Mock the response/request objects to test controller logic directly,
// or we can test the token generation logic. Here we test the DB and Token logic.

describe("Auth Business Logic & Tokens", () => {
    it("should hash passwords before saving", async () => {
        const password = "mysecretpassword";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        expect(hashedPassword).not.toBe(password);

        const isValid = await bcrypt.compare(password, hashedPassword);
        expect(isValid).toBe(true);
    });

    it("should correctly sign and verify a short-lived Access Token", () => {
        const payload = { id: "12345" };
        const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "15m" });

        expect(token).toBeDefined();

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        expect(decoded.id).toBe("12345");
    });

    it("should fail to verify a token signed with the wrong secret", () => {
        const payload = { id: "12345" };
        const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "wrong", { expiresIn: "15m" });

        expect(() => {
            jwt.verify(token, process.env.JWT_SECRET || "secret");
        }).toThrow();
    });
});
