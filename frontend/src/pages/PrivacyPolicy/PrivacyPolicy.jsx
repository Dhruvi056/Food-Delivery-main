import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  return (
    <section className="privacy-policy-page">
      <div className="privacy-policy-card">
        <h1>Privacy Policy</h1>
        <p>
          BiteBlitz respects your privacy and protects your personal data while you use food ordering,
          checkout, and delivery tracking features.
        </p>

        <h2>1. What We Collect</h2>
        <p>
          We may collect name, email, phone number, delivery address, order history, and payment status
          details required to complete your orders.
        </p>

        <h2>2. How We Use Data</h2>
        <p>
          Your information is used to process orders, provide delivery updates, improve recommendations,
          and send important service notifications.
        </p>

        <h2>3. Data Security</h2>
        <p>
          We use authenticated APIs, token-based sessions, and protected backend services to prevent
          unauthorized access to your account data.
        </p>

        <h2>4. Sharing Policy</h2>
        <p>
          BiteBlitz does not sell your personal information. Data is shared only with trusted payment
          and delivery systems needed to fulfill your order.
        </p>

        <h2>5. Contact</h2>
        <p>
          For privacy-related requests, contact us at <strong>info@concatstring.com</strong>.
        </p>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
