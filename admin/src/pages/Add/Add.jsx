import React, { useState, useContext, useEffect } from "react";
import "./Add.css"; // kept as fallback
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate, useLocation } from "react-router-dom";
import { FiUploadCloud, FiCheck, FiPlus, FiEdit3 } from "react-icons/fi";
import { FaFire } from "react-icons/fa";

const CATEGORIES = ["Salad", "Rolls", "Deserts", "Sandwich", "Cake", "Pure Veg", "Pasta", "Noodles"];

const InputField = ({ label, icon: Icon, required, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-brand-muted" />}
      {label}
      {required && <span className="text-brand-accent">*</span>}
    </label>
    <input
      required={required}
      className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-brand-muted text-sm outline-none focus:border-brand-accent focus:bg-white/8 transition-all duration-200"
      {...props}
    />
  </div>
);

const Add = ({ url }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editItem = location.state?.editItem || null;
  const isEditMode = !!editItem;

  const { token, admin } = useContext(StoreContext);
  const [image, setImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: "", description: "", price: "", category: "Salad", calorie: ""
  });

  // Pre-fill form when entering Edit mode
  useEffect(() => {
    if (isEditMode && editItem) {
      setData({
        name: editItem.name,
        description: editItem.description,
        price: editItem.price,
        category: editItem.category,
        calorie: editItem.calorie || "",
      });
    }
  }, [editItem, isEditMode]);

  useEffect(() => {
    if (!admin && !token) { toast.error("Please login first"); navigate("/"); }
  }, []);

  const onChange = (e) => setData(d => ({ ...d, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, k === "price" ? Number(v) : v));
    
    if (image) formData.append("image", image);
    if (isEditMode) formData.append("id", editItem._id);

    const endpoint = isEditMode ? `${url}/api/food/update` : `${url}/api/food/add`;
    try {
      const res = await axios.post(endpoint, formData, { headers: { token } });
      
      if (res.data.success) {
        if (!isEditMode) {
          setData({ name: "", description: "", price: "", category: "Salad", calorie: "" });
          setImage(false);
        }
        toast.success(isEditMode ? "Food Updated Successfully" : res.data.message);
        if (isEditMode) {
          setTimeout(() => navigate("/list"), 1500);
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-brand-dark min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {isEditMode ? <FiEdit3 className="text-brand-accent" /> : <FiPlus className="text-brand-accent" />} 
            {isEditMode ? "Edit Food" : "Add New Item"}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {isEditMode ? "Update the details for this existing menu item" : "Upload a new food item to the BiteBlitz menu"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* ── Image Upload ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <FiUploadCloud className="w-3.5 h-3.5 text-brand-muted" />
              Food Image <span className="text-brand-accent">*</span>
            </label>
            <label
              htmlFor="image"
              className={[
                "relative flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 group overflow-hidden",
                (image || (isEditMode && editItem.image))
                  ? "border-brand-accent bg-brand-accent/10"
                  : "border-brand-border bg-white/3 hover:border-brand-accent/50 hover:bg-white/5",
              ].join(" ")}
            >
              {(image || (isEditMode && editItem.image)) ? (
                <>
                  <img
                    src={image ? URL.createObjectURL(image) : editItem.image}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Click to change</span>
                  </div>
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-brand-accent flex items-center justify-center">
                    <FiCheck className="text-white w-4 h-4" />
                  </div>
                </>
              ) : (
                <>
                  <FiUploadCloud className="w-10 h-10 text-brand-muted group-hover:text-brand-accent transition-colors mb-2" />
                  <p className="text-sm text-brand-muted group-hover:text-slate-300 transition-colors">
                    Click to upload image
                  </p>
                  <p className="text-xs text-slate-600 mt-1">PNG, JPG, WEBP up to 10MB</p>
                </>
              )}
            </label>
            <input
              type="file" id="image" hidden required={!isEditMode}
              onChange={e => setImage(e.target.files[0])}
            />
          </div>

          {/* ── Name & Description ── */}
          <InputField
            label="Product Name" icon={null}
            name="name" value={data.name} onChange={onChange}
            placeholder="e.g. Margherita Pizza" required
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">
              Description <span className="text-brand-accent">*</span>
            </label>
            <textarea
              name="description" value={data.description} onChange={onChange}
              rows={4} required
              placeholder="Describe the ingredients, taste, and preparation…"
              className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-brand-muted text-sm outline-none focus:border-brand-accent focus:bg-white/8 transition-all duration-200 resize-none"
            />
          </div>

          {/* ── Category + Price + Calorie row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">
                Category <span className="text-brand-accent">*</span>
              </label>
              <select
                name="category" value={data.category} onChange={onChange}
                required
                className="w-full px-4 py-3 bg-brand-cardHover border border-brand-border rounded-xl text-white text-sm outline-none focus:border-brand-accent transition-all duration-200 cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <InputField
              label="Price (₹)" icon={null} type="number"
              name="price" value={data.price} onChange={onChange}
              placeholder="e.g. 299" required min="1"
            />

            <InputField
              label="Calories (kcal)" icon={FaFire} type="number"
              name="calorie" value={data.calorie} onChange={onChange}
              placeholder="e.g. 450" required min="1"
            />
          </div>

          {/* ── Submit ── */}
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 mt-2"
            style={{ background: "linear-gradient(135deg,#e94560,#f97316)", boxShadow: "0 4px 20px rgba(233,69,96,0.35)" }}
          >
            {isEditMode ? (
              <FiCheck className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            ) : (
              <FiPlus className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            )}
            {loading ? (isEditMode ? "Updating…" : "Adding item…") : (isEditMode ? "Update Item" : "Add to Menu")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Add;
