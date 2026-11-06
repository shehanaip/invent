import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
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
} from "recharts";

export default function CashFlow({ dark, setDark, logout }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
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
    { name: t("Income"), amount: totalIncome },
    { name: t("Expense"), amount: totalExpense },
    { name: t("Balance"), amount: balance },
  ];
  const transactionPagination = usePagination(transactions);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Cash Flow")}</h1>
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

      <main className="main-content cashflow-page modern-data-page">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-wallet"></i> {t("Cash Flow Dashboard")}
          </h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus"></i> {t("Add Transaction")}
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card modern-stat-card income-stat">
            <span className="modern-stat-icon"><i className="fas fa-arrow-trend-up" aria-hidden="true"></i></span>
            <h2 style={{ color: "#22c55e" }}>
              {money(totalIncome)}
            </h2>
            <p>{t("Total Income")}</p>
          </div>

          <div className="stat-card modern-stat-card expense-stat">
            <span className="modern-stat-icon"><i className="fas fa-arrow-trend-down" aria-hidden="true"></i></span>
            <h2 style={{ color: "#ef4444" }}>
              {money(totalExpense)}
            </h2>
            <p>{t("Total Expense")}</p>
          </div>

          <div className="stat-card modern-stat-card balance-stat">
            <span className="modern-stat-icon"><i className="fas fa-scale-balanced" aria-hidden="true"></i></span>
            <h2 style={{ color: "#f59e0b" }}>
              {money(balance)}
            </h2>
            <p>{t("Net Balance")}</p>
          </div>

        </div>

        {/* GRAPH */}
        <div className="table-card dashboard-chart-card">
          <div className="dashboard-chart-heading">
            <div>
              <h3><i className="fas fa-chart-column"></i> {t("Cash Flow Analytics")}</h3>
              <p>{t("Income, expenses, and your current net balance")}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 12, right: 8, left: -8, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--chart-muted)", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "var(--chart-hover)" }}
                formatter={(value) => money(value)}
                contentStyle={{
                  background: "var(--chart-tooltip)",
                  border: "1px solid var(--chart-grid)",
                  borderRadius: 12,
                  color: "var(--text)",
                }}
              />
              <Bar dataKey="amount" name={t("Amount")} fill="var(--accent)" radius={[7, 7, 2, 2]} maxBarSize={54} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <div className="modern-table-heading">
            <div>
              <h3>{t("Transaction History")}</h3>
              <p>{t("Cash Flow Analytics")}</p>
            </div>
            <span className="modern-table-count">{transactions.length}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>{t("Type")}</th>
                <th>{t("Source")}</th>
                <th>{t("Amount")}</th>
                <th>{t("Date")}</th>
                <th>{t("Action")}</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="modern-empty-cell">{t("No transactions found")}</td>
                </tr>
              ) : transactionPagination.pageItems.map((transaction) => (
                <tr key={transaction._id}>
                  <td>
                    <span className={`modern-status-pill ${transaction.type === "Income" ? "positive" : "negative"}`}>
                      {t(transaction.type)}
                    </span>
                  </td>
                  <td>{transaction.source}</td>
                  <td className="modern-amount-cell">{money(transaction.amount)}</td>
                  <td>{formatDate(transaction.date, settings)}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(transaction)}
                    >
                      {t("Edit")}
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteTransaction(transaction._id)}
                    >
                      {t("Delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={transactions.length}
            page={transactionPagination.page}
            pageCount={transactionPagination.pageCount}
            pageSize={transactionPagination.pageSize}
            onPageChange={transactionPagination.setPage}
            t={t}
          />
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay transaction-modal-overlay">
            <div className="modal-box large compact-form-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title">
              <div className="form-modal-header">
                <div>
                  <span className="form-modal-kicker">{t("Cash Flow Analytics")}</span>
                  <h2 id="transaction-form-title">{editMode ? `${t("Edit")} ${t("Transaction")}` : t("Add Transaction")}</h2>
                </div>
                <button type="button" className="modal-close-btn" onClick={resetForm} aria-label={t("Cancel")}>
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>

              <div className="compact-form-grid">
                <label className="compact-form-field compact-field-wide" htmlFor="transaction-type">
                  <span>{t("Type")}</span>
                  <select id="transaction-type" name="type" value={form.type} onChange={handleChange}>
                    <option value="Income">{t("Income")}</option>
                    <option value="Expense">{t("Expense")}</option>
                  </select>
                </label>

                <label className="compact-form-field" htmlFor="transaction-source">
                  <span>{t("Source")}</span>
                  <input id="transaction-source" name="source" placeholder={t("Source")} value={form.source} onChange={handleChange}/>
                </label>

                <label className="compact-form-field" htmlFor="transaction-amount">
                  <span>{t("Amount")} (BDT)</span>
                  <input id="transaction-amount" type="number" min="0" step="0.01" name="amount" placeholder={`${t("Amount")} (BDT)`} value={form.amount} onChange={handleChange}/>
                </label>

                <label className="compact-form-field compact-field-wide" htmlFor="transaction-date">
                  <span>{t("Date")}</span>
                  <input id="transaction-date" type="date" name="date" value={form.date} onChange={handleChange}/>
                </label>
              </div>

              <div className="modal-actions compact-form-actions">
                <button
                  className="save-btn"
                  onClick={editMode ? updateTransaction : addTransaction}
                >
                  {editMode ? t("Update") : t("Save")}
                </button>

                <button
                  className="cancel-btn"
                  onClick={resetForm}
                >
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