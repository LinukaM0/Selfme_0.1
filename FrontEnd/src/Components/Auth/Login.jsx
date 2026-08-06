// FrontEnd/src/Components/Auth/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { setAuthToken } from "../../utils/auth";
import logo from "./logo selfme.png";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      // Store token and user data in localStorage
      setAuthToken(res.data.token);
      const authUser = {
        userId: res.data.userId, // MongoDB _id
        userid: res.data.userid, // Custom userid (e.g., SELFMEID0001)
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        role: res.data.role,
      };
      localStorage.setItem("authUser", JSON.stringify(authUser));

      // Redirect based on role
      switch (res.data.role) {
        case "Admin":
          navigate("/mainAdminhome");
          break;
        case "Inventory":
          navigate("/inventory");
          break;
        case "Finance":
          navigate("/FinanceManager");
          break;
        case "Technician":
          navigate("/technicianDashboard");
          break;
        case "Customer":
          navigate("/"); // Redirect to home
          break;
        default:
          setError("Unknown role");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-page" className="login-container">
      <div className="solar-panel-grid"></div>
      <div className="energy-wave energy-wave-1"></div>
      <div className="energy-wave energy-wave-2"></div>
      <div className="energy-wave energy-wave-3"></div>
      <div className="solar-pattern"></div>
      <div className="gradient-overlay"></div>
      <div className="login-content">
        <div className="login-header">
          <img src={logo} alt="Selfme.lk Solar Solutions" className="logo" />
          <h1 className="company-name">Selfme.lk</h1>
          <p className="company-tagline">
            Powering Your Future with Solar Energy
          </p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="form-title">Welcome Back</h2>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <div className="signup-section">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="signup-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;