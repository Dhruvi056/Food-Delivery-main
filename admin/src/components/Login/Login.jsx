import React, { useContext, useEffect, useState } from "react";
import "./Login.css"; // kept as fallback
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiShield, FiLogIn } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const { admin, setAdmin, token, setToken } = useContext(StoreContext);
  const [data, setData] = useState({ email: "", password: "", code: "" });
  const [is2FA, setIs2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (e) =>
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = is2FA ? "/api/user/verify-2fa" : "/api/user/login";
    try {
      const response = await axios.post(endpoint, data);
      if (response.data.success) {
        if (response.data.requires2FA) {
          setIs2FA(true);
          toast.info("📧 Verification code sent to your email");
        } else {
          if (response.data.role === "admin") {
            setToken(response.data.token);
            setAdmin(true);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("admin", true);
            toast.success("Welcome back, Admin! 🎉");
            navigate("/add");
          } else {
            toast.error("Access denied — Admin accounts only");
          }
        }
      } else {
        toast.error(response.data.message);
      }
    } catch {
      toast.error("Server error — please try again");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (admin && token) navigate("/add");
  }, [admin, token, navigate]);

  return (
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-brand-dark p-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-card-dark">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center">
              <FiShield className="text-brand-accent w-7 h-7" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">
                {is2FA ? "Verify Identity" : "Admin Portal"}
              </h1>
              <p className="text-sm text-brand-muted mt-1">
                {is2FA
                  ? "Enter the 6-digit code sent to your email"
                  : "Sign in to manage BiteBlitz"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onLogin} className="space-y-4">
            {is2FA ? (
              <div className="relative">
                <FiShield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
                <input
                  name="code"
                  type="text"
                  value={data.code}
                  onChange={onChangeHandler}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-brand-muted text-sm outline-none focus:border-brand-accent focus:bg-white/8 transition-all duration-200 text-center tracking-widest font-mono text-lg"
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
                  <input
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={onChangeHandler}
                    placeholder="Admin email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-brand-muted text-sm outline-none focus:border-brand-accent focus:bg-white/8 transition-all duration-200"
                  />
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
                  <input
                    name="password"
                    type="password"
                    value={data.password}
                    onChange={onChangeHandler}
                    placeholder="Password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-brand-border rounded-xl text-white placeholder-brand-muted text-sm outline-none focus:border-brand-accent focus:bg-white/8 transition-all duration-200"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg,#e94560,#f97316)", boxShadow: "0 4px 20px rgba(233,69,96,0.35)" }}
            >
              <FiLogIn className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Signing in…" : is2FA ? "Verify & Enter" : "Sign In"}
            </button>
          </form>

          {is2FA && (
            <button
              onClick={() => { setIs2FA(false); setData(d => ({ ...d, code: "" })); }}
              className="w-full mt-4 text-xs text-brand-muted hover:text-white text-center transition-colors"
            >
              ← Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
