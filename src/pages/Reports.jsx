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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [prodRes, orderRes] = await Promise.all([
        API.get("/products", { headers }),
        API.get("/orders", { headers }).catch((e) => {
          console.log("ORDERS FETCH:", e?.message);
          return { data: [] };
        }),
      ]);

      setProducts(prodRes.data || []);
      setOrders(orderRes.data || []);
    } catch (err) {
      console.log(err);
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= PRODUCT STATS =================
  const totalProducts = products.length;
  const lowStock = products.filter((p) => Number(p.totalStock || 0) <= 5).length;
  const outOfStock = products.filter(
    (p) => Number(p.totalStock || 0) === 0
  ).length;

  const totalValue = products.reduce(
    (sum, p) =>
      sum + Number(p.pricePerUnit || 0) * Number(p.totalStock || 0),
    0
  );

  const stockHealth =
    totalProducts === 0
      ? 0
      : Math.round(((totalProducts - lowStock) / totalProducts) * 100);

  // ================= ORDER STATS =================
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => (o.status || "") === "Pending"
  ).length;
  const completedOrders = orders.filter(
    (o) => (o.status || "") === "Completed"
  ).length;
  const unpaidOrders = orders.filter(
    (o) => (o.payment || "") === "Unpaid"
  ).length;
  const orderRevenue = orders
    .filter((o) => (o.status || "") === "Completed")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const allOrdersValue = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const getCustomerName = (o) =>
    o.customer?.name || o.customer || "Walk-in";

  const getProductName = (o) => {
    if (o.productId?.name) return o.productId.name;
    const p = products.find(
      (x) => x._id === (o.productId?._id || o.productId)
    );
    return p?.name || "Unknown Product";
  };

  // ================= PRINT LEDGER =================
  const handlePrint = () => {
    const printContents = document.getElementById("ledger-print").innerHTML;
    const win = window.open("", "", "width=1200,height=800");

    win.document.write(`
      <html>
        <head>
          <title>Inventory & Orders Report</title>
          <style>
            body { font-family: Arial; padding: 30px; color: #000; }
            h1, h2 { text-align: center; }
            h2 { margin-top: 40px; color: #333; }
            .summary {
              margin: 20px 0;
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 16px;
            }
            .summary div {
              background: #f7f7f7;
              padding: 10px 14px;
              border-radius: 8px;
              border: 1px solid #ddd;
            }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #eee; }
            .footer { margin-top: 50px; text-align: right; }
            .section-title {
              margin-top: 36px;
              padding-bottom: 6px;
              border-bottom: 2px solid #ff7a00;
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
    name: (p.name || "Product").substring(0, 10),
    stock: Number(p.totalStock || 0),
  }));

  const pieData = [
    {
      name: "Healthy",
      value: Math.max(totalProducts - lowStock, 0),
      color: "#22c55e",
    },
    { name: "Low Stock", value: lowStock, color: "#f59e0b" },
    { name: "Out", value: outOfStock, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const orderBarData = [
    { name: "Pending", value: pendingOrders },
    { name: "Completed", value: completedOrders },
    { name: "Unpaid", value: unpaidOrders },
  ];

  const orderPieData = [
    { name: "Pending", value: pendingOrders, color: "#f59e0b" },
    { name: "Completed", value: completedOrders, color: "#22c55e" },
  ].filter((d) => d.value > 0);

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

        {/* ================= PRODUCT STATS ================= */}
        <h3 style={{ marginTop: 10, marginBottom: 8 }}>
          <i className="fas fa-boxes" style={{ color: "#ff7a00" }}></i>{" "}
          Product Overview
        </h3>

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

        {/* PRODUCT CHARTS */}
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

        {/* PRODUCT TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-table"></i> Product Report
          </h3>
          <table>
            <thead>
              <tr>
                <th>
                  <i className="fas fa-box"></i> Product
                </th>
                <th>
                  <i className="fas fa-layer-group"></i> Stock
                </th>
                <th>
                  <i className="fas fa-tag"></i> Price
                </th>
                <th>
                  <i className="fas fa-coins"></i> Value
                </th>
                <th>
                  <i className="fas fa-info-circle"></i> Status
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = Number(p.totalStock || 0);
                  const price = Number(p.pricePerUnit || 0);
                  return (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{stock}</td>
                      <td>৳ {price}</td>
                      <td>৳ {(price * stock).toLocaleString()}</td>
                      <td>
                        {stock === 0 ? (
                          <span style={{ color: "#ef4444" }}>
                            <i className="fas fa-times"></i> Out
                          </span>
                        ) : stock <= 5 ? (
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= ORDERS REPORT ================= */}
        <h3 style={{ marginTop: 28, marginBottom: 8 }}>
          <i className="fas fa-shopping-cart" style={{ color: "#ff7a00" }}></i>{" "}
          Orders Report
        </h3>

        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-shopping-cart"></i>
            <h2>{totalOrders}</h2>
            <p>Total Orders</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-clock"></i>
            <h2>{pendingOrders}</h2>
            <p>Pending</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-check-circle"></i>
            <h2>{completedOrders}</h2>
            <p>Completed</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-exclamation-circle"></i>
            <h2>{unpaidOrders}</h2>
            <p>Unpaid</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-money-bill-wave"></i>
            <h2>৳ {orderRevenue.toLocaleString()}</h2>
            <p>Revenue</p>
          </div>
        </div>

        {/* ORDER CHARTS */}
        <div className="stats-grid">
          <div className="table-card">
            <h3>
              <i className="fas fa-chart-bar"></i> Order Status Overview
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderBarData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-card">
            <h3>
              <i className="fas fa-chart-pie"></i> Order Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderPieData}
                  dataKey="value"
                  outerRadius={90}
                  label
                >
                  {orderPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ORDER TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-receipt"></i> Order Details
          </h3>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td>{getCustomerName(o)}</td>
                    <td>{getProductName(o)}</td>
                    <td>{o.quantity || 0}</td>
                    <td>৳ {Number(o.total || 0).toLocaleString()}</td>
                    <td>
                      <span
                        style={{
                          color:
                            o.status === "Completed" ? "#22c55e" : "#f59e0b",
                          fontWeight: 600,
                        }}
                      >
                        {o.status || "Pending"}
                      </span>
                    </td>
                    <td>{o.payment || "Unpaid"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PRINTABLE LEDGER (products + orders) */}
        <div id="ledger-print" style={{ display: "none" }}>
          <h1>INVENT — Inventory & Orders Report</h1>
          <h2>{new Date().toLocaleString()}</h2>

          <div className="section-title">
            <strong>Product Summary</strong>
          </div>
          <div className="summary">
            <div>
              <strong>Total Products:</strong> {totalProducts}
            </div>
            <div>
              <strong>Low Stock:</strong> {lowStock}
            </div>
            <div>
              <strong>Out of Stock:</strong> {outOfStock}
            </div>
            <div>
              <strong>Stock Health:</strong> {stockHealth}%
            </div>
            <div>
              <strong>Total Value:</strong> ৳{totalValue.toLocaleString()}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const stock = Number(p.totalStock || 0);
                const price = Number(p.pricePerUnit || 0);
                return (
                  <tr key={p._id}>
                    <td>{i + 1}</td>
                    <td>{p.name}</td>
                    <td>{stock}</td>
                    <td>৳{price}</td>
                    <td>৳{(price * stock).toLocaleString()}</td>
                    <td>
                      {stock === 0
                        ? "Out"
                        : stock <= 5
                        ? "Low"
                        : "Available"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="section-title">
            <strong>Orders Summary</strong>
          </div>
          <div className="summary">
            <div>
              <strong>Total Orders:</strong> {totalOrders}
            </div>
            <div>
              <strong>Pending:</strong> {pendingOrders}
            </div>
            <div>
              <strong>Completed:</strong> {completedOrders}
            </div>
            <div>
              <strong>Unpaid:</strong> {unpaidOrders}
            </div>
            <div>
              <strong>Revenue:</strong> ৳{orderRevenue.toLocaleString()}
            </div>
            <div>
              <strong>All Orders Value:</strong> ৳
              {allOrdersValue.toLocaleString()}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7">No orders found</td>
                </tr>
              ) : (
                orders.map((o, i) => (
                  <tr key={o._id}>
                    <td>{i + 1}</td>
                    <td>{getCustomerName(o)}</td>
                    <td>{getProductName(o)}</td>
                    <td>{o.quantity || 0}</td>
                    <td>৳{Number(o.total || 0).toLocaleString()}</td>
                    <td>{o.status || "Pending"}</td>
                    <td>{o.payment || "Unpaid"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="footer">
            <p>Generated by INVENT Inventory Management System</p>
            <p>Authorized Signature: ____________________</p>
          </div>
        </div>
      </main>
    </div>
  );
}
