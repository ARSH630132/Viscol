import { Resend } from "resend";

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error("Resend email service is not configured");
    error.status = 500;
    throw error;
  }

  return new Resend(process.env.RESEND_API_KEY);
};

export const sendOtpEmail = async ({ to, otp }) => {
  if (!process.env.RESEND_FROM_EMAIL) {
    const error = new Error("Resend sender email is not configured");
    error.status = 500;
    throw error;
  }

  try {
    await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      replyTo: process.env.RESEND_REPLY_TO || "viscolproject@gmail.com",
      subject: "College Visitor OTP Verification",
      text: [
        `Your College Visitor OTP is ${otp}.`,
        "This OTP is valid for 5 minutes.",
        "If you did not request this OTP, please ignore this email.",
      ].join("\n"),
      html: [
        "<p>Your College Visitor OTP is:</p>",
        `<p><strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong></p>`,
        "<p>This OTP is valid for 5 minutes.</p>",
        "<p>If you did not request this OTP, please ignore this email.</p>",
      ].join(""),
    });
  } catch (providerError) {
    console.error("Resend OTP email failed", {
      name: providerError?.name,
      message: providerError?.message,
      statusCode: providerError?.statusCode,
    });

    const error = new Error("Unable to send OTP email");
    error.status = 502;
    throw error;
  }
};

export const sendApplicationNotification = async (payload) => {
  if (!process.env.RESEND_FROM_EMAIL || !process.env.ADMIN_EMAIL) {
    const error = new Error("Application notification email is not configured");
    error.status = 500;
    throw error;
  }

  await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: process.env.ADMIN_EMAIL,
    replyTo: process.env.RESEND_REPLY_TO || "viscolproject@gmail.com",
    subject: "New Apply Through College Visitor submission",
    text: [
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Course: ${payload.course}`,
      `Budget: ${payload.budget}`,
      `City: ${payload.city}`,
      `Preferred College: ${payload.preferred_college || "Not provided"}`,
      `Submitted At: ${payload.submitted_at}`,
    ].join("\n"),
    html: [
      `<p>Name: ${payload.name}</p>`,
      `<p>Phone: ${payload.phone}</p>`,
      `<p>Email: <a href="mailto:${payload.email}">${payload.email}</a></p>`,
      `<p>Course: ${payload.course}</p>`,
      `<p>Budget: ${payload.budget}</p>`,
      `<p>City: ${payload.city}</p>`,
      `<p>Preferred College: ${payload.preferred_college || "Not provided"}</p>`,
      `<p>Submitted At: ${payload.submitted_at}</p>`,
    ].join(""),
  });
};
