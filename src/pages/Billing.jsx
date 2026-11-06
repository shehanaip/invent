import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import AppSelect from "../components/AppSelect";
import Pagination from "../components/Pagination";
import { usePreferences } from "../context/usePreferences";
import { formatCurrency, formatDate } from "../utils/preferences";
import { translate } from "../utils/translations";
import usePagination from "../utils/usePagination";

export default function Billing({ dark, setDark, logout }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const fetchPayments = async (initialLoad = false) => {
    try {
      const res = await API.get("/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      if (initialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(true);

    // After SSL redirect back
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      alert(t("Payment successful!"));
      window.history.replaceState({}, "", "/billing");
      fetchPayments();
    } else if (params.get("paid") === "0") {
      alert(t("Payment failed or cancelled."));
      window.history.replaceState({}, "", "/billing");
      fetchPayments();
    }
  }, []);

  // ================= ADD / PAY =================
  const addPayment = async () => {
    if (!form.customer.trim()) {
      alert(t("Enter the person / customer name"));
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      alert(t("Enter a valid amount"));
      return;
    }
    if (!form.reason.trim()) {
      alert(t("Enter the reason for this payment"));
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
      alert(t("Payment recorded successfully"));
    } catch (err) {
      console.log(err);
      alert(
        err?.response?.data?.msg ||
          t("Payment failed. Check SSLCommerz / server logs.")
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
  const paymentPagination = usePagination(filtered);

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`} role="status" aria-live="polite">
        <div className="loader-bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Billing")}</h1>
      </div>
    );
  }

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

      <main className="main-content billing-page modern-data-page">
        <div className="topbar">
          <h1>
            <i className="fas fa-credit-card"></i> {t("Billing Center")}
          </h1>

          <div className="actions">
            <input
              className="search-input"
              placeholder={t("Search payments...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                paymentPagination.setPage(1);
              }}
            />
            <button className="add-btn" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus"></i> {t("New Payment")}
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card modern-stat-card">
            <span className="modern-stat-icon"><i className="fas fa-receipt" aria-hidden="true"></i></span>
            <h2>{totalTransactions}</h2>
            <p>{t("Total Transactions")}</p>
          </div>
          <div className="stat-card modern-stat-card income-stat">
            <span className="modern-stat-icon"><i className="fas fa-arrow-down" aria-hidden="true"></i></span>
            <h2>{money(incoming)}</h2>
            <p>{t("Incoming (Paid)")}</p>
          </div>
          <div className="stat-card modern-stat-card expense-stat">
            <span className="modern-stat-icon"><i className="fas fa-arrow-up" aria-hidden="true"></i></span>
            <h2>{money(outgoing)}</h2>
            <p>{t("Outgoing (Paid)")}</p>
          </div>
          <div className="stat-card modern-stat-card balance-stat">
            <span className="modern-stat-icon"><i className="fas fa-scale-balanced" aria-hidden="true"></i></span>
            <h2>{money(incoming - outgoing)}</h2>
            <p>{t("Net Balance")}</p>
          </div>
        </div>

        <div className="table-card">
          <div className="modern-table-heading">
            <div>
              <h3>{t("Payment Transactions")}</h3>
              <p>{t("Billing Center")}</p>
            </div>
            <span className="modern-table-count">{filtered.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>{t("Name")}</th>
                <th>{t("Reason")}</th>
                <th>{t("Amount")}</th>
                <th>{t("Gateway")}</th>
                <th>{t("Type")}</th>
                <th>{t("Status")}</th>
                <th>{t("Date")}</th>
                <th>{t("Txn ID")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    {t("No payments found")}
                  </td>
                </tr>
              ) : (
                paymentPagination.pageItems.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.customer || p.payeeName || "-"}
                      {p.isCustomer ? (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            color: "var(--accent)",
                          }}
                        >
                          ({t("Customer")})
                        </span>
                      ) : (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            opacity: 0.6,
                          }}
                        >
                          ({t("Other")})
                        </span>
                      )}
                    </td>
                    <td>{p.reason || "-"}</td>
                    <td>{money(p.amount || 0)}</td>
                    <td>{p.gateway}</td>
                    <td>
                      <span className={`modern-status-pill ${p.type === "Incoming" ? "positive" : "negative"}`}>
                      {t(p.type)}
                      </span>
                    </td>
                    <td>
                      <span className="modern-status-pill" style={{ "--status-color": statusColor(p.status) }}>
                        {t(p.status)}
                      </span>
                    </td>
                    <td>
                      {formatDate(p.paymentDate || p.createdAt, settings)}
                    </td>
                    <td className="transaction-id-cell">{p.transactionId || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={filtered.length}
            page={paymentPagination.page}
            pageCount={paymentPagination.pageCount}
            pageSize={paymentPagination.pageSize}
            onPageChange={paymentPagination.setPage}
            t={t}
          />
        </div>

        {showModal && (
          <div className="modal-overlay payment-modal-overlay">
            <div className="modal-box large billing-modal compact-form-modal" role="dialog" aria-modal="true" aria-labelledby="payment-form-title">
              <div className="form-modal-header">
                <div>
                  <span className="form-modal-kicker">{t("Billing Center")}</span>
                  <h2 id="payment-form-title"><i className="fas fa-credit-card" aria-hidden="true"></i> {t("New Payment")}</h2>
                  <p>{t("Pay someone or receive payment via SSLCommerz")}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)} disabled={saving} aria-label={t("Cancel")}>
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>

              <div className="compact-form-grid payment-form-grid">
                <label className="compact-form-field compact-field-wide" htmlFor="payment-customer">
                  <span>{t("Person / Customer name")}</span>
                  <input id="payment-customer" placeholder={t("Person / Customer name")} value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}/>
                </label>

                <label className="form-toggle-row payment-customer-toggle compact-field-wide">
                  <span>{t("This person is my customer")}</span>
                  <input
                    type="checkbox"
                    checked={form.isCustomer}
                    onChange={(e) => setForm({ ...form, isCustomer: e.target.checked })}
                  />
                  <span className="form-toggle-track" aria-hidden="true"></span>
                </label>

                <label className="compact-form-field compact-field-wide" htmlFor="payment-reason">
                  <span>{t("Reason")}</span>
                  <input id="payment-reason" placeholder={t("Reason for payment (e.g. Invoice #12, salary, supplier bill)")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}/>
                </label>

                <label className="compact-form-field" htmlFor="payment-date">
                  <span>{t("Date")}</span>
                  <input id="payment-date" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}/>
                </label>

                <label className="compact-form-field" htmlFor="payment-amount">
                  <span>{t("Amount")} (BDT)</span>
                  <input id="payment-amount" placeholder={t("Amount (BDT)")} type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}/>
                </label>

                <label className="compact-form-field" htmlFor="payment-type">
                  <span>{t("Type")}</span>
                  <AppSelect id="payment-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="Incoming">{t("Incoming (receive money)")}</option>
                    <option value="Outgoing">{t("Outgoing (pay someone)")}</option>
                  </AppSelect>
                </label>

                <label className="compact-form-field" htmlFor="payment-gateway">
                  <span>{t("Gateway")}</span>
                  <AppSelect id="payment-gateway" value={form.gateway} onChange={(e) => setForm({ ...form, gateway: e.target.value })}>
                    <option value="SSLCommerz">SSLCommerz</option>
                    <option value="Stripe">Stripe</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </AppSelect>
                </label>
              </div>

              <div className="gateway-preview payment-gateway-preview">
                {form.gateway === "SSLCommerz" && form.type === "Incoming" && (
                  <span><i className="fas fa-university"></i> SSLCommerz Sandbox — you will be redirected to pay</span>
                )}
                {form.gateway === "SSLCommerz" && form.type === "Outgoing" && (
                  <span><i className="fas fa-info-circle"></i> Outgoing payments are recorded only (no card redirect)</span>
                )}
                {form.gateway === "Stripe" && (
                  <span><i className="fab fa-stripe"></i> Stripe (record only for now)</span>
                )}
                {form.gateway === "PayPal" && (
                  <span><i className="fab fa-paypal"></i> PayPal (record only for now)</span>
                )}
                {(form.gateway === "Cash" || form.gateway === "Other") && (
                  <span><i className="fas fa-money-bill"></i> Manual record</span>
                )}
              </div>

              <div className="modal-actions compact-form-actions payment-form-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  <i className="fas fa-times"></i> {t("Cancel")}
                </button>
                <button
                  className="save-btn"
                  onClick={addPayment}
                  disabled={saving}
                >
                  <i className="fas fa-check-circle"></i>{" "}
                  {saving
                    ? t("Processing...")
                    : form.gateway === "SSLCommerz" && form.type === "Incoming"
                    ? t("Pay with SSLCommerz")
                    : t("Save Payment")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
