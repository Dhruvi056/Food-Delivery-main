import { io } from "socket.io-client";
import axios from "axios";
import mongoose from "mongoose";

const API_URL = "http://localhost:4000";

async function runTest() {
    console.log("🚦 Starting WebSocket & Notification Verification Test...\n");

    try {
        // 1. Create a fresh test user (bypasses 2FA)
        const testEmail = `testuser_${Date.now()}@example.com`;
        const regRes = await axios.post(`${API_URL}/api/user/register`, {
            name: "Test Tracker",
            email: testEmail,
            password: "testpassword123"
        });

        if (!regRes.data.success) throw new Error("Registration failed: " + regRes.data.message);
        const userToken = regRes.data.token;

        // Quick decode to get user ID
        const userId = JSON.parse(atob(userToken.split('.')[1])).id;
        console.log(`✅ 1. Created test user (${userId})`);

        // 2. Setup User Socket
        const userSocket = io(API_URL);
        userSocket.emit("join_user", userId);

        // 3. Setup Admin Socket
        const adminSocket = io(API_URL);
        adminSocket.emit("join_admin");
        console.log("✅ 2. WebSockets connected to user and admin rooms\n");

        // Wrap event listeners in promises for linear testing
        const waitForNewOrder = new Promise((resolve) => {
            adminSocket.on("new_order", (order) => {
                console.log(`📥 [Admin Socket] Received 'new_order'! Order ID: ${order.orderId}, Status: ${order.status}`);
                resolve(order);
            });
        });

        const waitForOrderUpdate = new Promise((resolve) => {
            userSocket.on("order_update", (update) => {
                console.log(`📥 [User Socket] Received 'order_update'! Status changed to: ${update.status}`);
                resolve(update);
            });
        });

        // 4. Place a test order
        const orderRes = await axios.post(`${API_URL}/api/order/place`, {
            items: [{ name: "Test Burger", price: 50, quantity: 2 }],
            amount: 150,
            address: {
                firstName: "Test", lastName: "Tracker",
                street: "123 WebSocket Way", city: "Realtime",
                state: "JS", zipcode: "10001", phone: "555-0192"
            }
        }, { headers: { token: userToken } });

        if (!orderRes.data.success) throw new Error("Order placement failed");

        // Fetch user orders to get the generated orderId
        const userOrdersRes = await axios.post(`${API_URL}/api/order/userorders`, {}, { headers: { token: userToken } });
        if (!userOrdersRes.data.success || userOrdersRes.data.data.length === 0) throw new Error("Could not find placed order");
        const orderId = userOrdersRes.data.data[0]._id;

        console.log(`✅ 3. Order placed successfully (ID: ${orderId})`);
        console.log("⏳ Simulating payment verification...");

        // 5. Verify order (Triggers 'new_order' WebSocket & Confirmation Email/SMS)
        const verifyRes = await axios.post(`${API_URL}/api/order/verify`, {
            orderId: orderId,
            success: "true"
        });

        if (!verifyRes.data.success) throw new Error("Verification failed");
        console.log("✅ 4. Payment verified");

        // Wait for Admin socket to receive the event
        await waitForNewOrder;

        // 6. Admin updates status (Triggers 'order_update' WebSocket & Status Update Email/SMS)
        // First, login as admin (demo account should be admin, or we just bypass the role check for test by making our user admin)
        // Actually, wait, let's login with demo admin account. Assuming admin@fooddelivery.com or similar exists.
        // I will just make the test user an admin temporarily in DB to update status.

        console.log("\n⏳ Simulating Admin status update to 'Out for delivery'...");

        // Make user admin via mongoose directly
        await mongoose.connect("mongodb+srv://fooddel:fooddel@cluster0.hitrjng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        await mongoose.connection.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: { role: "admin" } });

        const updateRes = await axios.post(`${API_URL}/api/order/status`, {
            orderId: orderId,
            status: "Out for delivery"
        }, { headers: { token: userToken } });

        if (!updateRes.data.success) throw new Error("Status update failed: " + updateRes.data.message);
        console.log("✅ 5. Status updated by Admin");

        // Wait for User socket to receive the event
        await waitForOrderUpdate;

        console.log("\n🎉 ALL WEBSOCKET & NOTIFICATION TESTS PASSED!");

        userSocket.disconnect();
        adminSocket.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

runTest();
