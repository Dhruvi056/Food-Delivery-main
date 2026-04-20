import React, { useContext } from "react";
import "./Navbar.css"; // kept as fallback
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiLogIn, FiGrid } from "react-icons/fi";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, admin, setAdmin, setToken } = useContext(StoreContext);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setToken("");
    setAdmin(false);
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 bg-brand-card border-b border-brand-border backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center">
          <FiGrid className="text-brand-accent w-4 h-4" />
        </div>
        <img src={assets.logo} alt="BiteBlitz" className="h-7 w-auto" />
        <span className="hidden sm:block text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/25 ml-1">
          Admin
        </span>
      </div>

      {/* Auth action */}
      {token && admin ? (
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 active:scale-95"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="hidden sm:block">Logout</span>
        </button>
      ) : (
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-brand-accent border border-brand-accent/25 bg-brand-accent/10 hover:bg-brand-accent/20 transition-all duration-200"
        >
          <FiLogIn className="w-4 h-4" />
          Login
        </button>
      )}
    </header>
  );
};

export default Navbar;
