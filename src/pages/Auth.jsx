import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../auth.css";

// ✅ PRODUCTION SAFE API BASE
const API =
  import.meta.env.VITE_API_URL || "https://invent-yfwy.onrender.com/api";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nav = useNavigate();

  // ================= GOOGLE CALLBACK =================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.location.href = "/";
    }
  }, []);

  // ================= PASSWORD VALIDATION =================
  const validatePassword = (pass) => {
    return /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(pass);
  };

  // ================= GOOGLE LOGIN =================
  const googleLogin = () => {
    window.location.href = `${API}/auth/google`;
  };

  // ================= LOGIN =================
  const login = async () => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.msg);

      localStorage.setItem("token", data.token);
      nav("/");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  // ================= REGISTER =================
  const register = async () => {
    if (!validatePassword(password)) {
      alert("Password must be at least 6 characters and include a number");
      return;
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.msg);

      setIsLogin(true);
      alert("Registered successfully. Please login.");
    } catch (err) {
      alert(err.message || "Register failed");
    }
  };

  return (
    <div className={`auth-wrapper ${isLogin ? "login" : "register"}`}>
      <div className="auth-left">
        <h1>INVENT</h1>
        <p>Smart Inventory Management System</p>
        <div className="glow glow-1"></div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>

          {!isLogin && (
            <input
              placeholder="Full Name"
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={isLogin ? login : register}>
            {isLogin ? "Login" : "Register"}
          </button>

          <button onClick={googleLogin}>
           <i className="fab fa-google"> </i> Continue with Google
          </button>

          <p onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create account" : "Login instead"}
          </p>
        </div>
      </div>
    </div>
  );
}