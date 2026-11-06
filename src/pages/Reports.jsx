import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import API from "../api";
import Pagination from "../components/Pagination";
import { usePreferences } from "../context/usePreferences";
import { formatCurrency, formatDateTime } from "../utils/preferences";
import { translate } from "../utils/translations";
import usePagination from "../utils/usePagination";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Reports({ dark, setDark, logout }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [printSections, setPrintSections] = useState({
    summary: true,
    products: true,
    orders: true,
  });

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
  const now = new Date();
  const periodStart = new Date(now);
  if (reportPeriod === "daily") {
    periodStart.setHours(0, 0, 0, 0);
  } else if (reportPeriod === "weekly") {
    periodStart.setDate(now.getDate() - 6);
    periodStart.setHours(0, 0, 0, 0);
  } else if (reportPeriod === "monthly") {
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
  } else {
    periodStart.setMonth(0, 1);
    periodStart.setHours(0, 0, 0, 0);
  }
  const reportOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= periodStart && createdAt <= now;
  });
  const totalOrders = reportOrders.length;
  const pendingOrders = reportOrders.filter(
    (o) => (o.status || "") === "Pending"
  ).length;
  const completedOrders = reportOrders.filter(
    (o) => (o.status || "") === "Completed"
  ).length;
  const unpaidOrders = reportOrders.filter(
    (o) => (o.payment || "") === "Unpaid"
  ).length;
  const orderRevenue = reportOrders
    .filter((o) => (o.status || "") === "Completed")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const allOrdersValue = reportOrders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const getCustomerName = (o) =>
    o.customer?.name || o.customer || "Walk-in";

  const getProductName = (o) => {
    if (o.lineItems?.length) {
      return o.lineItems.map((item) => item.productId?.name || "Unknown Product").join(", ");
    }
    if (o.productId?.name) return o.productId.name;
    const p = products.find(
      (x) => x._id === (o.productId?._id || o.productId)
    );
    return p?.name || "Unknown Product";
  };

  // ================= PRINT LEDGER =================
  const handlePrint = () => {
    if (!Object.values(printSections).some(Boolean)) {
      window.alert(t("Select at least one section to print."));
      return;
    }
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
      name: t("Healthy"),
      value: Math.max(totalProducts - lowStock, 0),
      color: "#22c55e",
    },
    { name: t("Low Stock"), value: lowStock, color: "#f59e0b" },
    { name: t("Out of Stock"), value: outOfStock, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const orderBarData = [
    { name: t("Pending"), value: pendingOrders },
    { name: t("Completed"), value: completedOrders },
    { name: t("Unpaid"), value: unpaidOrders },
  ];

  const orderPieData = [
    { name: t("Pending"), value: pendingOrders, color: "#f59e0b" },
    { name: t("Completed"), value: completedOrders, color: "#22c55e" },
  ].filter((d) => d.value > 0);
  const productPagination = usePagination(products);
  const orderPagination = usePagination(reportOrders);

  // ================= LOADER =================
  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Reports")}</h1>
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
            <i className="fas fa-chart-line"></i> {t("Inventory Reports")}
          </h1>

          <div className="actions report-actions">
            <label className="report-period-control">
              <span>{t("Report period")}</span>
              <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
                <option value="daily">{t("Daily")}</option>
                <option value="weekly">{t("Weekly")}</option>
                <option value="monthly">{t("Monthly")}</option>
                <option value="yearly">{t("Yearly")}</option>
              </select>
            </label>
            <fieldset className="print-section-options">
              <legend>{t("Print includes")}</legend>
              {[
                ["summary", t("Summary")],
                ["products", t("Products")],
                ["orders", t("Orders")],
              ].map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={printSections[key]}
                    onChange={(e) => setPrintSections((current) => ({
                      ...current,
                      [key]: e.target.checked,
                    }))}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <button className="print-btn" onClick={handlePrint}>
              <i className="fas fa-print"></i> {t("Print Ledger")}
            </button>
          </div>
        </div>
        <p className="report-period-note">{t("Order activity uses the selected period; inventory stock shows the current balance.")}</p>

        {/* ================= PRODUCT STATS ================= */}
        <h3 style={{ marginTop: 10, marginBottom: 8 }}>
          <i className="fas fa-boxes" style={{ color: "var(--accent)" }}></i>{" "}
          {t("Product Overview")}
        </h3>

        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-box"></i>
            <h2>{totalProducts}</h2>
            <p>{t("Total Products")}</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>{lowStock}</h2>
            <p>{t("Low Stock")}</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-times-circle"></i>
            <h2>{outOfStock}</h2>
            <p>{t("Out of Stock")}</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-coins"></i>
            <h2>{money(totalValue)}</h2>
            <p>{t("Total Value")}</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-heartbeat"></i>
            <h2>{stockHealth}%</h2>
            <p>{t("Stock Health")}</p>
          </div>
        </div>

        {/* PRODUCT CHARTS */}
        <div className="stats-grid dashboard-charts">
          <div className="table-card dashboard-chart-card">
            <h3>
              <i className="fas fa-chart-bar"></i> {t("Stock Levels")}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 12, right: 8, left: -18, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
                  tickFormatter={(name) => name.length > 11 ? `${name.slice(0, 10)}…` : name}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--chart-hover)" }}
                  contentStyle={{
                    background: "var(--chart-tooltip)",
                    border: "1px solid var(--chart-grid)",
                    borderRadius: 12,
                    color: "var(--text)",
                  }}
                />
                <Bar dataKey="stock" name={t("Stock")} fill="var(--accent)" radius={[7, 7, 2, 2]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-card dashboard-chart-card">
            <h3>
              <i className="fas fa-chart-pie"></i> {t("Stock Distribution")}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={4} stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--chart-tooltip)", border: "1px solid var(--chart-grid)", borderRadius: 12, color: "var(--text)" }} />
                <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12, color: "var(--chart-muted)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PRODUCT TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-table"></i> {t("Product Report")}
          </h3>
          <table>
            <thead>
              <tr>
                <th>
                  <i className="fas fa-box"></i> {t("Product")}
                </th>
                <th>
                  <i className="fas fa-layer-group"></i> {t("Stock")}
                </th>
                <th>
                  <i className="fas fa-tag"></i> {t("Price")}
                </th>
                <th>
                  <i className="fas fa-coins"></i> {t("Value")}
                </th>
                <th>
                  <i className="fas fa-info-circle"></i> {t("Status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    {t("No products found")}
                  </td>
                </tr>
              ) : (
                productPagination.pageItems.map((p) => {
                  const stock = Number(p.totalStock || 0);
                  const price = Number(p.pricePerUnit || 0);
                  return (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{stock}</td>
                      <td>{money(price)}</td>
                      <td>{money(price * stock)}</td>
                      <td>
                        {stock === 0 ? (
                          <span style={{ color: "#ef4444" }}>
                            <i className="fas fa-times"></i> {t("Out")}
                          </span>
                        ) : stock <= 5 ? (
                          <span style={{ color: "#f59e0b" }}>
                            <i className="fas fa-exclamation"></i> {t("Low")}
                          </span>
                        ) : (
                          <span style={{ color: "#22c55e" }}>
                            <i className="fas fa-check"></i> {t("Available")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={products.length}
            page={productPagination.page}
            pageCount={productPagination.pageCount}
            pageSize={productPagination.pageSize}
            onPageChange={productPagination.setPage}
            t={t}
          />
        </div>

        {/* ================= ORDERS REPORT ================= */}
        <h3 style={{ marginTop: 28, marginBottom: 8 }}>
          <i className="fas fa-shopping-cart" style={{ color: "var(--accent)" }}></i>{" "}
          {t("Orders Report")}
        </h3>

        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-shopping-cart"></i>
            <h2>{totalOrders}</h2>
            <p>{t("Total Orders")}</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-clock"></i>
            <h2>{pendingOrders}</h2>
            <p>{t("Pending")}</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-check-circle"></i>
            <h2>{completedOrders}</h2>
            <p>{t("Completed")}</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-exclamation-circle"></i>
            <h2>{unpaidOrders}</h2>
            <p>{t("Unpaid")}</p>
          </div>
          <div className="stat-card">
            <i className="fas fa-money-bill-wave"></i>
            <h2>{money(orderRevenue)}</h2>
            <p>{t("Revenue")}</p>
          </div>
        </div>

        {/* ORDER CHARTS */}
        <div className="stats-grid dashboard-charts">
          <div className="table-card dashboard-chart-card">
            <h3>
              <i className="fas fa-chart-bar"></i> {t("Order Status Overview")}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orderBarData} margin={{ top: 12, right: 8, left: -18, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--chart-hover)" }}
                  contentStyle={{
                    background: "var(--chart-tooltip)",
                    border: "1px solid var(--chart-grid)",
                    borderRadius: 12,
                    color: "var(--text)",
                  }}
                />
                <Bar dataKey="value" name={t("Orders")} fill="var(--accent)" radius={[7, 7, 2, 2]} maxBarSize={54} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-card dashboard-chart-card">
            <h3>
              <i className="fas fa-chart-pie"></i> {t("Order Distribution")}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderPieData}
                  dataKey="value"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={4}
                  stroke="none"
                >
                  {orderPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--chart-tooltip)", border: "1px solid var(--chart-grid)", borderRadius: 12, color: "var(--text)" }} />
                <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12, color: "var(--chart-muted)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ORDER TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-receipt"></i> {t("Order Details")}
          </h3>
          <table>
            <thead>
              <tr>
                <th>{t("Customer")}</th>
                <th>{t("Product")}</th>
                <th>{t("Quantity")}</th>
                <th>{t("Total")}</th>
                <th>{t("Status")}</th>
                <th>{t("Payment")}</th>
              </tr>
            </thead>
            <tbody>
              {reportOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    {t("No orders found")}
                  </td>
                </tr>
              ) : (
                orderPagination.pageItems.map((o) => (
                  <tr key={o._id}>
                    <td>{getCustomerName(o)}</td>
                    <td>{getProductName(o)}</td>
                    <td>{o.quantity || 0}</td>
                    <td>{money(o.total || 0)}</td>
                    <td>
                      <span
                        style={{
                          color:
                            o.status === "Completed" ? "#22c55e" : "#f59e0b",
                          fontWeight: 600,
                        }}
                      >
                        {t(o.status || "Pending")}
                      </span>
                    </td>
                    <td>{t(o.payment || "Unpaid")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={reportOrders.length}
            page={orderPagination.page}
            pageCount={orderPagination.pageCount}
            pageSize={orderPagination.pageSize}
            onPageChange={orderPagination.setPage}
            t={t}
          />
        </div>

        {/* PRINTABLE LEDGER (products + orders) */}
        <div id="ledger-print" style={{ display: "none" }}>
          <h1>INVENT — {t("Inventory Reports")} ({t(reportPeriod[0].toUpperCase() + reportPeriod.slice(1))})</h1>
          <h2>{formatDateTime(new Date(), settings)}</h2>

          {printSections.summary && (
          <div className="section-title">
            <strong>Product Summary</strong>
          </div>
          )}
          {printSections.summary && (
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
              <strong>Total Value:</strong> {money(totalValue)}
            </div>
          </div>
          )}

          {printSections.products && (
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
                    <td>{money(price)}</td>
                    <td>{money(price * stock)}</td>
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
          )}

          {printSections.summary && (
          <div className="section-title">
            <strong>Orders Summary</strong>
          </div>
          )}
          {printSections.summary && (
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
              <strong>Revenue:</strong> {money(orderRevenue)}
            </div>
            <div>
              <strong>All Orders Value:</strong>{" "}
              {money(allOrdersValue)}
            </div>
          </div>
          )}

          {printSections.orders && (
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
              {reportOrders.length === 0 ? (
                <tr>
                  <td colSpan="7">No orders found</td>
                </tr>
              ) : (
                reportOrders.map((o, i) => (
                  <tr key={o._id}>
                    <td>{i + 1}</td>
                    <td>{getCustomerName(o)}</td>
                    <td>{getProductName(o)}</td>
                    <td>{o.quantity || o.lineItems?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}</td>
                    <td>{money(o.total || 0)}</td>
                    <td>{o.status || "Pending"}</td>
                    <td>{o.payment || "Unpaid"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}

          <div className="footer">
            <p>Generated by INVENT Inventory Management System</p>
            <p>Authorized Signature: ____________________</p>
          </div>
        </div>
      </main>
    </div>
  );
}
