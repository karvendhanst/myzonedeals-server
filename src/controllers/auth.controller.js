import otpGenerator from "otp-generator";
import bcrypt from "bcryptjs";
import Dealer from "../models/Dealer.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import verifyEmailTemplate from "../templates/verifyEmailTemplate.js";
import { generateToken } from "../utils/generateToken.js";


export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await Dealer.findOne({ email });

    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const user = await Dealer.create({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
    });

    await sendEmail(
      email,
      "Verify Your Email – My Zone Deals",
      verifyEmailTemplate(otp)
    );

    res.status(201).json({
      message: "OTP sent to your email",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await Dealer.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT
    const token = generateToken(user);

    res.json({ message: "Email verified successfully", token });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Dealer.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendEmail(
      email,
      "Verify Your Email – My Zone Deals",
      verifyEmailTemplate(otp)
    );

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Dealer.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



