import api from "../config/axios.js";
import { createContext, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { connectSocket, disconnectSocket } from "../config/socket.js";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [food_list, setFoodList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [promoData, setPromoData] = useState({ code: "", discountType: "", discountValue: 0 });
  const [calorieHistory, setCalorieHistory] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Notification Logic ────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get("/api/notifications");
      if (response.data.success) {
        setNotifications(response.data.data);
        const unread = response.data.data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [token]);

  const markAllRead = async () => {
    if (!token) return;
    try {
      const response = await api.post("/api/notifications/read-all");
      if (response.data.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // ── Socket Event Handlers ─────────────────────────────────────────────────────

  const setupSocketListeners = useCallback((socket) => {
    socket.on('order_status_update', (data) => {
      toast.info(`Order Status: ${data.status}`, { theme: "dark" });
      fetchNotifications();
    });

    socket.on('payment_confirmed', (data) => {
      toast.success("Payment Confirmed! Tracking your order...", { theme: "dark" });
      window.location.href = `/track/${data.orderId}`;
    });

    socket.on('order_completed', () => {
      // For riders
      fetchNotifications();
    });

    socket.on('new_notification', () => {
      fetchNotifications();
    });
  }, [fetchNotifications]);

  // ── Authentication Logic ──────────────────────────────────────────────────────

  useEffect(() => {
    if (token) {
      // Decode token for userId (or just assume server handles join_user on connect if we send token in auth)
      // For now, we'll try to extract userId if available or just use a generic join
      const userId = localStorage.getItem("userId"); 
      if (userId) {
        const socket = connectSocket(userId);
        setupSocketListeners(socket);
      }
    } else {
      disconnectSocket();
    }
  }, [token, setupSocketListeners]);

  // ── Food & Cart Logic ─────────────────────────────────────────────────────────

  const fetchFoodList = async () => {
    const response = await api.get("/api/food/list");
    if (response.data.success) {
      setFoodList(response.data.data);
    }
  };

  const loadCartData = async (token) => {
    try {
      const response = await api.get("/api/cart/get"); // Changed to GET as per standard
      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  const addToCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    toast.success("Added to cart", { toastId: "cart-add" });
    if (token) {
      await api.post("/api/cart/add", { itemId });
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) newCart[itemId]--;
      else delete newCart[itemId];
      return newCart;
    });
    if (token) {
      await api.post("/api/cart/remove", { itemId });
    }
  };

  const getTotalCartAmount = () => {
    return Object.keys(cartItems).reduce((total, itemId) => {
      const item = food_list.find(f => f._id === itemId);
      return total + (item ? item.price * cartItems[itemId] : 0);
    }, 0);
  };

  const getTotalCalories = () => {
    return Object.keys(cartItems).reduce((total, itemId) => {
      const item = food_list.find(f => f._id === itemId);
      return total + (item ? (item.calorie || 0) * cartItems[itemId] : 0);
    }, 0);
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      await fetchFoodList();
      if (token) {
        await loadCartData(token);
        await fetchNotifications();
      }
    }
    init();
  }, [token, fetchNotifications]);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCalories,
    fetchFoodList,
    url,
    token,
    setToken,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    notifications,
    unreadCount,
    fetchNotifications,
    markAllRead,
    searchTerm,
    setSearchTerm,
    promoData,
    setPromoData
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;