import PDFDocument from "pdfkit";

/**
 * Generates a PDF invoice buffer for an order
 * @param {Object} order - The order document from DB
 * @param {Object} user - The user document from DB
 * @returns {Promise<Buffer>} - Resolves with the PDF Buffer
 */
export const generateInvoicePDF = (order, user) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- Header ---
            doc
                .fillColor("#ff6b35")
                .fontSize(28)
                .text("BiteBlitz", 50, 45)
                .fillColor("#000000")
                .fontSize(10)
                .text("123 Foodie Lane, Flavor Town, CA 90210", 200, 50, { align: "right" })
                .text("support@biteblitz.com | (555) 123-4567", 200, 65, { align: "right" })
                .moveDown();

            doc.moveTo(50, 90).lineTo(550, 90).stroke();

            // --- Invoice Details ---
            doc
                .fontSize(20)
                .text("INVOICE", 50, 110);

            doc
                .fontSize(10)
                .text(`Order Number: ${order._id}`, 50, 135)
                .text(`Date: ${new Date(order.date).toLocaleDateString()}`, 50, 150)
                .text(`Invoice Number: ${order.invoiceNumber || 'N/A'}`, 50, 165);

            // --- Customer Details ---
            const address = order.address;
            doc
                .text("Billed To:", 300, 135)
                .font("Helvetica-Bold")
                .text(`${address.firstName} ${address.lastName}`, 300, 150)
                .font("Helvetica")
                .text(`${address.street}`, 300, 165)
                .text(`${address.city}, ${address.state} ${address.zipcode}`, 300, 180)
                .text(`${user.email}`, 300, 195)
                .text(`${address.phone}`, 300, 210);

            doc.moveTo(50, 240).lineTo(550, 240).stroke();

            // --- Itemized Table Header ---
            let y = 260;
            doc
                .font("Helvetica-Bold")
                .text("Item", 50, y)
                .text("Quantity", 280, y, { width: 90, align: "right" })
                .text("Price", 370, y, { width: 90, align: "right" })
                .text("Total", 460, y, { width: 90, align: "right" });

            doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
            y += 25;

            // --- Table Rows ---
            doc.font("Helvetica");
            order.items.forEach((item) => {
                const itemTotal = item.price * item.quantity;
                doc
                    .text(item.name, 50, y)
                    .text(item.quantity.toString(), 280, y, { width: 90, align: "right" })
                    .text(`Rs ${item.price.toFixed(2)}`, 370, y, { width: 90, align: "right" })
                    .text(`Rs ${itemTotal.toFixed(2)}`, 460, y, { width: 90, align: "right" });
                y += 20;
            });

            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 15;

            // --- Totals ---
            doc.font("Helvetica-Bold");
            if (order.subtotal) {
                doc.text("Subtotal:", 370, y, { width: 90, align: "right" })
                    .text(`Rs ${order.subtotal.toFixed(2)}`, 460, y, { width: 90, align: "right" });
                y += 20;
            }

            if (order.taxAmount) {
                doc.text("Tax:", 370, y, { width: 90, align: "right" })
                    .text(`Rs ${order.taxAmount.toFixed(2)}`, 460, y, { width: 90, align: "right" });
                y += 20;
            }

            if (order.deliveryFee) {
                doc.text("Delivery:", 370, y, { width: 90, align: "right" })
                    .text(`Rs ${order.deliveryFee.toFixed(2)}`, 460, y, { width: 90, align: "right" });
                y += 20;
            }

            doc.fontSize(14)
                .fillColor("#ff6b35")
                .text("Total Amount:", 350, y + 10, { width: 110, align: "right" })
                .text(`Rs ${order.amount.toFixed(2)}`, 460, y + 10, { width: 90, align: "right" });

            // --- Footer ---
            doc
                .fontSize(10)
                .fillColor("#636e72")
                .text("Thank you for your business!", 50, 700, { align: "center", width: 500 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
