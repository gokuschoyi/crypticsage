const express = require('express')
const router = express.Router()

const AuthController = require('../../controllers/auth-controller')

router.post('/login', AuthController.loginUser)
router.post('/signup', AuthController.createNewUser)


module.exports = router