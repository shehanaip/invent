import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CashFlow({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    type: "Income",
    source: "",
    amount: "",
    date: "",
  });

  // ================= FETCH =================
  const fetchCashFlow = async () => {
    try {
      const res = await API.get("/cashflow", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTransactions(res.data || []);
    } catch (err) {
      console.log(err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, []);

  // ================= INPUT =================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= ADD =================
  const addTransaction = async () => {
    try {
      await API.post("/cashflow", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      resetForm();
      fetchCashFlow();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= UPDATE =================
  const updateTransaction = async () => {
    try {
      await API.put(`/cashflow/${editId}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      resetForm();
      fetchCashFlow();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= DELETE =================
  const deleteTransaction = async (id) => {
    try {
      await API.delete(`/cashflow/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchCashFlow();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= EDIT =================
  const startEdit = (t) => {
    setEditMode(true);
    setEditId(t._id);
    setShowModal(true);

    setForm({
      type: t.type,
      source: t.source,
      amount: t.amount,
      date: t.date,
    });
  };

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      type: "Income",
      source: "",
      amount: "",
      date: "",
    });

    setEditMode(false);
    setEditId(null);
    setShowModal(false);
  };

  // ================= CALCULATIONS =================
  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const chartData = [
    { name: "Income", amount: totalIncome },
    { name: "Expense", amount: totalExpense },
    { name: "Balance", amount: balance },
  ];

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>CASH FLOW</h1>
      </div>
    );
  }

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
        active="cashflow"
      />

      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-wallet"></i> Cash Flow Dashboard
          </h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus"></i> Add Transaction
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <h2 style={{ color: "#22c55e" }}>
              ৳{totalIncome.toLocaleString()}
            </h2>
            <p>Total Income</p>
          </div>

          <div className="stat-card">
            <h2 style={{ color: "#ef4444" }}>
              ৳{totalExpense.toLocaleString()}
            </h2>
            <p>Total Expense</p>
          </div>

          <div className="stat-card">
            <h2 style={{ color: "#f59e0b" }}>
              ৳{balance.toLocaleString()}
            </h2>
            <p>Net Balance</p>
          </div>

        </div>

        {/* GRAPH */}
        <div className="table-card">
          <h3>Cash Flow Analytics</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#ff7a00" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>Transaction History</h3>

          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{t.type}</td>
                  <td>{t.source}</td>
                  <td>৳{Number(t.amount).toLocaleString()}</td>
                  <td>{t.date}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteTransaction(t._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">

              <h2>
                {editMode ? "Edit Transaction" : "Add Transaction"}
              </h2>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                <option>Income</option>
                <option>Expense</option>
              </select>

              <input
                name="source"
                placeholder="Source"
                value={form.source}
                onChange={handleChange}
              />

              <input
                name="amount"
                placeholder="Amount"
                value={form.amount}
                onChange={handleChange}
              />

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={editMode ? updateTransaction : addTransaction}
                >
                  {editMode ? "Update" : "Save"}
                </button>

                <button
                  className="cancel-btn"
                  onClick={resetForm}
                >
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