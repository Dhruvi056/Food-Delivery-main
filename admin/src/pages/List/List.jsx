import React, { useEffect, useState, useContext } from "react";
import "./List.css"; // kept as fallback
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { FiTrash2, FiRefreshCw, FiToggleLeft, FiToggleRight, FiSearch, FiPackage, FiEdit } from "react-icons/fi";

// ── Status Pill ────────────────────────────────────────────────────────────────
const StatusPill = ({ isDeleted, isAvailable }) => {
  if (isDeleted)
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">Deleted</span>;
  if (isAvailable === false)
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">Sold Out</span>;
  return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Live</span>;
};

// ── Toggle Switch ──────────────────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    role="switch" aria-checked={checked}
    onClick={onChange} disabled={disabled}
    className={[
      "relative w-10 h-5 rounded-full transition-all duration-300 outline-none",
      "focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      checked ? "bg-emerald-500" : "bg-slate-700",
    ].join(" ")}
  >
    <span className={[
      "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300",
      checked ? "translate-x-5" : "translate-x-0",
    ].join(" ")} />
  </button>
);

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="h-4 bg-brand-border rounded w-full" />
      </td>
    ))}
  </tr>
);

const List = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All"); // All | Live | Sold Out | Deleted

  const fetchList = async () => {
    setLoading(true);
    const res = await axios.get(`${url}/api/food/admin-list`, { headers: { token } });
    if (res.data.success) setList(res.data.data);
    else toast.error(res.data.message || "Error fetching items");
    setLoading(false);
  };

  const removeFood = async (foodId) => {
    const res = await axios.post(`${url}/api/food/remove`, { id: foodId }, { headers: { token } });
    await fetchList();
    res.data.success ? toast.success(res.data.message) : toast.error("Error");
  };

  const recoverFood = async (foodId) => {
    const res = await axios.post(`${url}/api/food/recover`, { id: foodId }, { headers: { token } });
    await fetchList();
    res.data.success ? toast.success(res.data.message) : toast.error("Error recovering item");
  };

  const toggleAvailability = async (id, current) => {
    const res = await axios.post(
      `${url}/api/food/update-availability`,
      { id, isAvailable: !current },
      { headers: { token } }
    );
    if (res.data.success) {
      toast.success(res.data.message);
      setList(prev => prev.map(item => item._id === id ? { ...item, isAvailable: !current } : item));
    } else toast.error("Failed to update availability");
  };

  useEffect(() => {
    if (!admin && !token) { toast.error("Please login first"); navigate("/"); }
    fetchList();
  }, []);

  const filtered = list.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All"     ? true :
      filter === "Live"    ? !item.isDeleted && item.isAvailable !== false :
      filter === "Sold Out"? !item.isDeleted && item.isAvailable === false :
      filter === "Deleted" ? item.isDeleted : true;
    return matchSearch && matchFilter;
  });

  const filterTabs = ["All", "Live", "Sold Out", "Deleted"];

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-brand-dark min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FiPackage className="text-brand-accent" /> Food Inventory
            </h1>
            <p className="text-sm text-brand-muted mt-1">{list.length} total items · {list.filter(i => !i.isDeleted).length} active</p>
          </div>
          <button onClick={fetchList} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-brand-muted border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-all duration-200">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-brand-border rounded-xl text-white placeholder-brand-muted text-sm outline-none focus:border-brand-accent transition-all duration-200"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab} onClick={() => setFilter(tab)}
                className={[
                  "px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200",
                  filter === tab
                    ? "bg-brand-accent text-white border-brand-accent"
                    : "text-brand-muted border-brand-border hover:border-brand-accent hover:text-brand-accent",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── CRM Table ── */}
        <div className="rounded-2xl border border-brand-border overflow-hidden shadow-card-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-card border-b border-brand-border">
                {["Image", "Name", "Category", "Price", "Status", "Available", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-brand-muted">
                        <FiPackage className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No items found</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((item, idx) => (
                    <tr
                      key={item._id || idx}
                      className={[
                        "transition-colors duration-150 group",
                        item.isDeleted
                          ? "bg-red-500/5 opacity-60"
                          : item.isAvailable === false
                            ? "bg-yellow-500/3"
                            : "bg-brand-card hover:bg-brand-cardHover",
                      ].join(" ")}
                    >
                      {/* Image */}
                      <td className="px-4 py-3.5 pl-5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-brand-border shrink-0">
                          <img
                          src={item.image}
                            alt={item.name}
                            className={`w-full h-full object-cover ${item.isDeleted ? "grayscale" : ""}`}
                          />
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <p className={`font-semibold ${item.isDeleted ? "line-through text-brand-muted" : "text-white"}`}>
                          {item.name}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-brand-border">
                          {item.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-bold text-brand-accent">
                        ₹{item.price}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusPill isDeleted={item.isDeleted} isAvailable={item.isAvailable} />
                      </td>

                      {/* Toggle */}
                      <td className="px-4 py-3.5">
                        <ToggleSwitch
                          checked={item.isAvailable !== false && !item.isDeleted}
                          onChange={() => !item.isDeleted && toggleAvailability(item._id, item.isAvailable !== false)}
                          disabled={item.isDeleted}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        {item.isDeleted ? (
                          <button
                            onClick={() => recoverFood(item._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-200"
                          >
                            <FiRefreshCw className="w-3.5 h-3.5" /> Recover
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => navigate("/add", { state: { editItem: item } })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/30 bg-brand-accent/10 hover:bg-brand-accent/20 transition-all duration-200"
                            >
                              <FiEdit className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => removeFood(item._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default List;
