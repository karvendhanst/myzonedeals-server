import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "myzonedealsapp@gmail.com",
    pass: "yqyb naxl ijkd nezs",
  },
});

const sendEmail = async (to, subject, html) => {
  console.log("sending email...");
  await transporter.sendMail({
    from: `"My Zone Deals" <myzonedealsapp@gmail.com>`,
    to,
    subject,
    html, 
  });
  console.log("email sent");
};

sendEmail("test@example.com", "Test", "<p>Test</p>")
  .then(() => console.log("done"))
  .catch(err => console.error("error:", err));
