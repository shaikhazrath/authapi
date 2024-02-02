import express from 'express'
import { changePassword, forgotPassword, login, protectedApi, register, resendverifyotp, resetPassword, switchtwofa, twoStepVerification, verifyOTPUser } from '../controller/authController.js'
import { authMiddleware } from '../authmiddleware.js'
const router = express.Router()

router.post('/register',register)
router.post('/login',login)
router.post('/verifyuser',verifyOTPUser)
router.post('/twostepverification',twoStepVerification)
router.post('/changepassword',changePassword)
router.post('/forgotpassword',forgotPassword)
router.post('/resetpassword',resetPassword)
router.get('/protectedapi', authMiddleware,protectedApi)
router.get('/twofa', authMiddleware , switchtwofa)
router.post('/resendverifyotp',resendverifyotp)
export default router