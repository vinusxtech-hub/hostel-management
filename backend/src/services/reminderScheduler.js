const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const { getLocalDateString, getLocalTimeStr } = require('../utils/dateHelper');

// Trigger auto reminders for unmarked students
const triggerAutoReminders = async () => {
  try {
    const today = getLocalDateString();
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

// Trigger auto absences for unmarked students
const triggerAutoAbsences = async () => {
  try {
    const today = getLocalDateString();
    const totalStudents = await User.find({ role: 'student' });
    const todayRecords = await Attendance.find({ date: today });
    const markedUserIds = new Set(todayRecords.map(r => r.userId.toString()));

    const unmarkedStudents = totalStudents.filter(s => !markedUserIds.has(s._id.toString()));

    if (unmarkedStudents.length === 0) {
      console.log(`[Auto Absences] All students have marked attendance or leaves for today (${today}).`);
      return;
    }

    console.log(`[Auto Absences] Marking ${unmarkedStudents.length} unmarked students as Absent for date ${today}...`);

    for (const student of unmarkedStudents) {
      try {
        await Attendance.create({
          userId: student._id,
          date: today,
          timestamp: new Date(),
          time: '00:00',
          latitude: 0,
          longitude: 0,
          distance: 0,
          status: 'Absent',
          location: 'Outside'
        });
      } catch (err) {
        if (err.code !== 11000) {
          console.error(`[Auto Absences] Failed to mark student ${student.name} as Absent:`, err);
        }
      }
    }
    console.log(`[Auto Absences] Successfully marked ${unmarkedStudents.length} students as Absent.`);
  } catch (error) {
    console.error('[Auto Absences] Error marking absences:', error);
  }
};

let lastTriggeredDate = '';
let lastAbsenceDate = '';

// Start the daily reminder background scheduler
const startReminderScheduler = () => {
  console.log('[Reminder Scheduler] Initializing daily check-in reminder scheduler...');
  
  // Run check every minute
  setInterval(async () => {
    try {
      const now = new Date();
      const todayDateStr = getLocalDateString(now);
      
      const timeStr = getLocalTimeStr(now);
      const [hours, minutes] = timeStr.split(':').map(Number);

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

      // Trigger at cutoffTime to mark absent
      if (hours === cutoffH && minutes === cutoffM) {
        if (lastAbsenceDate !== todayDateStr) {
          console.log(`[Reminder Scheduler] Triggering daily absence marking at ${hours}:${String(minutes).padStart(2, '0')} IST for date ${todayDateStr}...`);
          lastAbsenceDate = todayDateStr;
          await triggerAutoAbsences();
        }
      }

      // Resiliency Check: If current time is past cutoffTime and lastAbsenceDate is not todayDateStr,
      // it means the server restarted after the cutoffTime or was offline, and hasn't marked absences for today yet!
      const currentMin = hours * 60 + minutes;
      const cutoffMin = cutoffH * 60 + cutoffM;
      if (currentMin > cutoffMin && lastAbsenceDate !== todayDateStr) {
        console.log(`[Reminder Scheduler] Resiliency check triggered: current time (${timeStr}) is past cutoff (${settings.cutoffTime}) and absences were not yet marked for today (${todayDateStr}). Triggering now...`);
        lastAbsenceDate = todayDateStr;
        await triggerAutoAbsences();
      }
    } catch (err) {
      console.error('[Reminder Scheduler] Error in check interval:', err);
    }
  }, 60000);
};

module.exports = {
  startReminderScheduler,
  triggerAutoReminders,
  triggerAutoAbsences
};
