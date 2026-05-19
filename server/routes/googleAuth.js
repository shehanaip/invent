const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");

// start google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET);

    res.redirect(`http://localhost:3000/?token=${token}`);
  }
);

module.exports = router;