const router = require("express").Router();
const Payment = require("../models/Payment");
const auth = require("../middleware/auth");

// =====================================================
// SSLCommerz SANDBOX CREDENTIALS
// Move to process.env in production
// =====================================================
const SSL = {
  store_id: process.env.SSL_STORE_ID || "aip6a81ff04515e2",
  store_passwd: process.env.SSL_STORE_PASSWD || "aa20da940da51493088240842cbd04aa",
  init_url:
    process.env.SSL_INIT_URL ||
    "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
  // These must be public HTTPS URLs SSLCommerz can reach.
  // Change to your deployed backend URLs.
  success_url:
    process.env.SSL_SUCCESS_URL ||
    "https://invent-yfwy.onrender.com/api/payments/ssl/success",
  fail_url:
    process.env.SSL_FAIL_URL ||
    "https://invent-yfwy.onrender.com/api/payments/ssl/fail",
  cancel_url:
    process.env.SSL_CANCEL_URL ||
    "https://invent-yfwy.onrender.com/api/payments/ssl/cancel",
  ipn_url:
    process.env.SSL_IPN_URL ||
    "https://invent-yfwy.onrender.com/api/payments/ssl/ipn",
};

// Frontend redirect after payment (web app)
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://invent-yfwy.onrender.com";

// ================= GET USER PAYMENTS =================
router.get("/", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user }).sort({
      createdAt: -1,
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= CREATE / INIT PAYMENT =================
// Body: customer, amount, gateway, type, reason, isCustomer, paymentDate
router.post("/", auth, async (req, res) => {
  try {
    const {
      customer,
      payeeName,
      amount,
      gateway = "SSLCommerz",
      type = "Incoming",
      reason = "",
      isCustomer = false,
      paymentDate,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ msg: "Valid amount is required" });
    }

    const name = (payeeName || customer || "").trim();
    if (!name) {
      return res.status(400).json({ msg: "Name is required" });
    }

    const tranId = "TXN_" + Date.now();

    // Record payment first (Pending for SSLCommerz Incoming)
    const payment = await Payment.create({
      userId: req.user,
      customer: name,
      payeeName: name,
      isCustomer: !!isCustomer,
      reason: reason || "",
      amount: Number(amount),
      gateway,
      type,
      status:
        gateway === "SSLCommerz" && type === "Incoming"
          ? "Pending"
          : "Paid",
      transactionId: tranId,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    });

    // ---- SSLCommerz only for Incoming (receiving money) ----
    if (gateway === "SSLCommerz" && type === "Incoming") {
      const form = new URLSearchParams();
      form.append("store_id", SSL.store_id);
      form.append("store_passwd", SSL.store_passwd);
      form.append("total_amount", Number(amount).toFixed(2));
      form.append("currency", "BDT");
      form.append("tran_id", tranId);
      form.append("success_url", SSL.success_url);
      form.append("fail_url", SSL.fail_url);
      form.append("cancel_url", SSL.cancel_url);
      form.append("ipn_url", SSL.ipn_url);

      form.append("cus_name", name);
      form.append("cus_email", "customer@invent.app");
      form.append("cus_add1", "Dhaka");
      form.append("cus_city", "Dhaka");
      form.append("cus_country", "Bangladesh");
      form.append("cus_phone", "01700000000");

      form.append("shipping_method", "NO");
      form.append(
        "product_name",
        (reason || "INVENT Payment").substring(0, 100)
      );
      form.append("product_category", "Billing");
      form.append("product_profile", "general");

      // value_a can store our payment id for callback lookup
      form.append("value_a", payment._id.toString());
      form.append("value_b", String(req.user));

      const sslRes = await fetch(SSL.init_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      const sslData = await sslRes.json();

      if (sslData?.status !== "SUCCESS" || !sslData?.GatewayPageURL) {
        payment.status = "Failed";
        payment.rawGatewayResponse = sslData;
        await payment.save();
        return res.status(400).json({
          msg: sslData?.failedreason || "SSLCommerz init failed",
          ssl: sslData,
          payment,
        });
      }

      payment.gatewayUrl = sslData.GatewayPageURL;
      payment.rawGatewayResponse = sslData;
      await payment.save();

      return res.json({
        payment,
        redirectUrl: sslData.GatewayPageURL,
      });
    }

    // Non-SSL or Outgoing: just save as Paid record
    res.json({ payment, redirectUrl: null });
  } catch (err) {
    console.log("PAYMENT CREATE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= SSL SUCCESS =================
// SSLCommerz redirects browser here (GET or POST)
async function markPaid(req, res) {
  try {
    const body = { ...req.query, ...req.body };
    const tranId = body.tran_id;
    const valId = body.val_id;
    const paymentId = body.value_a;

    let payment = null;
    if (paymentId) payment = await Payment.findById(paymentId);
    if (!payment && tranId) {
      payment = await Payment.findOne({ transactionId: tranId });
    }

    if (payment) {
      payment.status = "Paid";
      if (valId) payment.valId = valId;
      payment.rawGatewayResponse = {
        ...(payment.rawGatewayResponse || {}),
        callback: body,
      };
      await payment.save();
    }

    // Redirect user back to Billing page
    res.redirect(`${FRONTEND_URL}/billing?paid=1`);
  } catch (err) {
    console.log("SSL SUCCESS ERROR:", err);
    res.redirect(`${FRONTEND_URL}/billing?paid=0`);
  }
}

router.get("/ssl/success", markPaid);
router.post("/ssl/success", markPaid);

async function markFailed(req, res, status) {
  try {
    const body = { ...req.query, ...req.body };
    const tranId = body.tran_id;
    const paymentId = body.value_a;

    let payment = null;
    if (paymentId) payment = await Payment.findById(paymentId);
    if (!payment && tranId) {
      payment = await Payment.findOne({ transactionId: tranId });
    }

    if (payment) {
      payment.status = status;
      payment.rawGatewayResponse = {
        ...(payment.rawGatewayResponse || {}),
        callback: body,
      };
      await payment.save();
    }

    res.redirect(
      `${FRONTEND_URL}/billing?paid=0&status=${status.toLowerCase()}`
    );
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/billing?paid=0`);
  }
}

router.get("/ssl/fail", (req, res) => markFailed(req, res, "Failed"));
router.post("/ssl/fail", (req, res) => markFailed(req, res, "Failed"));
router.get("/ssl/cancel", (req, res) => markFailed(req, res, "Cancelled"));
router.post("/ssl/cancel", (req, res) => markFailed(req, res, "Cancelled"));

// IPN (server-to-server) — optional extra confirmation
router.post("/ssl/ipn", async (req, res) => {
  try {
    const body = req.body || {};
    const tranId = body.tran_id;
    const paymentId = body.value_a;
    let payment = null;
    if (paymentId) payment = await Payment.findById(paymentId);
    if (!payment && tranId) {
      payment = await Payment.findOne({ transactionId: tranId });
    }
    if (payment && body.status === "VALID") {
      payment.status = "Paid";
      payment.valId = body.val_id;
      await payment.save();
    }
    res.status(200).send("IPN received");
  } catch (err) {
    res.status(500).send("IPN error");
  }
});

module.exports = router;
