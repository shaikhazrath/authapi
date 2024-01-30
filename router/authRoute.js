import express from 'express'
import { changePassword, forgotPassword, login, register, resetPassword, twoStepVerification, verifyOTPUser } from '../controller/authController.js'
const router = express.Router()

router.post('/register',register)
router.post('/login',login)
router.post('/verifyuser',verifyOTPUser)
router.post('/twostepverification',twoStepVerification)
router.post('/changepassword',changePassword)
router.post('/forgotpassword',forgotPassword)
router.post('/resetpassword',resetPassword)



export default router