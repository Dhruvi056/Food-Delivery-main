import React, { useContext, useMemo } from "react";
import "./FoodDisplay.css"; // kept as fallback — not deleted
import { StoreContext } from "../../context/StoreContext";
import { useTheme } from "../../context/ThemeContext";
import FoodItem from "../FoodItem/FoodItem";

// ── Skeleton Loader Card ───────────────────────────────────────────────────────
const SkeletonCard = ({ dark }) => (
  <div className={`rounded-2xl overflow-hidden border animate-pulse ${dark ? "bg-brand-card border-brand-border" : "bg-white border-brand-lightBorder"}`}>
    <div className={`aspect-[4/3] ${dark ? "bg-brand-border" : "bg-slate-200"}`} />
    <div className="p-4 space-y-3">
      <div className={`h-4 rounded ${dark ? "bg-brand-border" : "bg-slate-200"} w-3/4`} />
      <div className={`h-3 rounded ${dark ? "bg-brand-border" : "bg-slate-200"}`} />
      <div className={`h-3 rounded ${dark ? "bg-brand-border" : "bg-slate-200"} w-2/3`} />
      <div className={`h-5 rounded ${dark ? "bg-brand-border" : "bg-slate-200"} w-1/3 mt-2`} />
    </div>
  </div>
);

// ── FoodDisplay — useMemo filters list only when deps change ──────────────────
const FoodDisplay = ({ category }) => {
  const { food_list, searchTerm } = useContext(StoreContext);
  const { theme } = useTheme();
  const dark = theme === "dark";

  const getCategoryDescription = (cat) => {
    switch (cat) {
      case "Salad":
      case "Salads":
        return "Fresh, crisp greens tossed with seasonal vegetables and a light zesty dressing.";
      case "Sandwich":
      case "Sandwiches":
        return "Toasted artisanal bread layered with premium fillings and signature house sauces.";
      case "Deserts":
      case "Desert":
        return "Indulgent, handcrafted sweets perfect for satisfying your sugar cravings.";
      case "Pasta":
        return "Al dente pasta served with rich, slow-simmered sauces and Italian herbs.";
      case "Rolls":
        return "Golden, flaky wraps filled with savory spiced ingredients and fresh veggies.";
      case "Cake":
        return "Decadent, oven-fresh cakes baked to perfection with rich cream frostings.";
      case "Pure Veg":
        return "Wholesome, farm-fresh vegetarian delights bursting with authentic natural flavors.";
      case "Noodles":
        return "Wok-tossed noodles perfectly seasoned with our signature umami sauces.";
      default:
        return "A delicious signature dish crafted with the finest ingredients by our chefs.";
    }
  };

  // useMemo: recalculates only when food_list, category, or searchTerm change
  const filteredItems = useMemo(() => {
    if (!food_list?.length) return [];
    return food_list.filter(item => {
      const matchesCategory = category === "All" || category === item.category;
      const matchesSearch   = item.name.toLowerCase().includes((searchTerm || "").toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [food_list, category, searchTerm]);

  const isLoading = food_list.length === 0;

  return (
    <section className={`py-10 transition-colors duration-300 ${dark ? "bg-brand-dark" : "bg-slate-50"}`} id="food-display">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-extrabold tracking-tight ${dark ? "text-white" : "text-slate-800"}`}>
            Top Dishes Near You
          </h2>
          {!isLoading && (
            <p className={`text-sm mt-1 ${dark ? "text-brand-muted" : "text-slate-500"}`}>
              {filteredItems.length} {filteredItems.length === 1 ? "dish" : "dishes"} found
              {category !== "All" && <span className="ml-1">in <span className="text-brand-accent font-semibold">{category}</span></span>}
            </p>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} dark={dark} />)
          : filteredItems.length === 0
            ? (
              <div className={`col-span-full flex flex-col items-center justify-center py-20 rounded-2xl border ${dark ? "bg-brand-card border-brand-border" : "bg-white border-brand-lightBorder"}`}>
                <span className="text-4xl mb-4">🍽️</span>
                <p className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-700"}`}>No dishes found</p>
                <p className={`text-sm mt-1 ${dark ? "text-brand-muted" : "text-slate-400"}`}>
                  {searchTerm ? `No results for "${searchTerm}"` : `No items in ${category}`}
                </p>
              </div>
            )
            : filteredItems.map(item => (
              <FoodItem
                key={item._id}
                id={item._id}
                name={item.name}
                description={getCategoryDescription(item.category)}
                price={item.price}
                calorie={item.calorie}
                image={item.image}
                isAvailable={item.isAvailable}
              />
            ))
        }
      </div>
    </section>
  );
};

export default FoodDisplay;
