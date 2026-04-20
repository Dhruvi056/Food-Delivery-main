import React from "react";
import "./Sidebar.css"; // kept as fallback
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";
import { FiPlusSquare, FiList, FiShoppingBag } from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/add",    label: "Add Items",  icon: FiPlusSquare  },
  { to: "/list",   label: "List Items", icon: FiList        },
  { to: "/orders", label: "Orders",     icon: FiShoppingBag },
];

const Sidebar = () => {
  return (
    <aside className="w-16 sm:w-56 shrink-0 min-h-[calc(100vh-3.5rem)] bg-brand-sidebar border-r border-brand-border flex flex-col pt-4 gap-1 transition-all duration-300">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => [
            "flex items-center gap-3 px-3 sm:px-4 py-3 mx-2 rounded-xl text-sm font-medium",
            "transition-all duration-200 group",
            isActive
              ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25 shadow-glow-accent"
              : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent",
          ].join(" ")}
        >
          {({ isActive }) => (
            <>
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-accent" : "text-slate-500 group-hover:text-slate-200"}`} />
              <span className="hidden sm:block truncate">{label}</span>
              {isActive && (
                <span className="hidden sm:block ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;
