import fs from "fs";
import { generateInvoicePDF } from "./utils/invoiceService.js";

async function testPDFGeneration() {
    const dummyOrder = {
        _id: "ORD-999-XYZ",
        invoiceNumber: "INV-12345-678",
        date: new Date(),
        items: [
            { name: "Extra Large Pepperoni Pizza", price: 25, quantity: 2 },
            { name: "Garlic Bread", price: 5, quantity: 1 }
        ],
        subtotal: 55,
        taxAmount: 4.84, // 8.8% tax
        deliveryFee: 50,
        amount: 109.84,
        address: {
            firstName: "Jane",
            lastName: "Doe",
            street: "789 Taste Ave",
            city: "Gourmet City",
            state: "NY",
            zipcode: "10001",
            phone: "555-555-5555"
        }
    };

    const dummyUser = {
        email: "jane.doe@example.com"
    };

    try {
        const pdfBuffer = await generateInvoicePDF(dummyOrder, dummyUser);
        fs.writeFileSync("test-invoice.pdf", pdfBuffer);
        console.log("✅ PDF Generated successfully! Saved as test-invoice.pdf");
    } catch (err) {
        console.error("❌ PDF Generation failed:", err);
    }
}

testPDFGeneration();
