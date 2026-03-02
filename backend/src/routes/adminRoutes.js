const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");

const {
  pushQuestionController,
  revealAnswerController,
  getDashboard,
  resetGame,
  getCurrentQuestion,
  setDefaultBalance
} = require("../controllers/gameController");
const { adminRegisterController, adminLoginController} = require("../controllers/adminAuthController");
const { registerParticipantByAdminController } = require("../controllers/participantAuthController");
const {addQuestionController,getQuestionsController} = require('../controllers/questionController')

//leaderboarch baki aahe check karaych

//protected routes
router.post("/push-question", adminAuthMiddleware, pushQuestionController);
router.post("/reveal-answer", adminAuthMiddleware, revealAnswerController);
router.get("/dashboard", adminAuthMiddleware, getDashboard);
router.get('/get-questions',adminAuthMiddleware,getQuestionsController);
router.post('/add-question',adminAuthMiddleware,addQuestionController);
router.post('/game-reset',adminAuthMiddleware,resetGame);
router.post('/set-default-balance',adminAuthMiddleware,setDefaultBalance);
router.get('/current-question',adminAuthMiddleware,getCurrentQuestion);
router.post('/register-participant', adminAuthMiddleware, registerParticipantByAdminController);


//auth


router.post("/register", adminRegisterController);
router.post("/login", adminLoginController);


module.exports = router;
