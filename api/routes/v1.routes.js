const express = require("express");
const router = express.Router();
const { registerUser, loginUser, protectedRoute} = require("../controllers/user.controller");
const {dataProcessing} = require("../controllers/data.controller")

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/data", protectedRoute, dataProcessing)

module.exports = router;