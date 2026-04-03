import cron from 'node-cron';
import { Student, AppSetting } from '../../db/index.js';
import { fetchCodeforcesUserData } from './fetch_data.js';
import { checkInactivityAndSendEmail } from './email_sender.js';
import { getWeeklySummary, getRecommendedProblems } from './ai_services.js'


export const startCron = async () => {
  const settings = await AppSetting.findOne({});

  if (!settings || !settings.cronTime) {
    await AppSetting.create({
        cronTime: '02:00',
        cronFrequency: 'daily',
        emailRemindersEnabled: true,
        inactivityDays: 7
      });
      console.log('No cronTime found in DB. Default AppSetting inserted into DB');
  }

  const [hour, minute] = settings.cronTime.split(':').map(Number);
  const cronExpr = `${minute} ${hour} * * *`;

  console.log(`Scheduling daily sync at ${settings.cronTime} (${cronExpr})`);

  cron.schedule(cronExpr, async () => {
    console.log('Running daily sync job...');

    try {
      const students = await Student.find({});
      const resultArr = [];

      for (const student of students) {
        if (!student.codeforces_handle) continue;

        const cfData = await fetchCodeforcesUserData(student.codeforces_handle);
        await Student.findByIdAndUpdate(student._id, {
          currentRating: cfData.currentRating,
          maxRating: cfData.maxRating,
          lastUpdated: new Date()
        });

        if (settings.emailRemindersEnabled) {
          const result = await checkInactivityAndSendEmail(student, settings.inactivityDays);
          resultArr.push(result);
        }
      }

      console.log('Daily sync completed successfully');
    } catch (error) {
      console.error('Daily sync failed:', error.message);
    }
  });
};

cron.schedule("0 9 * * 0", async () => {
  console.log("Running Sunday AI digest...");
  const students = await Student.find({ email: { $exists: true } });

  for (const student of students) {
    try {
      const summary = await getWeeklySummary(student);

      // Reuse your existing sendEmail function
      await checkInactivityAndSendEmail({
        to: student.email,
        subject: `Your Weekly CP Digest — ${student.codeforces_handle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
            <h2>👋 Hey ${student.name || student.codeforces_handle}!</h2>
            <p>${summary}</p>
            <a href="${process.env.FRONTEND_URL}/profile/${student.codeforces_handle}"
               style="background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
              View Full Analysis →
            </a>
            <p style="color:#888;font-size:12px;margin-top:24px">
              Unsubscribe anytime from Settings.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error(`Failed digest for ${student.codeforces_handle}:`, err);
    }
  }
});