import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";

export default function Billing({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    customer: "",
    amount: "",
    gateway: "Stripe",
    type: "Incoming",
  });

  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchPayments = async () => {
    try {
      const res = await API.get("/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPayments(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ================= ADD PAYMENT =================
  const addPayment = async () => {
    try {
      await API.post(
        "/payments",
        {
          ...form,
          status: "Paid",
          transactionId: "TXN" + Date.now(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowModal(false);

      setForm({
        customer: "",
        amount: "",
        gateway: "Stripe",
        type: "Incoming",
      });

      fetchPayments();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= STATS =================
  const totalTransactions = payments.length;

  const incoming = payments
    .filter((p) => p.type === "Incoming")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const outgoing = payments
    .filter((p) => p.type === "Outgoing")
    .reduce((sum, p) => sum + Number(p.amount), 0);

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
      />

      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-credit-card"></i> Billing Center
          </h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus"></i> New Payment
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <h2>{totalTransactions}</h2>
            <p>Total Transactions</p>
          </div>

          <div className="stat-card">
            <h2>৳{incoming}</h2>
            <p>Incoming</p>
          </div>

          <div className="stat-card">
            <h2>৳{outgoing}</h2>
            <p>Outgoing</p>
          </div>

          <div className="stat-card">
            <h2>৳{incoming - outgoing}</h2>
            <p>Net Balance</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>Payment Transactions</h3>

          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Type</th>
                <th>Status</th>
                <th>Txn ID</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.customer}</td>
                  <td>৳{p.amount}</td>
                  <td>{p.gateway}</td>

                  <td
                    style={{
                      color:
                        p.type === "Incoming"
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    {p.type}
                  </td>

                  <td style={{ color: "#22c55e" }}>
                    {p.status}
                  </td>

                  <td>{p.transactionId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large billing-modal">

              <div className="billing-header">
                <h2>
                  <i className="fas fa-credit-card"></i> New Payment
                </h2>
                <p>Process payment securely</p>
              </div>

              <input
                placeholder="Customer Name"
                value={form.customer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer: e.target.value,
                  })
                }
              />

              <input
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
              />

              <select
                value={form.gateway}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gateway: e.target.value,
                  })
                }
              >
                <option>Stripe</option>
                <option>SSLCommerz</option>
                <option>PayPal</option>
              </select>

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                  })
                }
              >
                <option>Incoming</option>
                <option>Outgoing</option>
              </select>

              {/* GATEWAY PREVIEW */}
              <div className="gateway-preview">
                {form.gateway === "Stripe" && (
                  <span>
                    <i className="fab fa-stripe"></i> Stripe Gateway
                  </span>
                )}

                {form.gateway === "PayPal" && (
                  <span>
                    <i className="fab fa-paypal"></i> PayPal Gateway
                  </span>
                )}

                {form.gateway === "SSLCommerz" && (
                  <span>
                    <i className="fas fa-university"></i> SSLCommerz
                  </span>
                )}
              </div>

              <div className="modal-actions">

                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>

                <button
                  className="save-btn"
                  onClick={addPayment}
                >
                  <i className="fas fa-check-circle"></i> Pay Now
                </button>

              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}