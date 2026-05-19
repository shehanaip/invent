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

export default function Products({ dark, setDark }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    name: "",
totalStock: "",
pricePerUnit: "",
    tax: "",
    currency: "BDT",
    skus: "",
    brand: "",
    category: "",
    subCategory: "",
    childCategory: "",
    barcode: "",
    description: "",
    unitType: "piece",
    allowPartialSale: false,
    minSellUnit: "",
    qrEnabled: false,
  });

  const currencySymbols = {
    BDT: "৳",
    USD: "$",
    INR: "₹",
  };

  // ================= FETCH =================
  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data || []);
    } catch (err) {
      console.log(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      name: "",
totalStock: "",
pricePerUnit: "",
      tax: "",
      currency: "BDT",
      skus: "",
      brand: "",
      category: "",
      subCategory: "",
      childCategory: "",
      barcode: "",
      description: "",
      unitType: "piece",
      allowPartialSale: false,
      minSellUnit: "",
      qrEnabled: false,
    });

    setImages([]);
    setEditMode(false);
    setEditId(null);
    setShowModal(false);
  };

  // ================= ADD =================
const addProduct = async () => {
  try {
    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

await API.post("/products", formData);

    resetForm();
    fetchProducts();
  } catch (err) {
    console.log("UPLOAD ERROR:", err.response?.data || err.message);
  }
};

  // ================= UPDATE =================
  const updateProduct = async () => {
    try {
      await API.put(`/products/${editId}`, form);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= DELETE =================
  const deleteProduct = async (id) => {
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= EDIT =================
  const startEdit = (p) => {
    setEditMode(true);
    setShowModal(true);
    setEditId(p._id);

    setForm({
      name: p.name || "",
      totalStock: p.totalStock || "",
pricePerUnit: p.pricePerUnit || "",
      tax: p.tax || "",
      currency: p.currency || "BDT",
      skus: p.skus?.map(s => s.code).join(", ") || "",
      brand: p.brand || "",
      category: p.category || "",
      subCategory: p.subCategory || "",
      childCategory: p.childCategory || "",
      barcode: p.barcode || "",
      description: p.description || "",
      unitType: p.unitType || "piece",
      allowPartialSale: p.allowPartialSale || false,
      minSellUnit: p.minSellUnit || "",
      qrEnabled: p.qrEnabled || false,
    });
  };

  const filtered = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter((p) => p.totalStock <= 5).length;

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>PRODUCTS</h1>
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
        active="products"
      />

      {/* MAIN */}
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-boxes"></i> Products
          </h1>

          <div className="actions">
            <input
              className="search-input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              className="add-btn"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus"></i> Add Product
            </button>
          </div>
        </div>

        {/* GRAPH */}
        <div className="table-card">
          <h3>Stock Overview</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={products}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalStock" fill="#ff7a00" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-box"></i>
            <h2>{products.length}</h2>
            <p>Total Products</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>{lowStock}</h2>
            <p>Low Stock</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    {p.images?.length > 0 && (
                      <img
                        src={`http://localhost:5000/uploads/${p.images[0]}`}
                        width="50"
                      />
                    )}
                  </td>

<td>{p.name}</td>
<td>{p.brand}</td>
<td>{p.totalStock}</td>
<td>৳{p.pricePerUnit}</td>
<td>{p.unitType}</td>

                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(p)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteProduct(p._id)}
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

              <h2>{editMode ? "Edit Product" : "Add Product"}</h2>

              <input name="name" placeholder="Name" value={form.name} onChange={handleChange}/>
              <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange}/>
              <input name="category" placeholder="Category" value={form.category} onChange={handleChange}/>
              <input name="subCategory" placeholder="Sub Category" value={form.subCategory} onChange={handleChange}/>
              <input name="childCategory" placeholder="Child Category" value={form.childCategory} onChange={handleChange}/>

              <input
  name="totalStock"
  placeholder="Stock"
  value={form.totalStock}
  onChange={handleChange}
/>

<input
  name="pricePerUnit"
  placeholder="Price"
  value={form.pricePerUnit}
  onChange={handleChange}
/>
              <input name="tax" placeholder="Tax %" value={form.tax} onChange={handleChange}/>

              <select name="unitType" value={form.unitType} onChange={handleChange}>
                <option value="piece">Piece</option>
                <option value="kg">KG</option>
                <option value="gram">Gram</option>
                <option value="liter">Liter</option>
                <option value="ml">ML</option>
              </select>

              <input
                name="minSellUnit"
                placeholder="Min Sell Unit"
                value={form.minSellUnit}
                onChange={handleChange}
              />

              <input
  name="skus"
  placeholder="SKU1, SKU2, SKU3"
  value={form.skus}
  onChange={handleChange}
/>

<input
  name="barcode"
  placeholder="Barcode"
  value={form.barcode}
  onChange={handleChange}
/>

<label className="toggle-row">
  <input
    type="checkbox"
    name="qrEnabled"
    checked={form.qrEnabled}
    onChange={handleChange}
  />
</label>
              

              <input
                type="file"
                multiple
                onChange={(e) => setImages(e.target.files)}
              />

              <label className="toggle-row">
                <input
                  type="checkbox"
                  name="allowPartialSale"
                  checked={form.allowPartialSale}
                  onChange={handleChange}
                />
               
              </label>

              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
              />

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={editMode ? updateProduct : addProduct}
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