import nodemailer from "nodemailer"; 
import dotenv from "dotenv"; 
 
dotenv.config(); 
 
const transporter = nodemailer.createTransport({ 
  host: "smtp.office365.com", 
  port: 587, 
  secure: false, 
  auth: { 
    user: process.env.OUTLOOK_USER, 
    pass: process.env.OUTLOOK_PASS, 
  }, 
}); 
 
async function sendTest() { 
  try { 
    await transporter.sendMail({ 
      from: `"Test Mail" <${process.env.OUTLOOK_USER}>`, 
      to: process.env.OUTLOOK_USER, 
      subject: "Outlook Test Email", 
      text: "This is a test from Student Chat backend.", 
    }); 
    console.log(" ✅ Email sent successfully!"); 
  } catch (err) { 
    console.error(" ❌ Failed to send email:", err); 
  } 
} 
 
sendTest(); 