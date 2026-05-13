import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: undefined,
    pass: undefined,
  },
});

const test = async () => {
  try {
    console.log("Sending email...");
    await transporter.sendMail({
      from: `"My Zone Deals" <undefined>`,
      to: "test@example.com",
      subject: "Test",
      html: "<p>test</p>",
    });
    console.log("Sent.");
  } catch (err) {
    console.error("Error:", err.message);
  }
};

test();
