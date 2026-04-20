import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [admin, setAdmin] = useState(localStorage.getItem("admin") === "true");

  useEffect(() => {
    // If you ever need to load async data on mount, place it here.
  }, []);

  const contextValue = {
    token,
    setToken,
    admin,
    setAdmin,
  };
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;  
