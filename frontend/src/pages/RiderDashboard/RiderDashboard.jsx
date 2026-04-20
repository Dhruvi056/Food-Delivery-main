import React, { useContext, useEffect, useState, useCallback } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io as socketIO } from "socket.io-client";
import { toast } from "react-toastify";
import {
  FiTruck, FiPackage, FiMapPin, FiCheckCircle,
  FiClock, FiRefreshCw, FiAlertTriangle, FiChevronRight,
  FiZap, FiUser,
} from "react-icons/fi";

// ── Delivery lifecycle steps visible on the Active Delivery view ────────────
const LIFECYCLE = [
  { status: "Accepted by Rider", label: "Accepted",       icon: FiCheckCircle },
  { status: "At Restaurant",     label: "At Restaurant",  icon: FiPackage },
  { status: "Picked Up",         label: "Picked Up",      icon: FiZap },
  { status: "Out for Delivery",  label: "Out for Delivery", icon: FiTruck },
  { status: "Delivered",         label: "Delivered",      icon: FiCheckCircle },
];

const NEXT_STEP_LABELS = {
  "Accepted by Rider": "I'm at the restaurant →",
  "At Restaurant":     "Order picked up →",
  "Picked Up":         "On my way →",
  "Out for Delivery":  "Mark as Delivered ✓",
};

// ── Status colors ───────────────────────────────────────────────────────────
const STATUS_COLOR = {
  "Accepted by Rider": "text-yellow-400",
  "At Restaurant":     "text-orange-400",
  "Picked Up":         "text-blue-400",
  "Out for Delivery":  "text-purple-400",
  "Delivered":         "text-emerald-400",
};

const SHIFT_STATS_KEY = "rider-shift-stats";

const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

// ── Glassmorphism card ───────────────────────────────────────────────────────
const GlassCard = ({ children, className = "", dark }) => (
  <div
    className={`rounded-2xl border p-5 transition-all duration-300 ${className} ${
      dark
        ? "bg-white/5 border-white/10 backdrop-blur-sm"
        : "bg-white border-slate-200 shadow-sm"
    }`}
  >
    {children}
  </div>
);

// ── Available Order Pool Card ────────────────────────────────────────────────
const PoolCard = ({ order, onClaim, claiming, dark }) => {
  const itemSummary = order.items
    .map(i => `${i.name} ×${i.quantity}`)
    .join(", ");

  return (
    <GlassCard dark={dark} className="hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
            <FiPackage className="text-orange-400 w-5 h-5" />
          </div>
          <div>
            <p className="font-mono text-xs text-slate-400">
              #{String(order._id).slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(order.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <span className="font-bold text-lg" style={{ color: "#f97316" }}>₹{order.amount}</span>
      </div>

      {/* Items */}
      <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${dark ? "bg-white/5" : "bg-slate-50"}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Items · {order.items.length}
        </p>
        <p className={dark ? "text-slate-300" : "text-slate-700"}>{itemSummary}</p>
      </div>

      {/* Address */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <FiMapPin className="text-slate-400 w-4 h-4 shrink-0" />
        <p className={dark ? "text-slate-400" : "text-slate-500"}>
          {order.address?.street}, {order.address?.city}
        </p>
      </div>

      <button
        onClick={() => onClaim(order._id)}
        disabled={claiming === order._id}
        className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg,#e94560,#f97316)", boxShadow: "0 4px 15px rgba(233,69,96,0.3)" }}
      >
        {claiming === order._id ? (
          <><FiRefreshCw className="animate-spin w-4 h-4" /> Claiming…</>
        ) : (
          <><FiZap className="w-4 h-4" /> Claim Order</>
        )}
      </button>
    </GlassCard>
  );
};

// ── Active Delivery View ─────────────────────────────────────────────────────
const ActiveDelivery = ({ order, onAdvance, advancing, dark }) => {
  const currentIdx = LIFECYCLE.findIndex(l => l.status === order.status);
  const isDelivered = order.status === "Delivered";

  return (
    <div className="flex flex-col gap-5">
      {/* Status header */}
      <GlassCard dark={dark}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <FiTruck className="text-emerald-400 w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Active Delivery</h2>
            <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Order #{String(order._id).slice(-8).toUpperCase()}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`text-sm font-bold ${STATUS_COLOR[order.status] || "text-slate-400"}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-1 w-full">
          {LIFECYCLE.map((step, i) => {
            const Icon = step.icon;
            const done    = i < currentIdx;
            const current = i === currentIdx;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className={[
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    done    ? "bg-emerald-500 border-emerald-500 text-white" : "",
                    current ? "border-orange-400 text-orange-400 animate-pulse" : "",
                    !done && !current ? "border-slate-600 text-slate-600" : "",
                  ].join(" ")}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] mt-1 text-center leading-tight hidden sm:block ${
                    done || current ? "text-orange-400" : "text-slate-600"
                  }`}>{step.label}</span>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-0.5 rounded-full mt-[-16px] transition-all duration-500 ${
                    done ? "bg-emerald-500" : "bg-slate-700"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </GlassCard>

      {/* Customer address */}
      <GlassCard dark={dark}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Delivery Address
        </p>
        <div className="flex items-start gap-3">
          <FiMapPin className="text-orange-400 w-5 h-5 shrink-0 mt-0.5" />
          <div className={`text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
            <p className="font-semibold">{order.address?.firstName} {order.address?.lastName}</p>
            <p>{order.address?.street}</p>
            <p>{order.address?.city}, {order.address?.state} – {order.address?.zipcode}</p>
            {order.address?.phone && (
              <p className="flex items-center gap-1.5 mt-1 text-orange-400 font-medium">
                <FiUser className="w-3.5 h-3.5" /> {order.address.phone}
              </p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Items */}
      <GlassCard dark={dark}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Order Items · {order.items.length}
        </p>
        <div className="flex flex-col gap-2">
          {order.items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between text-sm py-2 border-b last:border-0 ${dark ? "border-white/5" : "border-slate-100"}`}>
              <span className={dark ? "text-slate-300" : "text-slate-700"}>{item.name}</span>
              <span className="text-slate-400">×{item.quantity}</span>
            </div>
          ))}
          <div className="flex items-center justify-between mt-2 pt-2">
            <span className="text-sm font-semibold text-slate-400">Total</span>
            <span className="font-bold text-orange-400 text-lg">₹{order.amount}</span>
          </div>
        </div>
      </GlassCard>

      {/* Next Step CTA */}
      {!isDelivered && NEXT_STEP_LABELS[order.status] && (
        <button
          onClick={onAdvance}
          disabled={advancing}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all duration-200 active:scale-98 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#e94560,#f97316)", boxShadow: "0 6px 20px rgba(233,69,96,0.35)" }}
        >
          {advancing ? (
            <><FiRefreshCw className="animate-spin w-5 h-5" /> Updating…</>
          ) : (
            <><FiChevronRight className="w-5 h-5" /> {NEXT_STEP_LABELS[order.status]}</>
          )}
        </button>
      )}

      {isDelivered && (
        <div className="w-full py-4 rounded-2xl font-bold text-emerald-400 text-base flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/30">
          <FiCheckCircle className="w-5 h-5" /> Delivery Complete! You are now available.
        </div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const RiderDashboard = () => {
  const { url, token, userEmail } = useContext(StoreContext);
  const { theme } = useTheme();
  const dark = theme === "dark";
  const navigate = useNavigate();

  const [view, setView]                 = useState("pool"); // "pool" | "active"
  const [availableOrders, setAvailable] = useState([]);
  const [activeOrder, setActiveOrder]   = useState(null);
  const [claiming, setClaiming]         = useState(null);
  const [advancing, setAdvancing]       = useState(false);
  const [loading, setLoading]           = useState(true);
  const [searchCity, setSearchCity]     = useState("");
  const [minAmount, setMinAmount]       = useState(0);
  const [shiftStartAt, setShiftStartAt] = useState(() => Date.now());
  const [shiftNow, setShiftNow]         = useState(Date.now());
  const [stats, setStats]               = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SHIFT_STATS_KEY)) || {
        completedToday: 0,
        earningsToday: 0,
      };
    } catch {
      return { completedToday: 0, earningsToday: 0 };
    }
  });

  // Guard: redirect non-riders
  useEffect(() => {
    if (!token) { navigate("/"); return; }
    const payload = decodeJwtPayload(token);
    const role = (payload?.role || "").toLowerCase();
    const emailFallback = (userEmail || "").toLowerCase() === "rider@gmail.com";
    if (role !== "rider" && !emailFallback) navigate("/");
  }, [token, navigate]);

  const headers = { token };

  useEffect(() => {
    const timer = setInterval(() => setShiftNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(SHIFT_STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  const shiftHours = ((shiftNow - shiftStartAt) / (1000 * 60 * 60)).toFixed(1);
  const earningsRate = 0.2; // demo payout model: 20% per delivered order

  const filteredPool = availableOrders.filter((o) => {
    const city = (o.address?.city || "").toLowerCase();
    const cityMatch = city.includes(searchCity.toLowerCase().trim());
    const amountMatch = Number(o.amount || 0) >= Number(minAmount || 0);
    return cityMatch && amountMatch;
  });

  const fetchPool = useCallback(async () => {
    try {
      const res = await axios.get(`${url}/api/rider/available`, { headers });
      if (res.data.success) setAvailable(res.data.data);
    } catch { /* silent */ }
  }, [url, token]);

  const fetchActive = useCallback(async () => {
    try {
      const res = await axios.get(`${url}/api/rider/active`, { headers });
      if (res.data.success && res.data.data) {
        setActiveOrder(res.data.data);
        setView("active");
      } else {
        setActiveOrder(null);
        setView("pool");
      }
    } catch { /* silent */ }
  }, [url, token]);

  // Initial data load
  useEffect(() => {
    if (!token) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPool(), fetchActive()]);
      setLoading(false);
    };
    init();
  }, [token]);

  // Socket.io — live pool refresh on food_ready
  useEffect(() => {
    if (!token) return;
    const socket = socketIO(url);
    const payload = decodeJwtPayload(token);
    if (payload?.id) socket.emit("join_rider", payload.id);

    // Silently refresh the pool when a new order is ready
    socket.on("food_ready", () => {
      fetchPool();
      toast.info("🛵 New order available! Check the pool.", { toastId: "food_ready" });
    });

    // Update active order status in real time
    socket.on("order_update", (update) => {
      setActiveOrder(prev => prev && prev._id === update.orderId
        ? { ...prev, status: update.status }
        : prev
      );
    });

    // Rider delivered — return to pool view
    socket.on("delivery_complete", () => {
      toast.success("🎉 Delivery marked complete! Great job!");
      if (activeOrder?.amount) {
        setStats((prev) => ({
          completedToday: prev.completedToday + 1,
          earningsToday: prev.earningsToday + Math.round(activeOrder.amount * earningsRate),
        }));
      }
      setActiveOrder(null);
      setView("pool");
      fetchPool();
    });

    return () => socket.disconnect();
  }, [token, url]);

  const handleClaim = async (orderId) => {
    setClaiming(orderId);
    try {
      const res = await axios.post(`${url}/api/rider/claim`, { orderId }, { headers });
      if (res.data.success) {
        toast.success("Order claimed! Head to the restaurant.");
        setActiveOrder(res.data.data);
        setView("active");
        fetchPool(); // remove claimed order from pool
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Failed to claim order.");
    }
    setClaiming(null);
  };

  const handleAdvance = async () => {
    if (!activeOrder) return;
    setAdvancing(true);
    try {
      const res = await axios.post(`${url}/api/rider/advance`, { orderId: activeOrder._id }, { headers });
      if (res.data.success) {
        setActiveOrder(res.data.data);
        toast.success(`Status: ${res.data.data.status}`);
        if (res.data.data.status === "Delivered") {
          setTimeout(() => { setActiveOrder(null); setView("pool"); fetchPool(); }, 3000);
        }
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Failed to update status.");
    }
    setAdvancing(false);
  };

  return (
    <div className={`min-h-screen pt-8 pb-20 px-4 transition-colors duration-300 ${dark ? "bg-brand-dark text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <FiTruck className="text-orange-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rider Dashboard</h1>
            <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
              {activeOrder ? "You have an active delivery" : "Browse available orders to claim"}
            </p>
          </div>
        </div>

        {/* Master-level KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <GlassCard dark={dark}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Shift Time</p>
            <p className="text-xl font-bold mt-1">{shiftHours} hrs</p>
          </GlassCard>
          <GlassCard dark={dark}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Completed Today</p>
            <p className="text-xl font-bold mt-1 text-emerald-400">{stats.completedToday}</p>
          </GlassCard>
          <GlassCard dark={dark}>
            <p className="text-xs uppercase tracking-wide text-slate-400">Estimated Earnings</p>
            <p className="text-xl font-bold mt-1 text-orange-400">₹{stats.earningsToday}</p>
          </GlassCard>
        </div>

        {/* Smart dispatch controls */}
        <GlassCard dark={dark} className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Smart Pool Filters
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Filter by city..."
              className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none border ${
                dark
                  ? "bg-white/5 border-white/10 text-slate-200 placeholder-slate-500"
                  : "bg-white border-slate-200 text-slate-700 placeholder-slate-400"
              }`}
            />
            <input
              type="number"
              min={0}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="Minimum order amount"
              className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none border ${
                dark
                  ? "bg-white/5 border-white/10 text-slate-200 placeholder-slate-500"
                  : "bg-white border-slate-200 text-slate-700 placeholder-slate-400"
              }`}
            />
          </div>
        </GlassCard>

        {/* View Toggle Tabs */}
        <div className={`flex gap-2 mb-6 p-1 rounded-xl ${dark ? "bg-white/5 border border-white/10" : "bg-slate-100"}`}>
          {["pool", "active"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                view === v
                  ? "text-white shadow"
                  : dark ? "text-slate-400 hover:text-white" : "text-slate-500",
              ].join(" ")}
              style={view === v ? { background: "linear-gradient(135deg,#e94560,#f97316)" } : {}}
            >
              {v === "pool" ? `🏊 Order Pool (${filteredPool.length})` : "🛵 Active Delivery"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className={`h-48 rounded-2xl animate-pulse ${dark ? "bg-white/5" : "bg-slate-200"}`} />
            ))}
          </div>
        ) : view === "pool" ? (
          filteredPool.length === 0 ? (
            <GlassCard dark={dark} className="text-center py-16">
              <FiClock className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-lg font-semibold">No orders available yet</p>
              <p className={`text-sm mt-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>
                We'll notify you instantly when food is ready for pickup.
              </p>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredPool.map(order => (
                <PoolCard
                  key={order._id}
                  order={order}
                  onClaim={handleClaim}
                  claiming={claiming}
                  dark={dark}
                />
              ))}
            </div>
          )
        ) : activeOrder ? (
          <ActiveDelivery
            order={activeOrder}
            onAdvance={handleAdvance}
            advancing={advancing}
            dark={dark}
          />
        ) : (
          <GlassCard dark={dark} className="text-center py-16">
            <FiAlertTriangle className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-lg font-semibold">No active delivery</p>
            <p className={`text-sm mt-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Claim an order from the pool to get started.
            </p>
            <button
              onClick={() => setView("pool")}
              className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#e94560,#f97316)" }}
            >
              View Order Pool
            </button>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;
