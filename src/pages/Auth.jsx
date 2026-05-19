import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../auth.css";

const API = "http://localhost:5000/api";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nav = useNavigate();

  // ================= GOOGLE CALLBACK HANDLER =================
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
    // at least 6 chars, 1 letter, 1 number
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return regex.test(pass);
  };

  // ================= GOOGLE LOGIN =================
  const googleLogin = () => {
    window.location.href = `${API}/auth/google`;
  };

  // ================= LOGIN =================
  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      nav("/");
    } else {
      alert(data.msg || "Login failed");
    }
  };

  // ================= REGISTER =================
  const register = async () => {
    if (!validatePassword(password)) {
      alert("Password must be at least 6 characters and include a number");
      return;
    }

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (data._id || data.user) {
      setIsLogin(true);
    } else {
      alert(data.msg || "Register failed");
    }
  };

  return (
    <div className={`auth-wrapper ${isLogin ? "login" : "register"}`}>

      {/* LEFT SIDE */}
      <div className="auth-left">
        <h1>INVENT</h1>
        <p>Smart Inventory Management System</p>

        <div className="glow"></div>
      </div>

      {/* RIGHT SIDE */}
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

          {/* MAIN BUTTON */}
          <button onClick={isLogin ? login : register}>
            {isLogin ? "Login" : "Register"}
          </button>

          {/* GOOGLE LOGIN */}
          <button
            type="button"
            onClick={googleLogin}
            style={{
              marginTop: "10px",
              background: "#fff",
              color: "#000",
              border: "1px solid #ddd",
            }}
          >
            <i className="fab fa-google"></i> Continue with Google
          </button>

          <p>
            {isLogin ? "New here?" : "Already have account?"}{" "}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Create one" : "Login"}
            </span>
          </p>

        </div>
      </div>

    </div>
  );
}