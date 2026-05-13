import otpGenerator from "otp-generator";

console.log("Generating OTP...");
const otp = otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  lowerCaseAlphabets: false,
  specialChars: false,
});
console.log("OTP:", otp);
