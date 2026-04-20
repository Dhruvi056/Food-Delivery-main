// import axios from "axios";
// import { createContext, useEffect, useState } from "react";
// import { toast } from "react-toastify";

// export const StoreContext = createContext(null);

// const StoreContextProvider = (props) => {
//   const [cartItems, setCartItems] = useState({});
//   const url = "http://localhost:4000";
//   const [token, setToken] = useState("");


//   const [food_list, setFoodList] = useState([]);

//   const addToCart = async (itemId) => {
//     if (!cartItems || !cartItems[itemId]) {
//       setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
//     } else {
//       setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
//     }

//     if (token) {
//       const response=await axios.post(
//         url + "/api/cart/add",
//         { itemId },
//         { headers: { token } }
//       );

//       if(response.data.success){
//         toast.success("item Added to Cart")
//       }else{
//         toast.error("Something went wrong")
//       }
//     }
//   };

//   const removeFromCart = async (itemId) => {
//     setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
//     if (token) {
//       const response= await axios.post(
//         url + "/api/cart/remove",
//         { itemId },
//         { headers: { token } }
//       );
//       if(response.data.success){
//         toast.success("item Removed from Cart")
//       }else{
//         toast.error("Something went wrong")
//       }
//     }
//   };

//   // const getTotalCartAmount = () => {
//   //   let totalAmount = 0;
//   //   for (const item in cartItems) {
//   //     if (cartItems[item] > 0) {
//   //       let itemInfo = food_list.find((product) => product._id === item);
//   //       totalAmount += itemInfo.price * cartItems[item];
//   //     }
//   //   }
//   //   return totalAmount;
//   // };
//   const getTotalCartAmount = () => {
//     let totalAmount = 0;
//     for (const item in cartItems) {
//       if (cartItems[item] > 0) {
//         let itemInfo = food_list.find((product) => product._id === item);
//         if (itemInfo) {
//           totalAmount += itemInfo.price * cartItems[item];
//         }
//       }
//     }
//     return totalAmount;
//   };

//   const getTotalCalories = () => {
//     let totalCalories = 0;
//     for (const item in cartItems) {
//       if (cartItems[item] > 0) {
//         let itemInfo = food_list.find((product) => product._id === item);
//         if (itemInfo) {
//           totalCalories += itemInfo.calorie * cartItems[item];
//           console.log( totalCalories," totalCalories...");

//         }
//       }
//     }
//     return totalCalories;
//   };


//   const fetchFoodList = async () => {
//     const response = await axios.get(url + "/api/food/list");
//     if (response.data.success) {
//       setFoodList(response.data.data);
//     } else {
//       alert("Error! Products are not fetching..");
//     }
//   };

//   // const loadCardData = async (token) => {
//   //   const response = await axios.post(
//   //     url + "/api/cart/get",
//   //     {},
//   //     { headers: { token } }
//   //   );
//   //   setCartItems(response.data.cartData);
//   // };
//   const loadCardData = async (token) => {
//     const response = await axios.post(
//       url + "/api/cart/get",
//       {},
//       { headers: { token } }
//     );
//     if (response.data && response.data.cartData && typeof response.data.cartData === 'object') {
//       setCartItems(response.data.cartData);
//     } else {
//       setCartItems({});
//     }
//   };


//   useEffect(() => {
//     async function loadData() {
//       await fetchFoodList();
//       if (localStorage.getItem("token")) {
//         setToken(localStorage.getItem("token"));
//         await loadCardData(localStorage.getItem("token"));
//       }
//     }
//     loadData();
//   }, []);

//   const contextValue = {
//     food_list,
//     cartItems,
//     setCartItems,
//     addToCart,
//     removeFromCart,
//     getTotalCartAmount,
//     getTotalCalories,
//     fetchFoodList,
//     url,
//     token,
//     setToken,
//   };
//   return (
//     <StoreContext.Provider value={contextValue}>
//       {props.children}
//     </StoreContext.Provider>
//   );
// };
// export default StoreContextProvider;






import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Track user search queries
  // Promo state
  const [promoData, setPromoData] = useState({ code: "", discountType: "", discountValue: 0 });
  // New state for tracking calorie history
  const [calorieHistory, setCalorieHistory] = useState({});

  // Auto-refresh expired access token using refresh token
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const response = await axios.post(url + "/api/user/refresh-token", {
        refreshToken,
      });
      if (response.data.success) {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem("token", newToken);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        return newToken;
      } else {
        // Refresh token invalid — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken("");
        return null;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      return null;
    }
  };

  const addToCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    // Use a fixed toastId so rapid clicks update the same toast instead of stacking
    if (toast.isActive("cart-add")) {
      toast.update("cart-add", { render: "Item Added to Cart ✓", autoClose: 1800 });
    } else {
      toast.success("Item Added to Cart", { toastId: "cart-add", autoClose: 1800 });
    }
    updateCalorieHistory();

    if (token) {
      try {
        let response = await axios.post(
          url + "/api/cart/add",
          { itemId },
          { headers: { token } }
        );
        if (response.data?.expired) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            response = await axios.post(
              url + "/api/cart/add",
              { itemId },
              { headers: { token: newToken } }
            );
          }
        }
        if (response.data && !response.data.success && !response.data.expired) {
          toast.error(response.data.message || "Error syncing cart");
        }
      } catch (error) {
        console.error("Error syncing cart to backend:", error);
      }
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      try {
        let response = await axios.post(
          url + "/api/cart/remove",
          { itemId },
          { headers: { token } }
        );

        if (response.data?.expired) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            response = await axios.post(
              url + "/api/cart/remove",
              { itemId },
              { headers: { token: newToken } }
            );
          }
        }

        if (response.data.success) {
          toast.success("Item Removed from Cart", { toastId: "cart-remove", autoClose: 1500 });
          updateCalorieHistory();
        } else {
          toast.error(response.data.message || "Something went wrong");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Network Error");
      }
    }
  };

  const replaceCart = async (newCartItems) => {
    setCartItems(newCartItems);
    toast.success("Cart completely restored!");
    updateCalorieHistory();

    if (token) {
      try {
        let response = await axios.post(
          url + "/api/cart/set",
          { cartItems: newCartItems },
          { headers: { token } }
        );

        if (response.data?.expired) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            response = await axios.post(
              url + "/api/cart/set",
              { cartItems: newCartItems },
              { headers: { token: newToken } }
            );
          }
        }

        if (response.data && !response.data.success && !response.data.expired) {
          toast.error(response.data.message || "Error syncing historical cart");
        }
      } catch (error) {
        console.error("Error syncing cart to backend:", error);
      }
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const getTotalCalories = () => {
    let totalCalories = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalCalories += itemInfo.calorie * cartItems[item];
        }
      }
    }
    return totalCalories;
  };

  // Function to update the calorie history with current date
  const updateCalorieHistory = () => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const dailyCalories = getTotalCalories();

    setCalorieHistory(prev => {
      return {
        ...prev,
        [today]: dailyCalories
      };
    });

    // Save to localStorage for persistence between sessions
    if (token) {
      localStorage.setItem(`calorieHistory-${token}`, JSON.stringify({
        ...calorieHistory,
        [today]: dailyCalories
      }));
    }
  };

  // Function to get monthly calorie data
  const getMonthlyCalorieData = () => {
    const monthData = {};

    // Group calorie data by month
    for (const dateStr in calorieHistory) {
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthData[monthKey]) {
        monthData[monthKey] = {
          totalCalories: 0,
          daysTracked: 0,
          dailyData: {}
        };
      }

      monthData[monthKey].totalCalories += calorieHistory[dateStr];
      monthData[monthKey].daysTracked += 1;
      monthData[monthKey].dailyData[dateStr] = calorieHistory[dateStr];
    }

    return monthData;
  };

  // Function to get current month's calorie data
  const getCurrentMonthCalories = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthKey = `${currentYear}-${currentMonth}`;

    const monthlyData = getMonthlyCalorieData();
    return monthlyData[monthKey] || { totalCalories: 0, daysTracked: 0, dailyData: {} };
  };

  const [isFoodLoaded, setIsFoodLoaded] = useState(false);

  const fetchFoodList = async () => {
    if (isFoodLoaded) return; // Prevent double fetching
    const response = await axios.get(url + "/api/food/list");
    if (response.data.success) {
      setFoodList(response.data.data);
      setIsFoodLoaded(true);
    } else {
      alert("Error! Products are not fetching..");
    }
  };

  const loadCardData = async (token) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        { headers: { token } }
      );
      if (response.data && response.data.cartData && Object.keys(response.data.cartData).length > 0) {
        setCartItems(response.data.cartData);
      }

      // Load calorie history from localStorage
      const savedHistory = localStorage.getItem(`calorieHistory-${token}`);
      if (savedHistory) {
        setCalorieHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.log("Error loading cart data:", error);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
        if (localStorage.getItem("userName")) {
          setUserName(localStorage.getItem("userName"));
        }
        if (localStorage.getItem("userEmail")) {
          setUserEmail(localStorage.getItem("userEmail"));
        }
        await loadCardData(localStorage.getItem("token"));
      }
    }
    loadData();
  }, []);

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
    calorieHistory,
    getMonthlyCalorieData,
    getCurrentMonthCalories,
    updateCalorieHistory,
    refreshAccessToken,
    searchTerm,
    setSearchTerm,
    promoData,
    setPromoData,
    replaceCart
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;