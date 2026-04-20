import { createContext, useContext, useEffect, useState } from "react";

export const ThemeContext = createContext(null);

/**
 * Provides `theme` ("dark" | "light") and `toggleTheme` to the whole app.
 * Applies the `dark` class to <html> so Tailwind dark: variants work globally.
 * Persists the preference in localStorage.
 */
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("bb-theme") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.backgroundColor = "#0f0f0f";
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#f8fafc";
      root.style.colorScheme = "light";
    }
    localStorage.setItem("bb-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Convenience hook
export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
