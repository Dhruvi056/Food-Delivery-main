import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { useTheme } from "../../context/ThemeContext";
import { localDateKey } from "../../utils/dateKey";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";
import { FiActivity, FiCalendar, FiPieChart } from "react-icons/fi";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const DAILY_TARGET = 2000;

const Calorie = () => {
  const {
    cartItems,
    food_list,
    calorieHistory,
    getCurrentMonthCalories,
    recordTodayCartCalories,
    recordCaloriePageVisit,
  } = useContext(StoreContext);
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [calorieDetails, setCalorieDetails] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [activeTab, setActiveTab] = useState("daily");
  const monthlyCalorieTarget = DAILY_TARGET * 30;

  useEffect(() => {
    const details = [];
    let total = 0;
    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        const itemInfo = food_list.find((product) => product._id === itemId);
        if (itemInfo) {
          const itemCalories = (itemInfo.calorie || 0) * cartItems[itemId];
          details.push({
            name: itemInfo.name,
            quantity: cartItems[itemId],
            caloriePerUnit: itemInfo.calorie || 0,
            totalCalories: itemCalories,
          });
          total += itemCalories;
        }
      }
    }
    setCalorieDetails(details);
    setTotalCalories(total);
  }, [cartItems, food_list]);

  useEffect(() => {
    if (totalCalories > 0) {
      recordTodayCartCalories(totalCalories);
    }
  }, [totalCalories, recordTodayCartCalories]);

  useEffect(() => {
    recordCaloriePageVisit();
  }, [recordCaloriePageVisit]);

  const monthlyData = useMemo(() => {
    const currentMonthData = getCurrentMonthCalories();
    const dailyData = currentMonthData.dailyData || {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const labels = [];
    const calorieData = [];
    const targetLine = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      labels.push(String(day));
      calorieData.push(dailyData[dateStr] || 0);
      targetLine.push(DAILY_TARGET);
    }
    return {
      labels,
      calorieData,
      targetLine,
      totalMonthlyCalories: currentMonthData.totalCalories || 0,
      daysTracked: currentMonthData.daysTracked || 0,
      daysWithKcal: currentMonthData.daysWithKcal || 0,
    };
  }, [getCurrentMonthCalories, calorieHistory]);

  const chartTheme = useMemo(
    () => ({
      text: dark ? "#94a3b8" : "#64748b",
      textStrong: dark ? "#e2e8f0" : "#1e293b",
      grid: dark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.35)",
      cardBg: dark ? "rgba(255,255,255,0.04)" : "#ffffff",
    }),
    [dark]
  );

  const dailyCaloriePieData = useMemo(
    () => ({
      labels: ["Consumed", "Remaining"],
      datasets: [
        {
          data: [
            totalCalories,
            totalCalories > DAILY_TARGET ? 0 : DAILY_TARGET - totalCalories,
          ],
          backgroundColor: [
            "rgba(233, 69, 96, 0.85)",
            dark ? "rgba(148,163,184,0.2)" : "rgba(226, 232, 240, 0.95)",
          ],
          borderColor: [dark ? "#2a2a4a" : "#e2e8f0", dark ? "#2a2a4a" : "#e2e8f0"],
          borderWidth: 2,
        },
      ],
    }),
    [totalCalories, dark]
  );

  const monthlyCalorieLineData = useMemo(
    () => ({
      labels: monthlyData.labels,
      datasets: [
        {
          label: "Daily calories",
          data: monthlyData.calorieData,
          fill: true,
          backgroundColor: "rgba(233, 69, 96, 0.12)",
          borderColor: "rgba(233, 69, 96, 0.95)",
          tension: 0.25,
          pointRadius: 2,
          pointBackgroundColor: "#e94560",
        },
        {
          label: `Target (${DAILY_TARGET})`,
          data: monthlyData.targetLine,
          fill: false,
          borderColor: dark ? "rgba(148,163,184,0.45)" : "rgba(100,116,139,0.55)",
          borderDash: [6, 6],
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }),
    [monthlyData, dark]
  );

  const pieChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: chartTheme.textStrong,
            padding: 16,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.raw || 0;
              return `${ctx.label}: ${v} kcal`;
            },
          },
        },
      },
    }),
    [chartTheme.textStrong]
  );

  const lineChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: chartTheme.grid },
          ticks: { color: chartTheme.text },
          title: {
            display: true,
            text: "Calories",
            color: chartTheme.text,
          },
        },
        x: {
          grid: { color: chartTheme.grid },
          ticks: { color: chartTheme.text, maxRotation: 0 },
          title: {
            display: true,
            text: "Day of month",
            color: chartTheme.text,
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: { color: chartTheme.textStrong, boxWidth: 12 },
        },
        title: {
          display: true,
          text: "Monthly calorie tracking",
          color: chartTheme.textStrong,
          font: { size: 14, weight: "600" },
        },
      },
    }),
    [chartTheme]
  );

  const shell = dark ? "bg-brand-dark text-white min-h-[calc(100vh-8rem)]" : "bg-slate-50 text-slate-900 min-h-[calc(100vh-8rem)]";
  const card = dark
    ? "rounded-2xl border border-brand-border bg-brand-card shadow-card-dark"
    : "rounded-2xl border border-brand-lightBorder bg-white shadow-card-light";
  const inner = dark ? "rounded-xl bg-white/[0.04] border border-brand-border" : "rounded-xl bg-slate-50 border border-slate-100";
  const tabBase =
    "px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all duration-200";
  const tabInactive = dark
    ? "text-brand-muted border-transparent hover:text-white"
    : "text-slate-500 border-transparent hover:text-slate-800";
  const tabActive = "text-brand-accent border-brand-accent";

  const pctMonth = Math.min(100, (monthlyData.totalMonthlyCalories / monthlyCalorieTarget) * 100);
  const todaySavedKcal = Number(calorieHistory[localDateKey()]) || 0;
  const dailyAvgDenominator =
    monthlyData.daysWithKcal > 0
      ? monthlyData.daysWithKcal
      : monthlyData.totalMonthlyCalories > 0
        ? 1
        : 0;

  return (
    <div className={`${shell} pt-8 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center">
            <FiActivity className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calorie tracker</h1>
            <p className={`text-sm mt-0.5 ${dark ? "text-brand-muted" : "text-slate-500"}`}>
              Cart-based estimate · synced to this month&apos;s chart
            </p>
          </div>
        </div>

        <div className={`${card} p-5 sm:p-6`}>
          <div className="flex items-center gap-2 border-b border-brand-border/60 dark:border-brand-border pb-1 mb-6">
            <button
              type="button"
              className={`${tabBase} flex items-center gap-2 ${activeTab === "daily" ? tabActive : tabInactive}`}
              onClick={() => setActiveTab("daily")}
            >
              <FiPieChart className="w-4 h-4" />
              Daily view
            </button>
            <button
              type="button"
              className={`${tabBase} flex items-center gap-2 ${activeTab === "monthly" ? tabActive : tabInactive}`}
              onClick={() => setActiveTab("monthly")}
            >
              <FiCalendar className="w-4 h-4" />
              Monthly view
            </button>
          </div>

          {activeTab === "daily" ? (
            Object.keys(cartItems).some((id) => cartItems[id] > 0) && calorieDetails.length === 0 ? (
              <div
                className={`rounded-xl border p-5 text-sm ${dark ? "border-amber-500/30 bg-amber-500/10 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900"}`}
              >
                Your cart has items, but calorie info isn&apos;t available for them yet (or the menu is still loading). Open{" "}
                <Link to="/" className="underline font-semibold">
                  Home
                </Link>{" "}
                and try again in a moment.
              </div>
            ) : calorieDetails.length > 0 ? (
              <div className="flex flex-col gap-6">
                <div className={`${inner} p-5 sm:p-6`}>
                  <h3 className={`text-center text-sm font-semibold uppercase tracking-wider mb-4 ${dark ? "text-brand-muted" : "text-slate-500"}`}>
                    Daily target ({DAILY_TARGET} kcal)
                  </h3>
                  <div className="max-w-xs mx-auto min-h-[260px]">
                    <Pie data={dailyCaloriePieData} options={pieChartOptions} />
                  </div>
                  <p className={`text-center text-sm font-medium mt-4 ${dark ? "text-slate-200" : "text-slate-700"}`}>
                    {totalCalories > DAILY_TARGET ? (
                      <span className="text-orange-400">
                        Over target by {totalCalories - DAILY_TARGET} kcal
                      </span>
                    ) : (
                      <span className="text-emerald-400/90">
                        {DAILY_TARGET - totalCalories} kcal remaining
                      </span>
                    )}
                  </p>
                </div>

                <div className={`${inner} p-5 overflow-x-auto`}>
                  <h3 className="text-sm font-semibold mb-3">Breakdown</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-left border-b ${dark ? "border-white/10 text-brand-muted" : "border-slate-200 text-slate-500"}`}>
                        <th className="py-2 pr-2">Item</th>
                        <th className="py-2 pr-2">Qty</th>
                        <th className="py-2 pr-2">Per unit</th>
                        <th className="py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calorieDetails.map((item, index) => (
                        <tr
                          key={index}
                          className={`border-b ${dark ? "border-white/5 text-slate-200" : "border-slate-100 text-slate-700"}`}
                        >
                          <td className="py-2.5 pr-2 font-medium">{item.name}</td>
                          <td className="py-2.5 pr-2">{item.quantity}</td>
                          <td className="py-2.5 pr-2">{item.caloriePerUnit}</td>
                          <td className="py-2.5 text-brand-accent font-semibold">{item.totalCalories}</td>
                        </tr>
                      ))}
                      <tr className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                        <td className="py-3 pr-2" colSpan={3}>
                          Total
                        </td>
                        <td className="py-3 text-brand-accent">{totalCalories}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div
                  className={`rounded-xl p-5 text-center border ${
                    dark ? "bg-brand-accent/10 border-brand-accent/25" : "bg-brand-accent/5 border-brand-accent/20"
                  }`}
                >
                  <p className={`text-xs uppercase tracking-wider ${dark ? "text-brand-muted" : "text-slate-500"}`}>Cart total</p>
                  <p className="text-4xl font-bold text-brand-accent mt-1">{totalCalories}</p>
                  <p className={`text-sm mt-2 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {totalCalories < DAILY_TARGET
                      ? `${Math.round((totalCalories / DAILY_TARGET) * 100)}% of daily target`
                      : `${Math.round(((totalCalories - DAILY_TARGET) / DAILY_TARGET) * 100)}% over daily target`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border p-4 ${
                    dark ? "border-brand-border bg-white/[0.04]" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {[
                    { label: "Days tracked (this month)", value: monthlyData.daysTracked },
                    { label: "Month total (kcal)", value: monthlyData.totalMonthlyCalories },
                    { label: "Saved today (kcal)", value: todaySavedKcal },
                    { label: "Cart now", value: totalCalories },
                  ].map((row) => (
                    <div key={row.label}>
                      <p className={`text-[10px] uppercase tracking-wider ${dark ? "text-brand-muted" : "text-slate-500"}`}>
                        {row.label}
                      </p>
                      <p className="text-xl font-bold text-brand-accent mt-1">{row.value}</p>
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${dark ? "text-brand-muted" : "text-slate-500"}`}>
                  <strong className={dark ? "text-slate-300" : "text-slate-700"}>Days tracked</strong> counts days you opened this page or logged cart calories (local date). Chart uses the same calendar dates as your phone.
                </p>
                <div
                  className={`text-center text-sm sm:text-base py-10 rounded-xl border space-y-4 ${
                    dark ? "text-brand-muted border-brand-border bg-white/[0.03]" : "text-slate-500 border-slate-200 bg-slate-50"
                  }`}
                >
                  <p>Cart is empty — add dishes from the menu to see today&apos;s breakdown and pie chart.</p>
                  {todaySavedKcal > 0 && (
                    <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
                      You still have <span className="text-brand-accent font-semibold">{todaySavedKcal} kcal</span> saved for today from an earlier cart (switch to Monthly view to see the line).
                    </p>
                  )}
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}
                  >
                    Browse menu
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-6">
              <div className={`${inner} p-4 sm:p-5`}>
                <div className="min-h-[280px] w-full">
                  <Line data={monthlyCalorieLineData} options={lineChartOptions} />
                </div>
              </div>

              <div className={`${inner} p-5`}>
                <h3 className="text-sm font-semibold mb-4">Monthly stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total (kcal)", value: monthlyData.totalMonthlyCalories },
                    { label: "Days tracked", value: monthlyData.daysTracked },
                    {
                      label: "Daily average",
                      value:
                        dailyAvgDenominator > 0
                          ? Math.round(monthlyData.totalMonthlyCalories / dailyAvgDenominator)
                          : 0,
                    },
                    { label: "Monthly target", value: `${DAILY_TARGET}×30` },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-xl px-3 py-3 border ${
                        dark ? "bg-white/[0.04] border-brand-border" : "bg-white border-slate-100"
                      }`}
                    >
                      <p className={`text-[10px] uppercase tracking-wider ${dark ? "text-brand-muted" : "text-slate-500"}`}>{s.label}</p>
                      <p className="text-lg font-bold text-brand-accent mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? "text-brand-muted" : "text-slate-500"}`}>
                    Progress vs target
                  </h4>
                  <div className={`h-2.5 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-200"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pctMonth}%`,
                        background:
                          monthlyData.totalMonthlyCalories > monthlyCalorieTarget
                            ? "linear-gradient(90deg,#f97316,#ea580c)"
                            : "linear-gradient(90deg,#e94560,#f97316)",
                      }}
                    />
                  </div>
                  <p className={`text-xs mt-2 text-center ${dark ? "text-brand-muted" : "text-slate-500"}`}>
                    {Math.round(pctMonth)}% of monthly target ({monthlyCalorieTarget} kcal)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calorie;
