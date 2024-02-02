import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer";

const generateJwt = (id) => {
  const token = jsonwebtoken.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email, data,subjet) => {
  
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.NODEMAIL_EMAIL,
      pass: process.env.NODEMAIL_PASSWORD,
    },
  });
 await transporter.sendMail({
    from: "hazrathali128@gmail.com",
    to: email,
    subject: subjet,
    text: `Your OTP for registration is: ${data}`,
  });
};

export const verifyOTPUser = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.otp || user.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }
    const currentTime = new Date();
    if (currentTime > user.otpExpiresAt) {
      return res.status(401).json({ message: "OTP has expired" });
    }
    user.verificationStatus = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return res.json({ message: "OTP verification successful", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const twoStepVerification = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.otp || user.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }
    const currentTime = new Date();
    if (currentTime > user.otpExpiresAt) {
      return res.status(401).json({ message: "OTP has expired" });
    }
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    const token = generateJwt(user._id);
    return res.json({ message: "OTP verification successful", user ,token});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findOne({email})
    if (user){
      return res.json({message:'user is already present with this email'})
    }
    const hashPassword = await bcrypt.hash(password, 8);
    const newUser = new User({ name, email, password: hashPassword });
    const otp = generateOTP();
    const subjet = "OTP Verification ✔"
    await sendOTP(email, otp,subjet);
    newUser.otp = otp;
    newUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await newUser.save();
    const token = generateJwt(newUser._id);
    return res.json({
      message: "User successfully registered. OTP sent for verification.",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
    try {
      const { email, password} = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid =  bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
      }

      if(user.twofa != true){
    const token = generateJwt(user._id);
        return res.json({
          message:"user login successfull",
          token
        })
      }
      const otp = generateOTP();
      const subjet = "OTP Verification ✔"
      await sendOTP(email, otp,subjet);
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      await user.save();
      return res.json({
        message: "Two-factor authentication required. OTP sent for verification.",
        user,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };




export const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid =  bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashNewPassword = await bcrypt.hash(newPassword, 8);

    user.password = hashNewPassword;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = jsonwebtoken.sign({ id: user._id }, process.env.RESET_SECRET, { expiresIn: "1h" });

    user.resetToken = resetToken;
    user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); 
    await user.save();
    console.log(resetToken)

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subjet = "Reset password"
    await sendOTP(email,resetLink,subjet);

    return res.json({ message: "Password reset instructions sent to your email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const user = await User.findOne({ resetToken });

    if (!user) {
      return res.status(404).json({ message: "Invalid or expired reset token" });
    }

    const currentTime = new Date();
    if (currentTime > user.resetTokenExpiresAt) {
      return res.status(401).json({ message: "Reset token has expired" });
    }

    const hashNewPassword = await bcrypt.hash(newPassword, 8);

    user.password = hashNewPassword;
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const protectedApi = (req,res)=>{
try {
  res.json({
    message:'protected api'
  })
} catch (error) {
  res.json(error)
}
}



export const resendverifyotp = async (req,res)=>{
  try {
    const {email} = req.body;
    if (!email){
      return res.json({message:'enter the email'})
    }
    const user = await User.findOne({email})

    if (!user ){
      return res.json({message:'user is not present with this email'})
    }

    const otp = generateOTP();
    const subjet = "OTP Verification ✔"
    await sendOTP(email, otp,subjet);

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save()

    return res.json({
      message:'opt send successfully'
    })
  } catch (error) {
    res.json(error)
  }
}



export const switchtwofa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let status = user.twofa;
    status = !status; 

    user.twofa = status;
    await user.save();

    return res.json({
      message: `Two-factor authentication is ${status ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};