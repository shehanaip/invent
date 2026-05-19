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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Orders({ dark, setDark }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");

 const [form, setForm] = useState({
  customer: "",
  email: "",
  phone: "",
  productId: "",
  quantity: "",
  status: "Pending",
  payment: "Unpaid",
  total: "",
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
  }, []);

  // ================= HANDLE INPUT =================
const handleChange = (e) => {
  const { name, value } = e.target;

  let updated = { ...form, [name]: value };

  if (name === "productId" || name === "quantity") {
    const product = products.find(
      p => p._id === updated.productId
    );

    if (product && updated.quantity) {
      updated.total = product.pricePerUnit * Number(updated.quantity);
    }
  }

  setForm(updated);
};

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      customer: "",
      productId: "",
      quantity: "",
      status: "Pending",
      payment: "Unpaid",
      total: "",
    });

    setEditMode(false);
    setEditId(null);
    setShowModal(false);
  };

  // ================= ADD =================
 const addOrder = async () => {
  try {
    await API.post("/orders", form, {
      headers: { Authorization: `Bearer ${token}` },
    });

    resetForm();
    fetchOrders();

    // 🔥 refresh customers page (if open / listening)
    window.dispatchEvent(new Event("refresh-customers"));

  } catch (err) {
    console.log(err);
  }
};

  // ================= UPDATE =================
  const updateOrder = async () => {
    try {
      await API.put(`/orders/${editId}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      resetForm();
      fetchOrders();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= DELETE =================
  const deleteOrder = async (id) => {
    try {
      await API.delete(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchOrders();
    } catch (err) {
      console.log(err);
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
  productId: o.productId?._id || o.productId,
  quantity: o.quantity || "",
  status: o.status || "Pending",
  payment: o.payment || "Unpaid",
  total: o.total || "",
});
  };

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>ORDERS</h1>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === "Pending").length;
  const completedOrders = orders.filter(o => o.status === "Completed").length;

  const revenue = orders
    .filter(o => o.status === "Completed")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);


// ================= PRINT BILL =================
const printInvoice = (order) => {
  const product = products.find(
    (p) => p._id === (order.productId?._id || order.productId)
  );

  const printWindow = window.open("", "", "width=900,height=700");

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <style>
          body {
            font-family: Arial;
            padding: 40px;
            color: #222;
          }

          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #ddd;
            padding: 30px;
          }

          h1 {
            text-align: center;
            margin-bottom: 20px;
          }

          .info {
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          table th,
          table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }

          th {
            background: #f4f4f4;
          }

          .total {
            text-align: right;
            margin-top: 20px;
            font-size: 22px;
            font-weight: bold;
          }

          .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>

      <body>
        <div class="invoice-box">
          <h1>INVENT BILLING LEDGER</h1>

          <div class="info">
            <p><strong>Customer:</strong> ${order.customer}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment:</strong> ${order.payment}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
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
              <tr>
                <td>${product?.name || "Unknown Product"}</td>
                <td>${order.quantity}</td>
                <td>৳${product?.price || 0}</td>
                <td>৳${order.total}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Grand Total: ৳${order.total}
          </div>

          <div class="footer">
            Thank you for your business
          </div>
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

      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1><i className="fas fa-box"></i> Orders</h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-chart-bar"></i> New Order
          </button>
        </div>

        {/* ================= GRAPH ================= */}
        <div className="stats-grid">

          <div className="table-card">
            <h3>Orders Status</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: "Pending", value: pendingOrders },
                { name: "Completed", value: completedOrders },
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ff7a00" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-card">
            <h3>Revenue</h3>
            <h2 style={{ fontSize: "28px" }}>৳{revenue}</h2>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Revenue", value: revenue },
                    { name: "Other", value: 1000 },
                  ]}
                  dataKey="value"
                  outerRadius={80}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#333" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <h2>{orders.length}</h2>
            <p>Total Orders</p>
          </div>

          <div className="stat-card">
            <h2>{pendingOrders}</h2>
            <p>Pending</p>
          </div>

          <div className="stat-card">
            <h2>{completedOrders}</h2>
            <p>Completed</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
  {orders.map((o) => {
    return (
      <tr key={o._id}>
        <td>{o.customer?.name || o.customer || "Unknown"}</td>

        <td>{o.productId?.name || "Unknown"}</td>

        <td>{o.quantity}</td>

        <td>
          ৳{(o.productId?.pricePerUnit || 0) * o.quantity}
        </td>

        <td>৳{o.total}</td>

        <td>{o.status}</td>
        <td>{o.payment}</td>
<td>
  <button className="edit-btn" onClick={() => startEdit(o)}>
    <i className="fas fa-edit"></i>
  </button>



  <button
    className="delete-btn"
    onClick={() => deleteOrder(o._id)}
  >
    <i className="fas fa-trash"></i>
  </button>
    <button
    className="print-btn"
    onClick={() => printInvoice(o)}
  >
    <i className="fas fa-print"></i>
  </button>
</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">

              <h2>{editMode ? "Edit Order" : "Add Order"}</h2>

              <input
                name="customer"
                placeholder="Customer Name"
                value={form.customer}
                onChange={handleChange}
              />
              <input
                 name="email"
                 placeholder="Customer Email"
                 value={form.email}
                 onChange={handleChange}
               />
               
               <input
                 name="phone"
                 placeholder="Customer Phone"
                 value={form.phone}
                 onChange={handleChange}
               />

              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                name="quantity"
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
              />

              <input
                name="total"
                value={form.total}
                readOnly
              />

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option>Pending</option>
                <option>Completed</option>
              </select>

              <select
                name="payment"
                value={form.payment}
                onChange={handleChange}
              >
                <option>Unpaid</option>
                <option>Paid</option>
              </select>

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={editMode ? updateOrder : addOrder}
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

    