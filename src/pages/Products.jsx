import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
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
} from "recharts";

export default function Products({ dark, setDark }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  const [search, setSearch] = useState("");
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    name: "",
totalStock: "",
pricePerUnit: "",
    tax: String(settings.tax ?? ""),
    currency: "BDT",
    skus: "",
    barcodes: [""],
    stockByStore: [],
    brand: "",
    category: "",
    subCategory: "",
    childCategory: "",
    description: "",
    unitType: "piece",
    allowPartialSale: false,
    minSellUnit: "",
    qrEnabled: false,
  });

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
    API.get("/stores")
      .then((res) => setStores(res.data || []))
      .catch((err) => console.error("STORE FETCH:", err));
  }, []);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const updateBarcode = (index, value) => {
    setForm((current) => ({
      ...current,
      barcodes: current.barcodes.map((barcode, barcodeIndex) =>
        barcodeIndex === index ? value : barcode
      ),
    }));
  };

  const updateBranchStock = (storeId, stock) => {
    setForm((current) => {
      const stockByStore = current.stockByStore.filter(
        (entry) => entry.storeId !== storeId
      );
      if (stock !== "") stockByStore.push({ storeId, stock });
      return { ...current, stockByStore };
    });
  };

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      name: "",
totalStock: "",
pricePerUnit: "",
      tax: String(settings.tax ?? ""),
      currency: "BDT",
      skus: "",
      barcodes: [""],
      stockByStore: [],
      brand: "",
      category: "",
      subCategory: "",
      childCategory: "",
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
      if (key === "barcodes" || key === "stockByStore") {
        formData.append(key, JSON.stringify(value));
        return;
      }
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
    console.error("UPLOAD ERROR:", err.response?.data || err.message);
    window.alert(err.response?.data?.error || t("Unable to save product."));
  }
};

  // ================= UPDATE =================
  const updateProduct = async () => {
    try {
      const payload = {
        ...form,
        barcodes: form.barcodes.map((barcode) => barcode.trim()).filter(Boolean),
        stockByStore: form.stockByStore.filter((entry) => entry.stock !== ""),
        totalStock: form.stockByStore.length
          ? form.stockByStore.reduce((sum, entry) => sum + Number(entry.stock || 0), 0)
          : form.totalStock,
      };
      await API.put(`/products/${editId}`, payload);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      window.alert(err.response?.data?.error || t("Unable to update product."));
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
      tax: p.tax ?? settings.tax ?? "",
      currency: p.currency || "BDT",
      skus: Array.isArray(p.skus) ? p.skus.map((sku) => sku?.code || sku).join(", ") : p.skus || "",
      barcodes: p.barcodes?.length ? p.barcodes : (p.barcode ? [p.barcode] : [""]),
      stockByStore: (p.stockByStore || []).map((entry) => ({
        storeId: entry.storeId?._id || entry.storeId,
        stock: entry.stock,
      })),
      brand: p.brand || "",
      category: p.category || "",
      subCategory: p.subCategory || "",
      childCategory: p.childCategory || "",
      description: p.description || "",
      unitType: p.unitType || "piece",
      allowPartialSale: p.allowPartialSale || false,
      minSellUnit: p.minSellUnit || "",
      qrEnabled: p.qrEnabled || false,
    });
  };

  const filtered = products.filter((p) =>
    [
      p.name,
      p.barcode,
      ...(p.barcodes || []),
    ].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
  );
  const productPagination = usePagination(filtered);

  const lowStock = products.filter((p) => p.totalStock <= 5).length;
  const outOfStock = products.filter((p) => Number(p.totalStock) <= 0).length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.totalStock || 0) * Number(p.pricePerUnit || 0),
    0
  );

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Products")}</h1>
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
      <main className="main-content products-page modern-data-page">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-boxes"></i> {t("Products")}
          </h1>

          <div className="actions">
            <input
              className="search-input"
              placeholder={t("Search products...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                productPagination.setPage(1);
              }}
            />

            <button
              className="add-btn"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus"></i> {t("Add Product")}
            </button>
          </div>
        </div>

        {/* GRAPH */}
        <div className="table-card dashboard-chart-card products-chart-card">
          <div className="dashboard-chart-heading">
            <div>
              <h3><i className="fas fa-chart-bar"></i> {t("Stock Overview")}</h3>
              <p>{t("Current units available across your products")}</p>
            </div>
            <span className="dashboard-chart-badge">{products.length} {t("products")}</span>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={products.slice(0, 8)}
              margin={{ top: 12, right: 8, left: -18, bottom: 8 }}
            >
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 5" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
                tickFormatter={(name) => name.length > 11 ? `${name.slice(0, 10)}…` : name}
                angle={-35}
                textAnchor="end"
                height={68}
                tickMargin={12}
                interval={0}
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
              />
              <Bar dataKey="totalStock" name={t("Units in stock")} fill="var(--accent)" radius={[7, 7, 2, 2]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* STATS */}
        <div className="stats-grid products-stats">
          <div className="stat-card modern-stat-card">
            <span className="modern-stat-icon"><i className="fas fa-boxes-stacked" aria-hidden="true"></i></span>
            <h2>{products.length}</h2>
            <p>{t("Total Products")}</p>
          </div>

          <div className="stat-card modern-stat-card transit-stat">
            <span className="modern-stat-icon"><i className="fas fa-triangle-exclamation" aria-hidden="true"></i></span>
            <h2>{lowStock}</h2>
            <p>{t("Low Stock")}</p>
          </div>

          <div className="stat-card modern-stat-card income-stat">
            <span className="modern-stat-icon"><i className="fas fa-box-open" aria-hidden="true"></i></span>
            <h2>{outOfStock}</h2>
            <p>{t("Out of Stock")}</p>
          </div>

          <div className="stat-card modern-stat-card balance-stat">
            <span className="modern-stat-icon"><i className="fas fa-sack-dollar" aria-hidden="true"></i></span>
            <h2>{money(inventoryValue)}</h2>
            <p>{t("Inventory Value")}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card responsive-card-table">
          <div className="modern-table-heading">
            <div>
              <h3>{t("Product Inventory")}</h3>
              <p>{t("Manage products, stock, and pricing")}</p>
            </div>
            <span className="modern-table-count">{filtered.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>{t("Image")}</th>
                <th>{t("Name")}</th>
                <th>{t("Brand")}</th>
                <th>{t("Stock")}</th>
                <th>{t("Price")}</th>
                <th>{t("Unit")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {productPagination.pageItems.map((p) => (
                <tr key={p._id}>
                  <td className="product-image-cell" data-label={t("Image")}>
                    <span className="product-image-frame">
                      <span className="product-image-placeholder" aria-hidden="true">
                        <i className="fas fa-box"></i>
                      </span>
                      {p.images?.[0] && (
                        <img
                          src={`https://invent-yfwy.onrender.com/uploads/${p.images[0]}`}
                          alt={p.name || t("Product")}
                          onError={(e) => {
                            e.currentTarget.hidden = true;
                          }}
                        />
                      )}
                    </span>
                  </td>

                  <td className="product-name-cell" data-label={t("Name")}>
                    <strong>{p.name}</strong>
                  </td>
                  <td data-label={t("Brand")}>{p.brand || "-"}</td>
                  <td data-label={t("Stock")}>
                    <span className={`modern-status-pill ${Number(p.totalStock) <= 0 ? "negative" : Number(p.totalStock) <= 5 ? "warning" : "positive"}`}>
                      {p.totalStock}
                    </span>
                  </td>
                  <td data-label={t("Price")} className="modern-amount-cell">{money(p.pricePerUnit)}</td>
                  <td data-label={t("Unit")}>{p.unitType}</td>

                  <td className="product-actions-cell" data-label={t("Actions")}>
                    <button
                      className="view-btn"
                      onClick={() => setViewProduct(p)}
                      aria-label={t("View")}
                      title={t("View")}
                    >
                      <i className="fas fa-eye" aria-hidden="true"></i>
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(p)}
                    >
                      {t("Edit")}
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteProduct(p._id)}
                    >
                      {t("Delete")}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="modern-empty-cell">
                    {t("No products found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={filtered.length}
            page={productPagination.page}
            pageCount={productPagination.pageCount}
            pageSize={productPagination.pageSize}
            onPageChange={productPagination.setPage}
            t={t}
          />
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay product-modal-overlay">
            <div className="modal-box large product-form-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
              <div className="form-modal-header">
                <div>
                  <span className="form-modal-kicker">{t("Product Inventory")}</span>
                  <h2 id="product-form-title">{editMode ? `${t("Edit")} ${t("Product")}` : t("Add Product")}</h2>
                  <p>{t("Enter the product details below.")}</p>
                </div>
                <button type="button" className="modal-close-btn" onClick={resetForm} aria-label={t("Close")}>
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>

              <div className="product-form-grid">
                <label className="modal-field product-field-wide" htmlFor="product-name">
                  <span>{t("Name")}</span>
                  <input id="product-name" name="name" placeholder={t("Name")} value={form.name} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-brand">
                  <span>{t("Brand")}</span>
                  <input id="product-brand" name="brand" placeholder={t("Brand")} value={form.brand} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-category">
                  <span>{t("Category")}</span>
                  <input id="product-category" name="category" placeholder={t("Category")} value={form.category} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-subcategory">
                  <span>{t("Sub Category")}</span>
                  <input id="product-subcategory" name="subCategory" placeholder={t("Sub Category")} value={form.subCategory} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-child-category">
                  <span>{t("Child Category")}</span>
                  <input id="product-child-category" name="childCategory" placeholder={t("Child Category")} value={form.childCategory} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-stock">
                  <span>{stores.length ? t("Total Stock") : t("Stock")}</span>
                  <input
                    id="product-stock"
                    name="totalStock"
                    type="number"
                    min="0"
                    placeholder={t("Stock")}
                    value={form.stockByStore.length
                      ? form.stockByStore.reduce((sum, entry) => sum + Number(entry.stock || 0), 0)
                      : form.totalStock}
                    disabled={form.stockByStore.length > 0}
                    onChange={handleChange}
                  />
                </label>
                <label className="modal-field" htmlFor="product-price">
                  <span>{t("Price")} (BDT)</span>
                  <input id="product-price" name="pricePerUnit" type="number" min="0" step="0.01" placeholder={`${t("Price")} (BDT)`} value={form.pricePerUnit} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-tax">
                  <span>{t("Tax")} %</span>
                  <input id="product-tax" name="tax" type="number" min="0" max="1000" step="0.01" placeholder={`${t("Tax")} %`} value={form.tax} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-unit">
                  <span>{t("Unit")}</span>
                  <select id="product-unit" name="unitType" value={form.unitType} onChange={handleChange}>
                    <option value="piece">{t("Piece")}</option>
                    <option value="kg">{t("KG")}</option>
                    <option value="gram">{t("Gram")}</option>
                    <option value="liter">{t("Liter")}</option>
                    <option value="ml">{t("ML")}</option>
                  </select>
                </label>
                <label className="modal-field" htmlFor="product-min-unit">
                  <span>{t("Min Sell Unit")}</span>
                  <input id="product-min-unit" name="minSellUnit" type="number" min="0" step="0.01" placeholder={t("Min Sell Unit")} value={form.minSellUnit} onChange={handleChange}/>
                </label>
                <label className="modal-field" htmlFor="product-skus">
                  <span>{t("SKUs")}</span>
                  <input id="product-skus" name="skus" placeholder="SKU1, SKU2, SKU3" value={form.skus} onChange={handleChange}/>
                </label>
                <div className="modal-field product-field-wide product-array-field">
                  <span>{t("Barcodes")}</span>
                  {form.barcodes.map((barcode, index) => (
                    <div className="product-array-row" key={`barcode-${index}`}>
                      <input
                        aria-label={`${t("Barcode")} ${index + 1}`}
                        placeholder={`${t("Barcode")} ${index + 1}`}
                        value={barcode}
                        onChange={(e) => updateBarcode(index, e.target.value)}
                      />
                      {form.barcodes.length > 1 && (
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => setForm((current) => ({
                            ...current,
                            barcodes: current.barcodes.filter((_, i) => i !== index),
                          }))}
                          aria-label={t("Remove barcode")}
                        >
                          <i className="fas fa-trash" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setForm((current) => ({
                      ...current,
                      barcodes: [...current.barcodes, ""],
                    }))}
                  >
                    <i className="fas fa-plus" aria-hidden="true"></i> {t("Add barcode")}
                  </button>
                </div>
                {stores.length > 0 && (
                  <div className="modal-field product-field-wide product-array-field">
                    <span>{t("Stock by branch")}</span>
                    <p className="form-field-hint">{t("Assign available quantity to each store or branch. Total stock is calculated automatically.")}</p>
                    <div className="branch-stock-grid">
                      {stores.map((store) => {
                        const branchStock = form.stockByStore.find(
                          (entry) => entry.storeId === store._id
                        );
                        const branchLabel = store.groupName
                          ? `${store.groupName} / ${store.name}`
                          : store.name;
                        return (
                          <label className="modal-field" key={store._id}>
                            <span>{branchLabel}</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={branchStock?.stock ?? ""}
                              onChange={(e) => updateBranchStock(store._id, e.target.value)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <label className="modal-field product-field-wide" htmlFor="product-images">
                  <span>{t("Product Images")}</span>
                  <input id="product-images" type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)}/>
                  {images.length > 0 && <small>{images.length} {t("images selected")}</small>}
                </label>
                <label className="form-toggle-row">
                  <span>{t("Enable QR code")}</span>
                  <input type="checkbox" name="qrEnabled" checked={form.qrEnabled} onChange={handleChange}/>
                  <span className="form-toggle-track" aria-hidden="true"></span>
                </label>
                <label className="form-toggle-row">
                  <span>{t("Allow partial sale")}</span>
                  <input type="checkbox" name="allowPartialSale" checked={form.allowPartialSale} onChange={handleChange}/>
                  <span className="form-toggle-track" aria-hidden="true"></span>
                </label>
                <label className="modal-field product-field-wide" htmlFor="product-description">
                  <span>{t("Description")}</span>
                  <textarea id="product-description" name="description" placeholder={t("Description")} value={form.description} onChange={handleChange}/>
                </label>
              </div>

              <div className="modal-actions product-form-actions">
                <button className="save-btn" onClick={editMode ? updateProduct : addProduct}>
                  <i className={`fas ${editMode ? "fa-check" : "fa-plus"}`} aria-hidden="true"></i>
                  {editMode ? t("Update") : t("Save")}
                </button>
                <button className="cancel-btn" onClick={resetForm}>{t("Cancel")}</button>
              </div>
            </div>
          </div>
        )}

        {viewProduct && (
          <div className="modal-overlay product-modal-overlay" onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewProduct(null);
          }}>
            <div className="modal-box product-detail-modal" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
              <div className="form-modal-header">
                <div>
                  <span className="form-modal-kicker">{t("Product Details")}</span>
                  <h2 id="product-detail-title">{viewProduct.name}</h2>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setViewProduct(null)} aria-label={t("Close")}>
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>
              <div className="product-detail-hero">
                <span className="product-detail-image">
                  <i className="fas fa-box" aria-hidden="true"></i>
                  {viewProduct.images?.[0] && (
                    <img
                      src={`https://invent-yfwy.onrender.com/uploads/${viewProduct.images[0]}`}
                      alt=""
                      onError={(e) => { e.currentTarget.hidden = true; }}
                    />
                  )}
                </span>
                <div>
                  <span className={`modern-status-pill ${Number(viewProduct.totalStock) <= 0 ? "negative" : Number(viewProduct.totalStock) <= 5 ? "warning" : "positive"}`}>
                    {t("Stock")}: {viewProduct.totalStock}
                  </span>
                  <strong>{money(viewProduct.pricePerUnit)}</strong>
                  <span>{viewProduct.brand || t("No brand specified")}</span>
                </div>
              </div>
              <div className="product-detail-grid">
                <div><span>{t("Category")}</span><strong>{viewProduct.category || "-"}</strong></div>
                <div><span>{t("Sub Category")}</span><strong>{viewProduct.subCategory || "-"}</strong></div>
                <div><span>{t("Child Category")}</span><strong>{viewProduct.childCategory || "-"}</strong></div>
                <div><span>{t("Unit")}</span><strong>{viewProduct.unitType || "-"}</strong></div>
                <div><span>{t("Tax")}</span><strong>{viewProduct.tax ?? settings.tax ?? 0}%</strong></div>
                <div className="product-detail-wide"><span>{t("Barcodes")}</span><strong>{[...new Set([viewProduct.barcode, ...(viewProduct.barcodes || [])].filter(Boolean))].join(", ") || "-"}</strong></div>
                {viewProduct.stockByStore?.length > 0 && (
                  <div className="product-detail-wide">
                    <span>{t("Stock by branch")}</span>
                    <strong>
                      {viewProduct.stockByStore.map((entry) => {
                        const storeId = entry.storeId?._id || entry.storeId;
                        const store = stores.find((item) => item._id === storeId);
                        return `${store?.groupName ? `${store.groupName} / ` : ""}${store?.name || t("Branch")}: ${entry.stock}`;
                      }).join(" · ")}
                    </strong>
                  </div>
                )}
                <div className="product-detail-wide"><span>{t("SKUs")}</span><strong>{Array.isArray(viewProduct.skus) ? viewProduct.skus.map((sku) => sku?.code || sku).join(", ") || "-" : viewProduct.skus || "-"}</strong></div>
                <div className="product-detail-wide product-description">
                  <span>{t("Description")}</span>
                  <p>{viewProduct.description || t("No description available.")}</p>
                </div>
              </div>
              <div className="modal-actions">
                <button className="edit-btn" onClick={() => {
                  setViewProduct(null);
                  startEdit(viewProduct);
                }}>
                  <i className="fas fa-edit" aria-hidden="true"></i> {t("Edit")}
                </button>
                <button className="cancel-btn" onClick={() => setViewProduct(null)}>{t("Close")}</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}