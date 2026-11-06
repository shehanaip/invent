import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
import ThemeToggle from "../components/ThemeToggle";
import API from "../api";
import { usePreferences } from "../context/usePreferences";
import { formatCurrency } from "../utils/preferences";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard({ dark, setDark }) {
  const navigate = useNavigate();
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);

  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);



  // 🪟 MODAL STATES
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [useQR, setUseQR] = useState(false);

  const token = localStorage.getItem("token");

  // FETCH PRODUCTS
const fetchProducts = async () => {
  try {
    const res = await API.get("/products");
    setProducts(res.data || []);
  } catch (err) {
    console.log(err);
    setProducts([]);
  }
};
const fetchOrders = async () => {
  try {
    const res = await API.get("/orders");
    setOrders(res.data || []);
  } catch (err) {
    console.log(err);
    setOrders([]);
  }
};


  const resetForm = () => {
    setName("");
    setStock("");
    setPrice("");
    setSku("");
    setCategory("");
    setBarcode("");
    setDescription("");
    setUseQR(false);
    setShowModal(false);
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  };

  // 🔄 LOAD
  useEffect(() => {
    const load = async () => {
      await Promise.all([
  fetchProducts(),
  fetchOrders()
]);
      setLoading(false);
    };
    load();
  }, []);

  const lowStockCount = products.filter((p) => p.totalStock <= 5).length;
  const revenue = orders
  .filter((o) => o.status === "Completed")
  .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const stockChartData = products.slice(0, 6).map((product) => ({
    name: product.name,
    stock: Number(product.totalStock || 0),
  }));
  const healthyProducts = products.filter((product) => product.totalStock > 5).length;
  const lowStockProducts = products.filter(
    (product) => product.totalStock > 0 && product.totalStock <= 5
  ).length;
  const outOfStockProducts = products.filter(
    (product) => product.totalStock === 0
  ).length;
  const stockDistributionData = [
    { name: "Healthy", value: healthyProducts, color: "#22c55e" },
    { name: "Low Stock", value: lowStockProducts, color: "#f59e0b" },
    { name: "Out of Stock", value: outOfStockProducts, color: "#ef4444" },
  ];
  const productPagination = usePagination(products);

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>INVENT</h1>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>

      {/* 🍔 HAMBURGER */}
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
  logout={logout}
/>

      {/* MAIN */}
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-warehouse"></i> {t("Inventory Dashboard")}
          </h1>

          <div className="actions">

            <ThemeToggle dark={dark} setDark={setDark} t={t} />



          </div>
        </div>
        {/* graph */}
        {/* ================= GRAPHS ================= */}
<div className="stats-grid dashboard-charts">

  {/* BAR CHART */}
  <div className="table-card dashboard-chart-card">
    <div className="dashboard-chart-heading">
      <div>
        <h3><i className="fas fa-chart-bar"></i> {t("Stock Overview")}</h3>
        <p>Units available across your top products</p>
      </div>
      <span className="dashboard-chart-badge">{products.length} products</span>
    </div>

    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={stockChartData}
        margin={{ top: 12, right: 8, left: -18, bottom: 8 }}
      >
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
          tickFormatter={(name) => name.length > 11 ? `${name.slice(0, 10)}…` : name}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={68}
          tickMargin={12}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "var(--chart-hover)" }}
          contentStyle={{
            background: "var(--chart-tooltip)",
            border: "1px solid var(--chart-grid)",
            borderRadius: 12,
            color: "var(--text)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
          }}
          labelStyle={{ color: "var(--text)", fontWeight: 700 }}
          itemStyle={{ color: "var(--accent)" }}
        />
        <Bar dataKey="stock" name="Units in stock" fill="var(--accent)" radius={[7, 7, 2, 2]} maxBarSize={42} />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* PIE CHART */}
  <div className="table-card dashboard-chart-card">
    <div className="dashboard-chart-heading">
      <div>
        <h3><i className="fas fa-chart-pie"></i> {t("Stock Distribution")}</h3>
        <p>Product health at a glance</p>
      </div>
      <span className="dashboard-chart-badge">Inventory health</span>
    </div>

    <div className="dashboard-donut-wrap">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
        <Pie
          data={stockDistributionData}
          dataKey="value"
          innerRadius={62}
          outerRadius={86}
          paddingAngle={4}
          stroke="none"
        >
          {stockDistributionData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--chart-tooltip)",
            border: "1px solid var(--chart-grid)",
            borderRadius: 12,
            color: "var(--text)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
          }}
          itemStyle={{ color: "var(--text)" }}
        />
        </PieChart>
      </ResponsiveContainer>
      <div className="dashboard-donut-center">
        <strong>{products.length}</strong>
        <span>Products</span>
      </div>
    </div>
    <div className="dashboard-chart-legend">
      {stockDistributionData.map((entry) => (
        <div className="dashboard-legend-item" key={entry.name}>
          <span className="dashboard-legend-dot" style={{ background: entry.color }} />
          <span>{t(entry.name)}</span>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  </div>

</div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <i className="fas fa-box"></i>
            <h2>{products.length}</h2>
            <p>{t("Products")}</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>{lowStockCount}</h2>
            <p>{t("Low Stock")}</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-dollar-sign"></i>
            <h2>{money(revenue)}</h2>
            <p>{t("Revenue")}</p>
          </div>

        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-table"></i> {t("Product Inventory")}
          </h3>

          <table>
            <thead>
              <tr>
                <th>{t("Product")}</th>
                <th>{t("Stock")}</th>
                <th>{t("Status")}</th>
              </tr>
            </thead>

            <tbody>
              {productPagination.pageItems.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.totalStock}</td>
                  <td>
                    {p.totalStock <= 5 ? (
                      <span style={{ color: "var(--accent)" }}>
                        ⚠ {t("Low Stock")}
                      </span>
                    ) : (
                      <span style={{ color: "#22c55e" }}>
                        ✔ {t("Available")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
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

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">

              <h2><i className="fas fa-plus"></i> {t("Add Product")}</h2>

              <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
              <input placeholder="Stock" type="number" value={stock} onChange={(e)=>setStock(e.target.value)} />
              <input placeholder="Price" type="number" value={price} onChange={(e)=>setPrice(e.target.value)} />
              <input placeholder="SKU" value={sku} onChange={(e)=>setSku(e.target.value)} />
              <input placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} />
              <input placeholder="Barcode" value={barcode} onChange={(e)=>setBarcode(e.target.value)} />
              <textarea placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />

              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={useQR}
                  onChange={() => setUseQR(!useQR)}
                />
                Enable QR Code
              </label>

              <div className="modal-actions">
                <button className="save-btn" onClick={addProduct}>
                  Save
                </button>

                <button className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}