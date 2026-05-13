import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "myzonedealsapp@gmail.com",
    pass: "yqyb naxl ijkd nezs",
  },
});

const test = async () => {
  try {
    console.log("Sending email...");
    await transporter.sendMail({
      from: `"My Zone Deals" <myzonedealsapp@gmail.com>`,
      to: "test@gmail.com1",
      subject: "Test",
      html: "<p>test</p>",
    });
    console.log("Sent.");
  } catch (err) {
    console.error("Error:", err.message);
  }
};

test();
