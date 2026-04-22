import React, { useContext, useCallback, memo } from "react";
import "./FoodItem.css"; // kept as fallback — not deleted
import { assets } from "../../assets/frontend_assets/assets/";
import { StoreContext } from "../../context/StoreContext";
import { useTheme } from "../../context/ThemeContext";
import { FiPlus, FiMinus, FiShoppingCart } from "react-icons/fi";
import { FaFire } from "react-icons/fa";

// ── FoodItem — React.memo prevents re-renders unless its own props change ─────
// This is critical for grid smoothness during category filter transitions.
const FoodItem = memo(({ id, name, price, description, image, calorie, isAvailable }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const { theme } = useTheme();
  const dark = theme === "dark";

  // useCallback ensures these handlers are stable references across renders
  const handleAdd    = useCallback(() => addToCart(id), [id, addToCart]);
  const handleRemove = useCallback(() => removeFromCart(id), [id, removeFromCart]);

  const qty = cartItems?.[id] || 0;
  const inCart = qty > 0;
  // InsForge storage returns a full URL (https://...) — use it directly.
  // Legacy items that only store a filename fall back to the old local path.
  const imgSrc = image;

  return (
    <div className={[
      "group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300",
      "hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
      isAvailable === false ? "opacity-60 pointer-events-none" : "",
      dark
        ? "bg-brand-card border-brand-border"
        : "bg-white border-brand-lightBorder shadow-card-light",
    ].join(" ")}>

      {/* ── Image Container ── */}
      <div className="relative overflow-hidden aspect-[16/10]">
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient overlay for readability on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Sold Out Badge */}
        {isAvailable === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="px-4 py-2 rounded-full bg-red-500/90 text-white text-xs font-bold tracking-widest uppercase">
              Sold Out
            </span>
          </div>
        )}

        {/* Cart Controls — float on image bottom */}
        {isAvailable !== false && (
          <div className="absolute bottom-3 right-3">
            {!inCart ? (
              <button
                onClick={handleAdd}
                aria-label={`Add ${name} to cart`}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 active:scale-90 hover:scale-110"
                style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}
              >
                <FiPlus className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full shadow-lg"
                style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}>
                <button
                  onClick={handleRemove}
                  aria-label="Remove one"
                  className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-white transition-colors active:scale-90"
                >
                  <FiMinus className="w-3 h-3" />
                </button>
                <span className="text-white font-bold text-sm min-w-[16px] text-center tabular-nums">
                  {qty}
                </span>
                <button
                  onClick={handleAdd}
                  aria-label="Add one more"
                  className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center text-white transition-colors active:scale-90"
                >
                  <FiPlus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* In-cart badge on image top */}
        {inCart && (
          <div className="absolute top-2.5 left-2.5">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-accent text-white text-[10px] font-bold">
              <FiShoppingCart className="w-2.5 h-2.5" />
              {qty} in cart
            </span>
          </div>
        )}
      </div>

      {/* ── Info Panel ── */}
      <div className="flex flex-col flex-1 p-5 gap-2.5">
        {/* Name + Rating row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-bold text-[20px] leading-tight ${dark ? "text-white" : "text-slate-800"}`}>
            {name}
          </h3>
          <img src={assets.rating_starts} alt="rating" className="w-[72px] shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        <p className={`text-sm leading-relaxed line-clamp-2 ${dark ? "text-brand-muted" : "text-slate-500"}`}>
          {description}
        </p>

        {/* Calorie badge */}
        <div className="flex items-center gap-1 w-fit">
          <FaFire className="text-orange-400 w-3 h-3" />
          <span className={`text-xs font-semibold ${dark ? "text-orange-400" : "text-orange-500"}`}>
            {calorie} Cal
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
          <span className="text-brand-accent font-extrabold text-lg">₹{price}</span>
          {inCart && (
            <span className={`text-[10px] font-medium ${dark ? "text-brand-muted" : "text-slate-400"}`}>
              Subtotal ₹{price * qty}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

FoodItem.displayName = "FoodItem";

export default FoodItem;
