import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import API from "../api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Reports({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      const res = await API.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts(res.data || []);
    } catch (err) {
      console.log(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= STATS =================
  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.totalStock <= 5).length;
  const outOfStock = products.filter((p) => p.totalStock === 0).length;

  const totalValue = products.reduce(
  (sum, p) => sum + (p.pricePerUnit || 0) * (p.totalStock || 0),
  0
);

  const stockHealth =
    totalProducts === 0
      ? 0
      : Math.round(((totalProducts - lowStock) / totalProducts) * 100);

  // ================= PRINT LEDGER =================
  const handlePrint = () => {
    const printContents =
      document.getElementById("ledger-print").innerHTML;

    const win = window.open("", "", "width=1200,height=800");

    win.document.write(`
      <html>
        <head>
          <title>Inventory Ledger Report</title>
          <style>
            body {
              font-family: Arial;
              padding: 30px;
              color: #000;
            }

            h1, h2 {
              text-align: center;
            }

            .summary {
              margin: 20px 0;
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th, td {
              border: 1px solid #000;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #eee;
            }

            .footer {
              margin-top: 50px;
              text-align: right;
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  // ================= CHART DATA =================
  const barData = products.slice(0, 6).map((p) => ({
  name: p.name,
  stock: p.totalStock,
}));

  const pieData = [
    { name: "Healthy", value: totalProducts - lowStock, color: "#22c55e" },
    { name: "Low Stock", value: lowStock, color: "#f59e0b" },
    { name: "Out", value: outOfStock, color: "#ef4444" },
  ];

  // ================= LOADER =================
  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>REPORTS</h1>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>

      {/* HAMBURGER */}
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* SIDEBAR */}
      <Sidebar
        menuOpen={menuOpen}
        dark={dark}
        setDark={setDark}
        logout={logout}
        active="reports"
      />

      {/* MAIN */}
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-chart-line"></i> Inventory Reports
          </h1>

          <button className="print-btn" onClick={handlePrint}>
            <i className="fas fa-print"></i> Print Ledger
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <i className="fas fa-box"></i>
            <h2>{totalProducts}</h2>
            <p>Total Products</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>{lowStock}</h2>
            <p>Low Stock</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-times-circle"></i>
            <h2>{outOfStock}</h2>
            <p>Out of Stock</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-coins"></i>
            <h2>৳ {totalValue.toLocaleString()}</h2>
            <p>Total Value</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-heartbeat"></i>
            <h2>{stockHealth}%</h2>
            <p>Stock Health</p>
          </div>

        </div>

        {/* CHARTS */}
        <div className="stats-grid">

          <div className="table-card">
            <h3>
              <i className="fas fa-chart-bar"></i> Stock Levels
            </h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#ff7a00" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-card">
            <h3>
              <i className="fas fa-chart-pie"></i> Stock Distribution
            </h3>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={90} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-table"></i> Product Report
          </h3>

          <table>
            <thead>
              <tr>
                <th><i className="fas fa-box"></i> Product</th>
                <th><i className="fas fa-layer-group"></i> Stock</th>
                <th><i className="fas fa-tag"></i> Price</th>
                <th><i className="fas fa-coins"></i> Value</th>
                <th><i className="fas fa-info-circle"></i> Status</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.totalStock}</td>
                  <td>৳ {p.pricePerUnit}</td>
                  <td>৳ {(p.pricePerUnit * p.totalStock).toLocaleString()}</td>
                  <td>
                    {p.totalStock === 0 ? (
                      <span style={{ color: "#ef4444" }}>
                        <i className="fas fa-times"></i> Out
                      </span>
                    ) : p.totalStock <= 5 ? (
                      <span style={{ color: "#f59e0b" }}>
                        <i className="fas fa-exclamation"></i> Low
                      </span>
                    ) : (
                      <span style={{ color: "#22c55e" }}>
                        <i className="fas fa-check"></i> OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PRINTABLE LEDGER */}
        <div id="ledger-print" style={{ display: "none" }}>
          <h1>INVENTORY LEDGER REPORT</h1>
          <h2>{new Date().toLocaleDateString()}</h2>

          <div className="summary">
            <div><strong>Total Products:</strong> {totalProducts}</div>
            <div><strong>Low Stock:</strong> {lowStock}</div>
            <div><strong>Out of Stock:</strong> {outOfStock}</div>
            <div><strong>Total Value:</strong> ৳{totalValue.toLocaleString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.totalStock}</td>
                  <td>৳{p.pricePerUnit}</td>
                  <td>৳{(p.pricePerUnit * p.totalStock).toLocaleString()}</td>
                  <td>
                    {p.totalStock === 0
                      ? "Out"
                      : p.totalStock <= 5
                      ? "Low"
                      : "Available"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer">
            <p>Generated by Inventory Management System</p>
            <p>Authorized Signature: ____________________</p>
          </div>
        </div>

      </main>
    </div>
  );
}