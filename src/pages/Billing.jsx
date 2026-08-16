import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";

export default function Billing({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    customer: "",
    amount: "",
    gateway: "SSLCommerz",
    type: "Incoming",
    reason: "",
    isCustomer: true,
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchPayments = async () => {
    try {
      const res = await API.get("/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPayments();

    // After SSL redirect back
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      alert("Payment successful!");
      window.history.replaceState({}, "", "/billing");
      fetchPayments();
    } else if (params.get("paid") === "0") {
      alert("Payment failed or cancelled.");
      window.history.replaceState({}, "", "/billing");
      fetchPayments();
    }
  }, []);

  // ================= ADD / PAY =================
  const addPayment = async () => {
    if (!form.customer.trim()) {
      alert("Enter the person / customer name");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }
    if (!form.reason.trim()) {
      alert("Enter the reason for this payment");
      return;
    }

    try {
      setSaving(true);

      const res = await API.post(
        "/payments",
        {
          customer: form.customer.trim(),
          payeeName: form.customer.trim(),
          amount: Number(form.amount),
          gateway: form.gateway,
          type: form.type,
          reason: form.reason.trim(),
          isCustomer: !!form.isCustomer,
          paymentDate: form.paymentDate || new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const redirectUrl = res.data?.redirectUrl;

      // SSLCommerz Incoming → open gateway
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      // Record-only (Outgoing / other gateways)
      setShowModal(false);
      setForm({
        customer: "",
        amount: "",
        gateway: "SSLCommerz",
        type: "Incoming",
        reason: "",
        isCustomer: true,
        paymentDate: new Date().toISOString().slice(0, 10),
      });
      fetchPayments();
      alert("Payment recorded successfully");
    } catch (err) {
      console.log(err);
      alert(
        err?.response?.data?.msg ||
          "Payment failed. Check SSLCommerz / server logs."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= STATS =================
  const totalTransactions = payments.length;
  const incoming = payments
    .filter((p) => p.type === "Incoming" && p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outgoing = payments
    .filter((p) => p.type === "Outgoing" && p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const filtered = payments.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.customer || "").toLowerCase().includes(q) ||
      (p.payeeName || "").toLowerCase().includes(q) ||
      (p.reason || "").toLowerCase().includes(q) ||
      (p.gateway || "").toLowerCase().includes(q) ||
      (p.status || "").toLowerCase().includes(q) ||
      (p.transactionId || "").toLowerCase().includes(q)
    );
  });

  const statusColor = (s) => {
    if (s === "Paid") return "#22c55e";
    if (s === "Pending") return "#f59e0b";
    if (s === "Failed" || s === "Cancelled") return "#ef4444";
    return "#888";
  };

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>
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
        logout={logout}
        active="billing"
      />

      <main className="main-content">
        <div className="topbar">
          <h1>
            <i className="fas fa-credit-card"></i> Billing Center
          </h1>

          <div className="actions">
            <input
              className="search-input"
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="add-btn" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus"></i> New Payment
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h2>{totalTransactions}</h2>
            <p>Total Transactions</p>
          </div>
          <div className="stat-card">
            <h2>৳{incoming.toLocaleString()}</h2>
            <p>Incoming (Paid)</p>
          </div>
          <div className="stat-card">
            <h2>৳{outgoing.toLocaleString()}</h2>
            <p>Outgoing (Paid)</p>
          </div>
          <div className="stat-card">
            <h2>৳{(incoming - outgoing).toLocaleString()}</h2>
            <p>Net Balance</p>
          </div>
        </div>

        <div className="table-card">
          <h3>Payment Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Txn ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No payments found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.customer || p.payeeName || "-"}
                      {p.isCustomer ? (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            color: "#ff7a00",
                          }}
                        >
                          (Customer)
                        </span>
                      ) : (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            opacity: 0.6,
                          }}
                        >
                          (Other)
                        </span>
                      )}
                    </td>
                    <td>{p.reason || "-"}</td>
                    <td>৳{Number(p.amount || 0).toLocaleString()}</td>
                    <td>{p.gateway}</td>
                    <td
                      style={{
                        color:
                          p.type === "Incoming" ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      {p.type}
                    </td>
                    <td style={{ color: statusColor(p.status), fontWeight: 600 }}>
                      {p.status}
                    </td>
                    <td>
                      {p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString()
                        : p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td style={{ fontSize: 12 }}>{p.transactionId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large billing-modal">
              <div className="billing-header">
                <h2>
                  <i className="fas fa-credit-card"></i> New Payment
                </h2>
                <p>Pay someone or receive payment via SSLCommerz</p>
              </div>

              <input
                placeholder="Person / Customer name"
                value={form.customer}
                onChange={(e) =>
                  setForm({ ...form, customer: e.target.value })
                }
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isCustomer}
                  onChange={(e) =>
                    setForm({ ...form, isCustomer: e.target.checked })
                  }
                />
                This person is my customer
              </label>

              <input
                placeholder="Reason for payment (e.g. Invoice #12, salary, supplier bill)"
                value={form.reason}
                onChange={(e) =>
                  setForm({ ...form, reason: e.target.value })
                }
              />

              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) =>
                  setForm({ ...form, paymentDate: e.target.value })
                }
              />

              <input
                placeholder="Amount (BDT)"
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
              />

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value })
                }
              >
                <option value="Incoming">Incoming (receive money)</option>
                <option value="Outgoing">Outgoing (pay someone)</option>
              </select>

              <select
                value={form.gateway}
                onChange={(e) =>
                  setForm({ ...form, gateway: e.target.value })
                }
              >
                <option value="SSLCommerz">SSLCommerz</option>
                <option value="Stripe">Stripe</option>
                <option value="PayPal">PayPal</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>

              <div className="gateway-preview">
                {form.gateway === "SSLCommerz" && form.type === "Incoming" && (
                  <span>
                    <i className="fas fa-university"></i> SSLCommerz Sandbox —
                    you will be redirected to pay
                  </span>
                )}
                {form.gateway === "SSLCommerz" && form.type === "Outgoing" && (
                  <span>
                    <i className="fas fa-info-circle"></i> Outgoing payments are
                    recorded only (no card redirect)
                  </span>
                )}
                {form.gateway === "Stripe" && (
                  <span>
                    <i className="fab fa-stripe"></i> Stripe (record only for
                    now)
                  </span>
                )}
                {form.gateway === "PayPal" && (
                  <span>
                    <i className="fab fa-paypal"></i> PayPal (record only for
                    now)
                  </span>
                )}
                {(form.gateway === "Cash" || form.gateway === "Other") && (
                  <span>
                    <i className="fas fa-money-bill"></i> Manual record
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button
                  className="save-btn"
                  onClick={addPayment}
                  disabled={saving}
                >
                  <i className="fas fa-check-circle"></i>{" "}
                  {saving
                    ? "Processing..."
                    : form.gateway === "SSLCommerz" && form.type === "Incoming"
                    ? "Pay with SSLCommerz"
                    : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
