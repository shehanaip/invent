import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../auth.css";

const API =
  import.meta.env.VITE_API_URL ||
  "https://invent-yfwy.onrender.com/api";

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
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return regex.test(pass);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Login failed");
      }

      localStorage.setItem("token", data.token);

      nav("/");
    } catch (err) {
      console.log(err);
      alert(err.message || "Login failed");
    }
  };

  // ================= REGISTER =================
  const register = async () => {
    try {
      if (!validatePassword(password)) {
        alert(
          "Password must be at least 6 characters and include a number"
        );
        return;
      }

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Register failed");
      }

      alert("Registration successful!");
      setIsLogin(true);

      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.log(err);
      alert(err.message || "Register failed");
    }
  };

  return (
    <div className={`auth-wrapper ${isLogin ? "login" : "register"}`}>
      
      {/* LEFT SIDE */}
      <div className="auth-left">
        <div className="auth-overlay"></div>

        <div className="auth-brand">
          <h1>INVENT</h1>
          <p>Smart Inventory Management System</p>
        </div>

        <div className="glow glow-1"></div>
        
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">

        <div className="auth-box">

          <h2>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          <p className="auth-subtitle">
            {isLogin
              ? "Login to continue managing your inventory"
              : "Create your account to get started"}
          </p>

          {/* NAME */}
          {!isLogin && (
            <div className="input-group">
              <i className="fas fa-user"></i>

              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {/* EMAIL */}
          <div className="input-group">
            <i className="fas fa-envelope"></i>

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <i className="fas fa-lock"></i>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* MAIN BUTTON */}
          <button
            className="auth-btn"
            onClick={isLogin ? login : register}
          >
            {isLogin ? (
              <>
          
              </>
            ) : (
              <>
               
              </>
            )}
          </button>

          {/* DIVIDER */}
          <div className="divider">
            <span>OR</span>
          </div>

          {/* GOOGLE BUTTON */}
          <button
            type="button"
            className="google-btn"
            onClick={googleLogin}
          >
            <i className="fab fa-google"></i>

             Continue with Google
          </button>

          {/* TOGGLE */}
          <p className="switch-text">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}{" "}

            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Register" : "Login"}
            </span>
          </p>

        </div>

      </div>

    </div>
  );
}