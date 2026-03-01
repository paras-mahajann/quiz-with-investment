const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

const { pushQuestionController, revealAnswerController, getDashboard } = require("../controllers/gameController");
const { adminRegisterController, adminLoginController} = require("../controllers/adminAuthController");

//leaderboarch baki aahe check karaych

//protected routes
router.post("/push-question", adminAuthMiddleware, pushQuestionController);
router.post("/reveal-answer", adminAuthMiddleware, revealAnswerController);
router.get("/dashboard", adminAuthMiddleware, getDashboard);


//auth



router.post("/register", adminRegisterController);
router.post("/login", adminLoginController);


module.exports = router;