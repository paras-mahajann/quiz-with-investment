const express = require('express')
const router = express.Router();

const participantAuthController = require('../controllers/participantAuthController')

const participantAuthMiddleware = require('../middlewares/participantAuthMiddleware')

const {submitAnswerController,getDashboard} = require('../controllers/gameController')



router.post('/submit-answer',participantAuthMiddleware,submitAnswerController)

router.get('/dashboard',participantAuthMiddleware,getDashboard)

router.post('/register',participantAuthController.registerController);

router.post('/login',participantAuthController.loginController)




module.exports = router;