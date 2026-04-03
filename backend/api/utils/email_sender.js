import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import nodemailer from 'nodemailer';
import { Student } from '../../db/index.js';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
console.log(process.env.EMAIL_USER, " is email user")
console.log(process.env.EMAIL_PASS, " is email user pass")
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter setup failed:", error.message);
  } else {
    console.log("Email transporter is ready to send notifications");
  }
});
export const checkInactivityAndSendEmail = async (student) => {
  const { codeforces_handle, email, name, emailRemindersSent, lastReminderSentAt } = student;
  if (!codeforces_handle || !email) {
    console.warn(`Missing handle or email for student: ${name}`);
    return;
  }

  try {
    const res = await axios.get(`https://codeforces.com/api/user.status?handle=${codeforces_handle}&count=100`);
    const submissions = res.data.result;

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const activeRecently = submissions.some(sub => sub.verdict === 'OK' && sub.creationTimeSeconds * 1000 >= sevenDaysAgo);

    if (activeRecently) {
      console.log(`${name} is active. No email sent.`);
      return;
    }

    const alreadyNotified = lastReminderSentAt && (now - new Date(lastReminderSentAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

    if (alreadyNotified) {
      console.log(`Reminder recently sent to ${name}. Skipping.`);
      return;
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🚀 Codeforces Activity Reminder',
      html: `
        <p>Hi ${name},</p>
        <p>We noticed you haven't submitted any Codeforces problems in the last 7 days.</p>
        <p>Keep practicing to stay sharp!</p>
        <p>– TLE Eliminators</p>
      `
    });

    console.log(`Email sent to ${email} (ID: ${info.messageId})`);

    await Student.findByIdAndUpdate(student._id, {
      emailRemindersSent: (emailRemindersSent || 0) + 1,
      lastReminderSentAt: new Date()
    });
  } catch (err) {
    console.error(`Failed to process ${name} (${codeforces_handle}):`, err.message);
  }
};
