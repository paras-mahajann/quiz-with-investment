const express = require('express')
const router = express.Router();

const participantAuthController = require('../controllers/participantAuthController')

const participantAuthMiddleware = require('../middlewares/participantAuthMiddleware')

const {submitAnswerController,getDashboard,getCurrentQuestion} = require('../controllers/gameController')



router.post('/submit-answer',participantAuthMiddleware,submitAnswerController)

router.get('/dashboard',participantAuthMiddleware,getDashboard)

router.post('/register',participantAuthController.registerController);

router.post('/login',participantAuthController.loginController)

router.get('/current-question',participantAuthMiddleware,getCurrentQuestion);




module.exports = router;