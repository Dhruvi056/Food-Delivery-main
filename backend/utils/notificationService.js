import nodemailer from "nodemailer";

// ==================== EMAIL NOTIFICATIONS ====================

const createTransporter = () => {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return null;
};

const sendEmail = async (to, subject, html, attachments = []) => {
    const transporter = createTransporter();
    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"BiteBlitz" <noreply@biteblitz.com>',
                to,
                subject,
                html,
                attachments,
            });
            console.log(`✉️  Email sent to ${to}: ${subject}`);
            return true;
        } catch (error) {
            console.error("Email failed:", error.message);
        }
    }
    // Dev fallback
    console.log(`\n📧 [EMAIL] To: ${to} | Subject: ${subject} | Attachments: ${attachments.length > 0 ? 'Yes' : 'No'}`);
    return true;
};

// Order confirmation email
export const sendOrderConfirmation = async (email, order, invoiceBuffer = null) => {
    const itemsList = order.items
        .map((item) => `<li>${item.name} × ${item.quantity} — ₹${item.price * item.quantity}</li>`)
        .join("");

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 30px; background: linear-gradient(135deg, #fff5f0 0%, #ffe8de 100%); border-radius: 16px;">
      <h1 style="color: #1a1a2e; font-size: 22px;">✅ Order Confirmed!</h1>
      <p style="color: #636e72; font-size: 14px;">Your order has been placed and payment received.</p>
      <div style="background: white; padding: 20px; border-radius: 12px; margin: 16px 0;">
        <p style="font-weight: 600; color: #1a1a2e; margin-bottom: 8px;">Order Items:</p>
        <ul style="color: #636e72; font-size: 14px; line-height: 1.8;">${itemsList}</ul>
        <hr style="border: none; border-top: 1px solid #eee; margin: 12px 0;">
        <p style="font-weight: 700; color: #ff6b35; font-size: 18px;">Total: ₹${order.amount}</p>
      </div>
      <p style="color: #636e72; font-size: 12px;">We'll notify you when your food is on its way! 🛵</p>
    </div>
  `;

    const attachments = [];
    if (invoiceBuffer) {
        attachments.push({
            filename: `Invoice_${order.invoiceNumber || order._id}.pdf`,
            content: invoiceBuffer,
            contentType: 'application/pdf'
        });
    }

    await sendEmail(email, "✅ BiteBlitz Order Confirmed!", html, attachments);
};

// Status update email
export const sendStatusUpdateEmail = async (email, order, newStatus) => {
    const statusEmoji = {
        "Food Processing": "👨‍🍳",
        "Out for delivery": "🛵",
        "Delivered": "🎉",
    };

    const statusMessage = {
        "Food Processing": "Your food is being prepared by our kitchen!",
        "Out for delivery": "Your order is on its way to you!",
        "Delivered": "Your order has been delivered. Enjoy your meal!",
    };

    const emoji = statusEmoji[newStatus] || "📦";
    const message = statusMessage[newStatus] || `Status updated to: ${newStatus}`;

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 30px; background: linear-gradient(135deg, #fff5f0 0%, #ffe8de 100%); border-radius: 16px;">
      <h1 style="color: #1a1a2e; font-size: 22px;">${emoji} Order Update</h1>
      <div style="background: linear-gradient(135deg, #ff6b35, #e94560); color: white; padding: 16px 24px; border-radius: 12px; margin: 16px 0; text-align: center;">
        <p style="font-size: 20px; font-weight: 700; margin: 0;">${newStatus}</p>
      </div>
      <p style="color: #636e72; font-size: 14px; line-height: 1.6;">${message}</p>
      <p style="color: #636e72; font-size: 12px; margin-top: 16px;">Order Total: ₹${order.amount}</p>
    </div>
  `;

    await sendEmail(email, `${emoji} BiteBlitz: ${newStatus}`, html);
};

// ==================== SMS NOTIFICATIONS (TWILIO) ====================

const sendSMS = async (phone, message) => {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
            const twilio = (await import("twilio")).default;
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
            });
            console.log(`📱 SMS sent to ${phone}`);
            return true;
        } catch (error) {
            console.error("SMS failed:", error.message);
        }
    }
    // Dev fallback
    console.log(`📱 [SMS] To: ${phone} | Message: ${message}`);
    return true;
};

// Order confirmation SMS
export const sendOrderConfirmationSMS = async (phone, order) => {
    const message = `✅ BiteBlitz: Order confirmed! Total: ₹${order.amount}. We'll update you when it's ready!`;
    await sendSMS(phone, message);
};

// Status update SMS
export const sendStatusUpdateSMS = async (phone, newStatus) => {
    const messages = {
        "Food Processing": "👨‍🍳 BiteBlitz: Your food is being prepared!",
        "Out for delivery": "🛵 BiteBlitz: Your order is out for delivery!",
        "Delivered": "🎉 BiteBlitz: Your order has been delivered! Enjoy!",
    };
    const message = messages[newStatus] || `📦 BiteBlitz: Order status: ${newStatus}`;
    await sendSMS(phone, message);
};
