import React, { useCallback, memo } from "react";
import "./ExploreMenu.css"; // kept as fallback — not deleted
import { menu_list } from "../../assets/frontend_assets/assets";
import { useTheme } from "../../context/ThemeContext";

// ── CategoryPill — memo'd to prevent re-renders when only category state changes
const CategoryPill = memo(({ item, isActive, onClick }) => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-center gap-2 shrink-0 group transition-all duration-250 outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
      ].join(" ")}
      aria-pressed={isActive}
      aria-label={`Filter by ${item.menu_name}`}
    >
      {/* Icon circle */}
      <div className={[
        "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-all duration-300",
        "group-hover:scale-105",
        isActive
          ? "border-brand-accent shadow-glow-accent scale-105"
          : dark
            ? "border-brand-border group-hover:border-brand-accent/50"
            : "border-brand-lightBorder group-hover:border-brand-accent/50",
      ].join(" ")}>
        <img
          src={item.menu_image}
          alt={item.menu_name}
          className={[
            "w-full h-full object-cover transition-all duration-300",
            isActive ? "brightness-110 saturate-125" : "group-hover:brightness-105",
          ].join(" ")}
        />
      </div>

      {/* Label */}
      <span className={[
        "text-xs sm:text-sm font-semibold transition-colors duration-200",
        isActive
          ? "text-brand-accent"
          : dark
            ? "text-slate-400 group-hover:text-slate-200"
            : "text-slate-500 group-hover:text-slate-700",
      ].join(" ")}>
        {item.menu_name}
      </span>

      {/* Active underline dot */}
      <span className={[
        "w-1.5 h-1.5 rounded-full transition-all duration-300",
        isActive ? "bg-brand-accent scale-100" : "bg-transparent scale-0",
      ].join(" ")} />
    </button>
  );
});

CategoryPill.displayName = "CategoryPill";

// ── ExploreMenu ────────────────────────────────────────────────────────────────
const ExploreMenu = ({ category, setCategory }) => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  // useCallback — stable reference so CategoryPill's memo is actually effective
  const handleClick = useCallback(
    (menuName) => setCategory(prev => (prev === menuName ? "All" : menuName)),
    [setCategory]
  );

  return (
    <section
      id="explore-menu"
      className={[
        "py-10 transition-colors duration-300",
        dark ? "bg-brand-dark" : "bg-slate-50",
      ].join(" ")}
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${dark ? "text-white" : "text-slate-800"}`}>
          Explore our menu
        </h2>
        <p className={`mt-2 text-sm sm:text-base max-w-xl leading-relaxed ${dark ? "text-brand-muted" : "text-slate-500"}`}>
          Choose from a diverse menu featuring a delectable array of dishes crafted to satisfy
          your cravings and elevate your dining experience.
        </p>
      </div>

      {/* ── Category Pills Scroll Strip ── */}
      <div className="flex gap-5 sm:gap-8 overflow-x-auto pb-4 scrollbar-hide">
        {/* "All" pill */}
        <button
          onClick={() => setCategory("All")}
          className={[
            "flex flex-col items-center gap-2 shrink-0 group transition-all duration-250",
          ].join(" ")}
          aria-pressed={category === "All"}
        >
          <div className={[
            "w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            "group-hover:scale-105",
            category === "All"
              ? "border-brand-accent bg-brand-accent/20 shadow-glow-accent scale-105"
              : dark
                ? "border-brand-border bg-white/5 group-hover:border-brand-accent/50"
                : "border-brand-lightBorder bg-slate-100 group-hover:border-brand-accent/50",
          ].join(" ")}>
            <span className={`text-xl font-black ${category === "All" ? "text-brand-accent" : dark ? "text-slate-400" : "text-slate-500"}`}>
              All
            </span>
          </div>
          <span className={`text-xs sm:text-sm font-semibold transition-colors duration-200 ${category === "All" ? "text-brand-accent" : dark ? "text-slate-400" : "text-slate-500"}`}>
            All
          </span>
          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${category === "All" ? "bg-brand-accent" : "bg-transparent"}`} />
        </button>

        {menu_list.map((item) => (
          <CategoryPill
            key={item.menu_name}
            item={item}
            isActive={category === item.menu_name}
            onClick={() => handleClick(item.menu_name)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className={`mt-6 h-px ${dark ? "bg-brand-border" : "bg-brand-lightBorder"}`} />
    </section>
  );
};

export default ExploreMenu;
