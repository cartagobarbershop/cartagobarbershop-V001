// Google Apps Script bridge for Sheets + GREEN-API
// 1) Fill your GREEN-API credentials below.
// 2) Create sheets named: Clients, Appointments, Loyalty, Notifications.
// 3) Deploy as Web App (Anyone) for the webhook URL; add it in GREEN-API settings.

const ID_INSTANCE = 'YOUR_ID_INSTANCE'; // TODO: move to PropertiesService / env vars
const API_TOKEN = 'YOUR_API_TOKEN';     // TODO: move to PropertiesService / env vars
const DATA_VERSION = 2;

const SHEETS = {
  clients: 'Clients',
  appointments: 'Appointments',
  loyalty: 'Loyalty',
  notifications: 'Notifications'
};

const getSheet = (name) => SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);

// === Green API helpers ===
function sendWhatsApp(chatId, message) {
  const url = `https://api.green-api.com/waInstance${ID_INSTANCE}/sendMessage/${API_TOKEN}`;
  const payload = {
    chatId: chatId.endsWith('@c.us') ? chatId : `${chatId}@c.us`,
    message
  };
  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    logNotification('outgoing', chatId, message, res.getResponseCode());
    return res.getContentText();
  } catch (err) {
    logNotification('outgoing-error', chatId, String(err), 'ERR');
    throw err;
  }
}

function logNotification(direction, phone, message, status) {
  const sheet = getSheet(SHEETS.notifications);
  if (!sheet) return;
  sheet.appendRow([new Date(), direction, phone, message, status]);
}

// === Appointment confirmation and reminders ===
function confirmLatestPending(phone) {
  const sheet = getSheet(SHEETS.appointments);
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i > 0; i--) {
    // Columns (example): A=Date, B=Time, C=Phone, D=Barber, E=?, F=Status
    if (rows[i][2] === phone && rows[i][5] === 'Pending') {
      sheet.getRange(i + 1, 6).setValue('Confirmed');
      sendWhatsApp(phone, 'Gracias! Tu cita ha sido confirmada. \ud83d\udc88');
      return true;
    }
  }
  return false;
}

// Time-driven trigger, hourly
function sendReminders() {
  const sheet = getSheet(SHEETS.appointments);
  const now = new Date();
  const rows = sheet.getDataRange().getValues();
  rows.forEach((row, idx) => {
    if (idx === 0) return;
    const [date, time, phone,, status] = row;
    if (status !== 'Confirmed') return;
    const apptDate = new Date(`${Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')}T${time}`);
    const diffH = (apptDate.getTime() - now.getTime()) / 1000 / 3600;
    if (diffH > 23 && diffH < 25) {
      sendWhatsApp(phone, `Recordatorio: tu cita es mañana a las ${time}.`);
    } else if (diffH > 1.5 && diffH < 2.5) {
      sendWhatsApp(phone, `Cita en 2h (${time}). \u00a1Te esperamos!`);
    }
  });
}

// === Loyalty hooks ===
function awardPoints(phone, points) {
  const sheet = getSheet(SHEETS.clients);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === phone) {
      const current = Number(values[i][2] || 0);
      sheet.getRange(i + 1, 3).setValue(current + points);
      getSheet(SHEETS.loyalty)?.appendRow([new Date(), phone, points, 'earn']);
      return current + points;
    }
  }
  return null;
}

function logIncomingMessage(phone, text) {
  getSheet(SHEETS.notifications)?.appendRow([new Date(), 'incoming', phone, text, 'OK']);
}

// === Webhook entrypoint ===
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.snapshot) {
    if (data.snapshot.version && data.snapshot.version !== DATA_VERSION) {
      return ContentService.createTextOutput('VERSION_MISMATCH');
    }
    PropertiesService.getScriptProperties().setProperty('SNAPSHOT', JSON.stringify(data.snapshot));
    return ContentService.createTextOutput('OK');
  }
  if (data.typeWebhook === 'incomingMessageReceived') {
    const phone = data.senderData?.sender;
    const text = (data.messageData?.textMessageData?.textMessage || '').toLowerCase();
    logIncomingMessage(phone, text);

    if (text === '1' || text === 'confirm') {
      const confirmed = confirmLatestPending(phone);
      if (!confirmed) {
        sendWhatsApp(phone, 'No encontramos citas pendientes. Escribe "cita" para agendar.');
      }
    } else if (text === 'points' || text === 'puntos') {
      const clientSheet = getSheet(SHEETS.clients);
      const values = clientSheet.getDataRange().getValues();
      const row = values.find(r => r[0] === phone);
      const pts = row ? row[2] : 0;
      sendWhatsApp(phone, `Tienes ${pts} puntos acumulados.`);
    }
  }
  return ContentService.createTextOutput('OK');
}

// Allow reading the latest synced snapshot (used by the React app)
function doGet() {
  const snap = PropertiesService.getScriptProperties().getProperty('SNAPSHOT');
  if (!snap) return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
  return ContentService.createTextOutput(JSON.stringify({ snapshot: JSON.parse(snap) })).setMimeType(ContentService.MimeType.JSON);
}

// === Manual helper: send message from sheet selection ===
function sendFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const phone = sheet.getRange('A2').getValue();
  const message = sheet.getRange('B2').getValue();
  sendWhatsApp(phone, message);
  sheet.getRange('C2').setValue(`Sent ${new Date()}`);
}
