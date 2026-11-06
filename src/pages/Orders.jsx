import { useEffect, useState, useMemo } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
import AppSelect from "../components/AppSelect";
import { usePreferences } from "../context/usePreferences";
import { formatCurrency, formatDate } from "../utils/preferences";
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

export default function Orders({ dark, setDark }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [barcodeScan, setBarcodeScan] = useState("");
  const [barcodeError, setBarcodeError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    customer: "",
    email: "",
    phone: "",
    lineItems: [{ productId: "", barcode: "", quantity: "1" }],
    storeId: "",
    status: "Pending",
    payment: "Unpaid",
    total: "",
    taxRate: Number(settings.tax) || 0,
  });

  // ================= FETCH =================
  const fetchProducts = async () => {
    try {
      const res = await API.get("/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await API.get("/stores");
      setStores(res.data || []);
    } catch (err) {
      console.error("STORES FETCH:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch (err) {
      console.log(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchStores();
  }, []);

  // ================= SEARCH (same idea as Products) =================
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      const customer = (
        o.customer?.name ||
        o.customer ||
        ""
      )
        .toString()
        .toLowerCase();
      const product = [
        o.productId?.name,
        ...(o.lineItems || []).map((item) => item.productId?.name),
        ...(o.lineItems || []).map((item) => item.barcode),
      ].filter(Boolean).join(" ").toLowerCase();
      const status = (o.status || "").toString().toLowerCase();
      const payment = (o.payment || "").toString().toLowerCase();
      const email = (o.email || "").toString().toLowerCase();
      const phone = (o.phone || "").toString().toLowerCase();
      const total = String(o.total || "");

      return (
        customer.includes(q) ||
        product.includes(q) ||
        status.includes(q) ||
        payment.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        total.includes(q)
      );
    });
  }, [orders, search]);
  const orderPagination = usePagination(filteredOrders);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const calculateTotal = (lineItems) => lineItems.reduce((sum, item) => {
    const product = products.find((entry) => entry._id === item.productId);
    if (!product) return sum;
    const taxRate = product.tax == null || product.tax === ""
      ? Number(settings.tax) || 0
      : Number(product.tax);
    return sum + Number(product.pricePerUnit || 0) * Number(item.quantity || 0) *
      (1 + taxRate / 100);
  }, 0);

  const updateLineItem = (index, changes) => {
    setForm((current) => {
      const lineItems = current.lineItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item
      );
      return { ...current, lineItems, total: calculateTotal(lineItems) };
    });
  };

  const addBarcodeToOrder = (rawBarcode) => {
    const barcode = rawBarcode.trim();
    if (!barcode) return;
    const product = products.find((entry) =>
      [entry.barcode, ...(entry.barcodes || [])].filter(Boolean).includes(barcode)
    );
    if (!product) {
      setBarcodeError(t("No product matches this barcode."));
      return;
    }
    setBarcodeError("");
    setForm((current) => {
      const existingIndex = current.lineItems.findIndex(
        (item) => item.productId === product._id && item.barcode === barcode
      );
      const lineItems = existingIndex >= 0
        ? current.lineItems.map((item, index) => index === existingIndex
            ? { ...item, quantity: String(Number(item.quantity || 0) + 1) }
            : item)
        : [...current.lineItems, {
            productId: product._id,
            barcode,
            quantity: "1",
          }].filter((item) => item.productId);
      return { ...current, lineItems, total: calculateTotal(lineItems) };
    });
    setBarcodeScan("");
  };

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      customer: "",
      email: "",
      phone: "",
      lineItems: [{ productId: "", barcode: "", quantity: "1" }],
      storeId: "",
      status: "Pending",
      payment: "Unpaid",
      total: "",
      taxRate: Number(settings.tax) || 0,
    });
    setEditMode(false);
    setEditId(null);
    setShowModal(false);
    setBarcodeScan("");
    setBarcodeError("");
  };

  // ================= ADD =================
  const addOrder = async () => {
    try {
      const lineItems = form.lineItems.filter((item) => item.productId && Number(item.quantity) > 0);
      const payload = {
        ...form,
        lineItems,
        productId: lineItems[0]?.productId,
        quantity: lineItems.reduce((sum, item) => sum + Number(item.quantity), 0),
        total: calculateTotal(lineItems),
        taxRate: Number(settings.tax) || 0,
      };
      await API.post("/orders", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      resetForm();
      fetchOrders();
      fetchProducts();
      window.dispatchEvent(new Event("refresh-customers"));
    } catch (err) {
      console.error(err);
      window.alert(err.response?.data?.msg || t("Unable to create order."));
    }
  };

  // ================= UPDATE =================
  const updateOrder = async () => {
    try {
      const lineItems = form.lineItems.filter((item) => item.productId && Number(item.quantity) > 0);
      const payload = {
        ...form,
        lineItems,
        productId: lineItems[0]?.productId,
        quantity: lineItems.reduce((sum, item) => sum + Number(item.quantity), 0),
        total: calculateTotal(lineItems),
        taxRate: Number(settings.tax) || 0,
      };
      await API.put(`/orders/${editId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      resetForm();
      fetchOrders();
      fetchProducts();
    } catch (err) {
      console.error(err);
      window.alert(err.response?.data?.msg || t("Unable to update order."));
    }
  };

  // ================= DELETE =================
  const deleteOrder = async (id) => {
    try {
      await API.delete(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
      fetchProducts();
    } catch (err) {
      console.error(err);
      window.alert(err.response?.data?.msg || t("Unable to delete order."));
    }
  };

  // ================= EDIT =================
  const startEdit = (o) => {
    setEditMode(true);
    setShowModal(true);
    setEditId(o._id);
    setForm({
      customer: o.customer || "",
      email: o.email || "",
      phone: o.phone || "",
      lineItems: o.lineItems?.length
        ? o.lineItems.map((item) => ({
            productId: item.productId?._id || item.productId,
            barcode: item.barcode || "",
            quantity: String(item.quantity || 1),
          }))
        : [{
            productId: o.productId?._id || o.productId || "",
            barcode: o.barcode || "",
            quantity: String(o.quantity || 1),
          }],
      storeId: o.storeId?._id || o.storeId || "",
      status: o.status || "Pending",
      payment: o.payment || "Unpaid",
      total: o.total || "",
      taxRate: Number(o.taxRate ?? settings.tax) || 0,
    });
  };

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Orders")}</h1>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const completedOrders = orders.filter(
    (o) => o.status === "Completed"
  ).length;

  const revenue = orders
    .filter((o) => o.status === "Completed")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // ================= PRINT BILL =================
  const printInvoice = (order) => {
    const lines = order.lineItems?.length
      ? order.lineItems
      : [{ productId: order.productId, quantity: order.quantity }];
    const invoiceLines = lines.map((item) => {
      const productId = item.productId?._id || item.productId;
      const product = products.find((entry) => entry._id === productId) || item.productId;
      const price = Number(item.unitPrice || product?.pricePerUnit || product?.price || 0);
      const quantity = Number(item.quantity || 0);
      return {
        product,
        barcode: item.barcode || "",
        quantity,
        price,
        subtotal: price * quantity,
      };
    });
    const subtotal = invoiceLines.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = Number(order.total || 0) - subtotal;

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <style>
          body { font-family: Arial; padding: 40px; color: #222; }
          .invoice-box { max-width: 800px; margin: auto; border: 1px solid #ddd; padding: 30px; }
          h1 { text-align: center; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          table th, table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f4f4f4; }
          .total { text-align: right; margin-top: 20px; font-size: 22px; font-weight: bold; }
          .footer { text-align: center; margin-top: 50px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <h1>INVENT BILLING LEDGER</h1>
          <div class="info">
            <p><strong>Customer:</strong> ${
              order.customer?.name || order.customer || ""
            }</p>
            <p><strong>Email:</strong> ${order.email || "-"}</p>
            <p><strong>Phone:</strong> ${order.phone || "-"}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment:</strong> ${order.payment}</p>
            <p><strong>${t("Date")}:</strong> ${formatDate(new Date(), settings)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceLines.map((item) => `
                <tr>
                  <td>${item.product?.name || "Unknown Product"}${item.barcode ? ` <small>(${item.barcode})</small>` : ""}</td>
                  <td>${item.quantity}</td>
                  <td>${money(item.price)}</td>
                  <td>${money(item.subtotal)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          ${
            taxAmount !== 0
              ? `<div class="info"><p>${t("Subtotal")}: ${money(subtotal)}</p><p>${t("Tax")}: ${money(taxAmount)}</p></div>`
              : ""
          }
          <div class="total">${t("Grand Total")}: ${money(order.total || 0)}</div>
          <div class="footer">Thank you for your business</div>
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>
      {/* SIDEBAR */}
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <Sidebar
        menuOpen={menuOpen}
        dark={dark}
        setDark={setDark}
        active="orders"
      />

      <main className="main-content orders-page modern-data-page">
        {/* TOPBAR — same layout as Products */}
        <div className="topbar">
          <h1>
            <i className="fas fa-box"></i> {t("Orders")}
          </h1>

          <div className="actions">
            <input
              className="search-input"
              placeholder={t("Search orders...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                orderPagination.setPage(1);
              }}
            />

            <button className="add-btn" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus"></i> {t("New Order")}
            </button>
          </div>
        </div>

        {/* ================= GRAPH ================= */}
        <div className="stats-grid dashboard-charts orders-charts">
          <div className="table-card dashboard-chart-card">
            <div className="dashboard-chart-heading">
              <div>
                <h3><i className="fas fa-chart-bar"></i> {t("Orders Status")}</h3>
                <p>{t("Pending and completed order counts")}</p>
              </div>
              <span className="dashboard-chart-badge">{orders.length} orders</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { name: "Pending", value: pendingOrders },
                  { name: "Completed", value: completedOrders },
                ]}
                margin={{ top: 12, right: 8, left: -18, bottom: 4 }}
              >
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
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
            <div className="dashboard-chart-heading">
              <div>
                <h3><i className="fas fa-chart-pie"></i> {t("Completed Revenue")}</h3>
                <p>{t("Revenue from completed orders")}</p>
              </div>
            </div>
            <div className="dashboard-donut-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Revenue", value: revenue || 0 },
                      { name: "No revenue", value: revenue ? 0 : 1 },
                    ]}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={86}
                    paddingAngle={4}
                    stroke="none"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="var(--chart-grid)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--chart-tooltip)",
                      border: "1px solid var(--chart-grid)",
                      borderRadius: 12,
                      color: "var(--text)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="dashboard-donut-center">
                <strong>{money(revenue)}</strong>
                <span>{t("Revenue")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid orders-stats">
          <div className="stat-card modern-stat-card">
            <span className="modern-stat-icon"><i className="fas fa-receipt" aria-hidden="true"></i></span>
            <h2>{orders.length}</h2>
            <p>{t("Total Orders")}</p>
          </div>
          <div className="stat-card modern-stat-card transit-stat">
            <span className="modern-stat-icon"><i className="fas fa-clock" aria-hidden="true"></i></span>
            <h2>{pendingOrders}</h2>
            <p>{t("Pending")}</p>
          </div>
          <div className="stat-card modern-stat-card income-stat">
            <span className="modern-stat-icon"><i className="fas fa-circle-check" aria-hidden="true"></i></span>
            <h2>{completedOrders}</h2>
            <p>{t("Completed")}</p>
          </div>
          <div className="stat-card modern-stat-card balance-stat">
            <span className="modern-stat-icon"><i className="fas fa-filter" aria-hidden="true"></i></span>
            <h2>{filteredOrders.length}</h2>
            <p>{search ? t("Search Results") : t("Showing")}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card responsive-card-table">
          <div className="modern-table-heading">
            <div>
              <h3>{t("Order Management")}</h3>
              <p>{t("Review order details, payment, and fulfillment status.")}</p>
            </div>
            <span className="modern-table-count">{filteredOrders.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>{t("Customer")}</th>
                <th>{t("Product")}</th>
                <th>{t("Quantity")}</th>
                <th>{t("Total")}</th>
                <th>{t("Status")}</th>
                <th>{t("Payment")}</th>
                <th>{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="modern-empty-cell" style={{ textAlign: "center", padding: "28px" }}>
                    {search
                      ? `${t("No orders found for")} "${search}"`
                      : t("No orders yet")}
                  </td>
                </tr>
              ) : (
                orderPagination.pageItems.map((o) => (
                  <tr key={o._id}>
                    <td data-label={t("Customer")} className="order-customer-cell">
                      <strong>{o.customer?.name || o.customer || "Unknown"}</strong>
                      {o.email && <span>{o.email}</span>}
                    </td>
                    <td data-label={t("Product")} className="order-product-cell">
                      {o.lineItems?.length
                        ? o.lineItems.map((item) => `${item.productId?.name || "Unknown"}${item.barcode ? ` · ${item.barcode}` : ""}`).join(", ")
                        : o.productId?.name || "Unknown"}
                    </td>
                    <td data-label={t("Quantity")}>
                      {o.lineItems?.length
                        ? o.lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                        : o.quantity}
                    </td>
                    <td data-label={t("Total")} className="modern-amount-cell">{money(o.total || 0)}</td>
                    <td data-label={t("Status")}>
                      <span className={`modern-status-pill ${o.status === "Completed" ? "positive" : o.status === "Pending" ? "warning" : "negative"}`}>
                        {t(o.status)}
                      </span>
                    </td>
                    <td data-label={t("Payment")}>
                      <span className={`modern-status-pill ${o.payment === "Paid" ? "positive" : "warning"}`}>
                        {t(o.payment)}
                      </span>
                    </td>
                    <td className="order-actions-cell" data-label={t("Action")}>
                      <button
                        className="edit-btn"
                        onClick={() => startEdit(o)}
                        aria-label={`${t("Edit")} ${t("Order")}`}
                        title={t("Edit")}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteOrder(o._id)}
                        aria-label={`${t("Delete")} ${t("Order")}`}
                        title={t("Delete")}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <button
                        className="print-btn"
                        onClick={() => printInvoice(o)}
                        aria-label={t("Print")}
                        title={t("Print")}
                      >
                        <i className="fas fa-print"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={filteredOrders.length}
            page={orderPagination.page}
            pageCount={orderPagination.pageCount}
            pageSize={orderPagination.pageSize}
            onPageChange={orderPagination.setPage}
            t={t}
          />
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay order-modal-overlay">
            <div className="modal-box large order-form-modal" role="dialog" aria-modal="true" aria-labelledby="order-form-title">
              <div className="form-modal-header">
                <div>
                  <span className="form-modal-kicker">{t("Order Management")}</span>
                  <h2 id="order-form-title">{editMode ? `${t("Edit")} ${t("Order")}` : `${t("Add")} ${t("Order")}`}</h2>
                  <p>{t("Add customer and item details to create this order.")}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={resetForm} aria-label={t("Close")}>
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>

              <div className="order-form-grid">
                <label className="modal-field" htmlFor="order-customer">
                  <span>{t("Customer Name")}</span>
                  <input id="order-customer" name="customer" placeholder={t("Customer Name")} value={form.customer} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="order-email">
                  <span>{t("Customer Email")}</span>
                  <input id="order-email" type="email" name="email" placeholder={t("Customer Email")} value={form.email} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="order-phone">
                  <span>{t("Customer Phone")}</span>
                  <input id="order-phone" type="tel" name="phone" placeholder={t("Customer Phone")} value={form.phone} onChange={handleChange}/>
                </label>
                <label className="modal-field order-field-wide" htmlFor="order-store">
                  <span>{t("Store / Branch")}</span>
                  <AppSelect id="order-store" name="storeId" value={form.storeId} onChange={handleChange}>
                    <option value="">{stores.length ? t("Select store or branch") : t("General inventory")}</option>
                    {stores.map((store) => (
                      <option key={store._id} value={store._id}>
                        {store.groupName ? `${store.groupName} / ` : ""}{store.name}
                      </option>
                    ))}
                  </AppSelect>
                  {products.some((product) => product.stockByStore?.length) && !form.storeId && (
                    <small className="form-field-hint">{t("Select a branch to sell products assigned to branch stock.")}</small>
                  )}
                </label>

                <div className="order-field-wide barcode-scan-field">
                  <label className="modal-field" htmlFor="order-barcode-scan">
                    <span>{t("Scan or enter barcode")}</span>
                    <div className="barcode-scan-row">
                      <input
                        id="order-barcode-scan"
                        value={barcodeScan}
                        placeholder={t("Scan or enter barcode")}
                        onChange={(e) => setBarcodeScan(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addBarcodeToOrder(barcodeScan);
                          }
                        }}
                      />
                      <button type="button" className="secondary-btn" onClick={() => addBarcodeToOrder(barcodeScan)}>
                        <i className="fas fa-barcode" aria-hidden="true"></i> {t("Add")}
                      </button>
                    </div>
                  </label>
                  {barcodeError && <p className="form-field-error" role="alert">{barcodeError}</p>}
                </div>

                <div className="order-field-wide order-line-items">
                  <div className="order-line-items-heading">
                    <strong>{t("Order items")}</strong>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setForm((current) => ({
                        ...current,
                        lineItems: [...current.lineItems, { productId: "", barcode: "", quantity: "1" }],
                      }))}
                    >
                      <i className="fas fa-plus" aria-hidden="true"></i> {t("Add item")}
                    </button>
                  </div>
                  {form.lineItems.map((item, index) => {
                    const selectedProduct = products.find((product) => product._id === item.productId);
                    return (
                      <div className="order-line-item" key={`order-item-${index}`}>
                        <label className="modal-field">
                          <span>{t("Product")}</span>
                          <AppSelect
                            value={item.productId}
                            ariaLabel={t("Product")}
                            onChange={({ target }) => {
                              const product = products.find((entry) => entry._id === target.value);
                              updateLineItem(index, {
                                productId: target.value,
                                barcode: product?.barcodes?.[0] || product?.barcode || "",
                              });
                            }}
                          >
                            <option value="">{t("Select Product")}</option>
                            {products.map((product) => {
                              const branchStock = product.stockByStore?.find(
                                (entry) => (entry.storeId?._id || entry.storeId) === form.storeId
                              );
                              const available = form.storeId
                                ? branchStock?.stock ?? 0
                                : product.totalStock;
                              return (
                                <option key={product._id} value={product._id}>
                                  {product.name} ({t("Stock")}: {available})
                                </option>
                              );
                            })}
                          </AppSelect>
                        </label>
                        <label className="modal-field">
                          <span>{t("Barcode")}</span>
                          <input
                            value={item.barcode}
                            placeholder={t("Barcode")}
                            onChange={(e) => updateLineItem(index, { barcode: e.target.value })}
                            onBlur={(e) => {
                              const barcode = e.target.value.trim();
                              if (!barcode) return;
                              const product = products.find((entry) =>
                                [entry.barcode, ...(entry.barcodes || [])].filter(Boolean).includes(barcode)
                              );
                              if (product) {
                                updateLineItem(index, { productId: product._id, barcode });
                                setBarcodeError("");
                              } else {
                                setBarcodeError(t("No product matches this barcode."));
                              }
                            }}
                          />
                        </label>
                        <label className="modal-field">
                          <span>{t("Quantity")}</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, { quantity: e.target.value })}
                          />
                        </label>
                        <button
                          type="button"
                          className="delete-btn order-line-remove"
                          aria-label={t("Remove item")}
                          onClick={() => setForm((current) => {
                            const lineItems = current.lineItems.filter((_, itemIndex) => itemIndex !== index);
                            const safeItems = lineItems.length ? lineItems : [{ productId: "", barcode: "", quantity: "1" }];
                            return { ...current, lineItems: safeItems, total: calculateTotal(safeItems) };
                          })}
                        >
                          <i className="fas fa-trash" aria-hidden="true"></i>
                        </button>
                        {selectedProduct && (
                          <small className="order-line-price">
                            {money(selectedProduct.pricePerUnit)} / {selectedProduct.unitType || t("unit")}
                          </small>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="order-total-summary order-field-wide">
                  <div>
                    <span>{t("Order Total")}</span>
                    <strong>{money(calculateTotal(form.lineItems))}</strong>
                  </div>
                  <p>{t("Tax")} ({form.taxRate || 0}%): {t("included in total")}</p>
                </div>

                <div className="order-toggle-field">
                  <span className="order-toggle-label">{t("Status")}</span>
                  <label className="form-toggle-row">
                    <span>{t(form.status)}</span>
                    <input
                      id="order-status"
                      type="checkbox"
                      checked={form.status === "Completed"}
                      aria-label={t("Status")}
                      onChange={() => setForm((current) => ({
                        ...current,
                        status: current.status === "Completed" ? "Pending" : "Completed",
                      }))}
                    />
                    <span className="form-toggle-track" aria-hidden="true"></span>
                  </label>
                </div>
                <div className="order-toggle-field">
                  <span className="order-toggle-label">{t("Payment")}</span>
                  <label className="form-toggle-row">
                    <span>{t(form.payment)}</span>
                    <input
                      id="order-payment"
                      type="checkbox"
                      checked={form.payment === "Paid"}
                      aria-label={t("Payment")}
                      onChange={() => setForm((current) => ({
                        ...current,
                        payment: current.payment === "Paid" ? "Unpaid" : "Paid",
                      }))}
                    />
                    <span className="form-toggle-track" aria-hidden="true"></span>
                  </label>
                </div>
              </div>

              <div className="modal-actions order-form-actions">
                <button
                  className="save-btn"
                  onClick={editMode ? updateOrder : addOrder}
                >
                  <i className={`fas ${editMode ? "fa-check" : "fa-plus"}`} aria-hidden="true"></i>
                  {editMode ? t("Update") : t("Save")}
                </button>
                <button className="cancel-btn" onClick={resetForm}>
                  {t("Cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
