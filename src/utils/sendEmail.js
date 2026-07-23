// import nodemailer from "nodemailer";
// import dns from "dns";

// dns.setDefaultResultOrder("ipv4first");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,

//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
   

//   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

// transporter.verify((error, success) => {
//   if (error) {
//     console.log("SMTP ERROR:", error);
//   } else {
//     console.log("SMTP SERVER READY");
//   }
// });

// export const sendEmail = async (to, subject, html) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"My Zone Deals" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });

//     console.log("EMAIL SENT:", info.messageId);
//   } catch (error) {
//     console.log("SEND EMAIL ERROR:", error);
//   }
// };


import axios from "axios";

export const sendEmail = async (to, subject, html) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "My Zone Deals",
          email: process.env.BREVO_SENDER,
        },

        to: [
          {
            email: to,
          },
        ],

        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("EMAIL SENT:", response.data);

  } catch (error) {
    console.log(
      "BREVO API ERROR:",
      error.response?.data || error.message
    );
  }
};