// // import nodemailer from "nodemailer";
// // import dns from "dns";

// // dns.setDefaultResultOrder("ipv4first");

// // const transporter = nodemailer.createTransport({
// //   host: "smtp.gmail.com",
// //   port: 587,
// //   secure: false,
// //   auth: {
// //     user: process.env.EMAIL_USER,
// //     pass: process.env.EMAIL_PASS,
// //   },
// // });

// // transporter.verify((error, success) => {
// //   if (error) {
// //     console.log("SMTP ERROR:", error);
// //   } else {
// //     console.log("SMTP SERVER READY");
// //   }
// // });

// // export const sendEmail = async (to, subject, html) => {
// //   await transporter.sendMail({
// //     from: `"My Zone Deals" <${process.env.EMAIL_USER}>`,
// //     to,
// //     subject,
// //     html,
// //   });
// // };


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


import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },

  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
});

transporter.verify((error) => {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP READY");
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"My Zone Deals" <${process.env.BREVO_SENDER}>`,
      to,
      subject,
      html,
    });

    console.log("MAIL SENT:", info.messageId);

  } catch (error) {
    console.log("MAIL ERROR:", error);
  }
};