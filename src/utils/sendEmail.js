import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
});

transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP Server Ready");
  }
});

export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"My Zone Deals" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};