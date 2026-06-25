const getLocalDateString = (date = new Date()) => {
  if (!date) return '';
  const d = (date instanceof Date) ? date : new Date(date);
  // sv-SE locale formats as YYYY-MM-DD
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
};

const getLocalTimeStr = (date = new Date()) => {
  if (!date) return '';
  const d = (date instanceof Date) ? date : new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  });
};

module.exports = {
  getLocalDateString,
  getLocalTimeStr
};
