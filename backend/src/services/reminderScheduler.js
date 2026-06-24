const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');

// Trigger auto reminders for unmarked students
const triggerAutoReminders = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = await User.find({ role: 'student' });
    const todayRecords = await Attendance.find({ date: today });
    const markedUserIds = new Set(todayRecords.map(r => r.userId.toString()));

    const unmarkedStudents = totalStudents.filter(s => !markedUserIds.has(s._id.toString()));

    if (unmarkedStudents.length === 0) {
      console.log('[Auto Reminders] All students have marked attendance today. No reminders sent.');
      return;
    }

    console.log(`[Auto Reminders] Sending reminders to ${unmarkedStudents.length} unmarked students...`);

    // Find the admin user to set as the sender of notifications, default to null or the first admin found
    const adminUser = await User.findOne({ role: 'admin' });
    const senderId = adminUser ? adminUser._id : null;

    for (const student of unmarkedStudents) {
      try {
        await Notification.create({
          recipient: student._id,
          sender: senderId,
          title: `⏰ Attendance Reminder`,
          message: `Please mark your attendance for today. Make sure you are inside the campus to check in.`,
          type: 'attendance'
        });
      } catch (err) {
        console.error(`[Auto Reminders] Failed to send reminder to student ${student.name}:`, err);
      }
    }
    console.log(`[Auto Reminders] Successfully sent ${unmarkedStudents.length} reminders.`);
  } catch (error) {
    console.error('[Auto Reminders] Error sending attendance reminders:', error);
  }
};

let lastTriggeredDate = '';

// Start the daily reminder background scheduler
const startReminderScheduler = () => {
  console.log('[Reminder Scheduler] Initializing daily check-in reminder scheduler...');
  
  // Run check every minute
  setInterval(async () => {
    try {
      const now = new Date();
      // Get current date and time in IST (UTC+5:30)
      const istTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istTime = new Date(istTimeStr);
      
      const todayDateStr = istTime.toISOString().split('T')[0];
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();

      // Fetch active settings to dynamically compute reminder time
      const settings = await Settings.findOne() || { checkInTime: '20:00', cutoffTime: '22:00' };
      const [cutoffH, cutoffM] = settings.cutoffTime.split(':').map(Number);

      // Trigger 1 hour before cutoffTime
      const reminderH = (cutoffH - 1 + 24) % 24;
      const reminderM = cutoffM;

      if (hours === reminderH && minutes === reminderM) {
        if (lastTriggeredDate !== todayDateStr) {
          console.log(`[Reminder Scheduler] Triggering daily check-in reminders at ${hours}:${String(minutes).padStart(2, '0')} IST for date ${todayDateStr}...`);
          lastTriggeredDate = todayDateStr;
          await triggerAutoReminders();
        }
      }
    } catch (err) {
      console.error('[Reminder Scheduler] Error in check interval:', err);
    }
  }, 60000);
};

module.exports = {
  startReminderScheduler,
  triggerAutoReminders
};
