import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const users = {};
const otpStore = {};

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASS,
    },
});

async function sendOtpEmail(to, otp, subject) {
    await transporter.sendMail({
        from: `Student Chat Platform <${process.env.OUTLOOK_USER}>`,
        to,
        subject,
        text: `Your verification code is ${otp}. It will expire in 5 minutes.`,
    });
}


app.post("/api/register", async (req, res) => {
    const { name, course, semYear, alumni, email, password } =
        req.body;

    if (!email || !email.endsWith("@gehu.ac.in"))
        return res.json({ success: false, message: "Please use your college email (must end with @gehu.ac.in)." });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    try {
        await sendOtpEmail(email, otp, "Student Chat - Email Verification OTP");

        users[email] = { name, course, semYear, alumni, password, verified: false };

        res.json({ success: true, message: "OTP sent successfully to your college email." });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Failed to send OTP. Check email configuration." });
    }
});

app.post("/api/verify-otp", (req, res) => {
    const { email, otpCode } = req.body;
    const record = otpStore[email];

    if (!record) return res.json({ success: false, message: "OTP not found or expired." });
    if (Date.now() > record.expires) return res.json({ success: false, message: "OTP expired. Please request a new one." });
    if (String(record.otp) !== String(otpCode)) return res.json({ success: false, message: "Invalid OTP." });

    users[email].verified = true;
    delete otpStore[email];

    const user = {
        email,
        name: users[email].name,
        course: users[email].course,
        semYear: users[email].semYear,
        alumni: users[email].alumni,
    };

    res.json({ success: true, message: "Email verified successfully!", user });
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!users[email]) return res.json({ success: false, message: "No account found. Please register first." });
    if (!users[email].verified) return res.json({ success: false, message: "Please verify your email first." });
    if (users[email].password !== password) return res.json({ success: false, message: "Incorrect password." });

    const user = {
        email,
        name: users[email].name,
        course: users[email].course,
        semYear: users[email].semYear,
        alumni: users[email].alumni,
    };

    res.json({ success: true, user });
});

app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;

    if (!users[email]) return res.json({ success: false, message: "Email not found." });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    try {
        await sendOtpEmail(email, otp, "Student Chat Password Reset OTP");
        res.json({ success: true, message: "Reset OTP sent to your college email." });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Failed to send reset OTP." });
    }
});

app.post("/api/reset-password", (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    const record = otpStore[email];

    if (!record) return res.json({ success: false, message: "OTP not found or expired." });
    if (Date.now() > record.expires) return res.json({ success: false, message: "OTP expired." });
    if (String(record.otp) !== String(otpCode)) return res.json({ success: false, message: "Invalid OTP." });

    users[email].password = newPassword;
    delete otpStore[email];

    res.json({ success: true, message: "Password reset successful!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(
    `Server running on http://localhost:${PORT}`
));