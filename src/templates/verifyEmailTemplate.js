const verifyEmailTemplate = (otp) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center;">
      
      <h2 style="color: #ff7a00; margin-bottom: 10px;">My Zone Deals</h2>
      
      <p style="font-size: 15px; color: #555;">
        Thank you for registering with <strong>My Zone Deals</strong>. 
        Please use the One-Time Password (OTP) below to verify your email address.
      </p>
      
      <div style="margin: 25px 0;">
        <span style="display: inline-block; font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #ff7a00; background: #fff4e6; padding: 12px 20px; border-radius: 6px;">
          ${otp}
        </span>
      </div>
      
      <p style="font-size: 14px; color: #777;">
        This OTP will expire in <strong>5 minutes</strong>.
      </p>
      
      <p style="font-size: 13px; color: #999; margin-top: 20px;">
        If you did not request this verification, please ignore this email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
      
      <p style="font-size: 12px; color: #aaa;">
        © ${new Date().getFullYear()} My Zone Deals. All rights reserved.
      </p>
    </div>
  </div>
  `;
};

export default verifyEmailTemplate;
