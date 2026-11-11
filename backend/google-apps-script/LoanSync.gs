const APPLICATIONS_HEADERS = [
  "Application ID",
  "Student Name",
  "Student Email",
  "Contact",
  "Submitted At",
  "Last Updated At",
  "Bank / Provider",
  "Loan Type",
  "Course",
  "College",
  "Requested Amount",
  "Co-borrower Name",
  "Co-borrower Relationship",
  "Student Message",
  "Status",
  "Admin Remark",
];

const HISTORY_HEADERS = [
  "Event ID",
  "Application ID",
  "Event",
  "Event Date",
  "Previous Status",
  "New Status",
  "Admin Remark",
];

function doPost(event) {
  try {
    const payload = JSON.parse(event?.postData?.contents || "{}");
    const properties = PropertiesService.getScriptProperties();
    const configuredSecret = properties.getProperty("LOAN_SYNC_SECRET");

    if (!configuredSecret || !constantTimeEquals_(String(payload.secret || ""), configuredSecret)) {
      return jsonResponse_({ ok: false, message: "Unauthorized" });
    }

    validatePayload_(payload);
    const spreadsheetId = properties.getProperty("LOAN_SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("Loan spreadsheet is not configured");

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const applicationsSheet = getOrCreateSheet_(
        spreadsheet,
        properties.getProperty("LOAN_APPLICATIONS_SHEET_NAME") || "Loan Applications",
        APPLICATIONS_HEADERS,
      );
      const historySheet = getOrCreateSheet_(
        spreadsheet,
        properties.getProperty("LOAN_STATUS_HISTORY_SHEET_NAME") || "Loan Status History",
        HISTORY_HEADERS,
      );

      upsertApplication_(applicationsSheet, payload.application);
      appendHistoryOnce_(historySheet, payload);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error("Loan sheet sync failed", error?.message);
    return jsonResponse_({ ok: false, message: "Unable to update loan spreadsheet" });
  }
}

function validatePayload_(payload) {
  if (payload.action !== "syncLoanApplication") throw new Error("Unsupported action");
  if (!payload.eventId || !payload.eventAt || !payload.application) throw new Error("Incomplete sync event");
  if (!Number.isInteger(Number(payload.application.id)) || Number(payload.application.id) < 1) {
    throw new Error("Invalid application ID");
  }
  if (!payload.application.status) throw new Error("Missing application status");
}

function getOrCreateSheet_(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  const currentHeaders = sheet.getLastRow()
    ? sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0]
    : [];

  if (!currentHeaders.length || currentHeaders.every((header) => !header)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  if (headers.some((header, index) => currentHeaders[index] !== header)) {
    throw new Error(`Unexpected columns in sheet "${name}"`);
  }
  return sheet;
}

function upsertApplication_(sheet, application) {
  const values = [
    application.id,
    safeText_(application.studentName),
    safeText_(application.studentEmail),
    safeText_(application.studentMobile),
    application.createdAt,
    application.updatedAt,
    safeText_(application.providerName),
    safeText_(application.loanType),
    safeText_(application.course),
    safeText_(application.collegeName),
    application.requestedAmount,
    safeText_(application.coBorrowerName),
    safeText_(application.coBorrowerRelationship),
    safeText_(application.message || ""),
    application.status,
    safeText_(application.adminRemark || ""),
  ];

  if (sheet.getLastRow() < 2) {
    sheet.appendRow(values);
    return;
  }

  const applicationIds = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  const rowIndex = applicationIds.findIndex((row) => row[0] === String(application.id));
  if (rowIndex < 0) {
    sheet.appendRow(values);
  } else {
    const sheetRow = rowIndex + 2;
    const existingUpdatedAt = new Date(sheet.getRange(sheetRow, 6).getValue()).getTime();
    const incomingUpdatedAt = new Date(application.updatedAt).getTime();
    if (!Number.isFinite(existingUpdatedAt) || existingUpdatedAt <= incomingUpdatedAt) {
      sheet.getRange(sheetRow, 1, 1, values.length).setValues([values]);
    }
  }
}

function appendHistoryOnce_(sheet, payload) {
  const eventIds = sheet.getLastRow() < 2
    ? []
    : sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().map((row) => row[0]);
  if (eventIds.includes(String(payload.eventId))) return;

  sheet.appendRow([
    payload.eventId,
    payload.application.id,
    safeText_(payload.eventType),
    payload.eventAt,
    safeText_(payload.previousStatus || ""),
    safeText_(payload.application.status),
    safeText_(payload.application.adminRemark || ""),
  ]);
}

function safeText_(value) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function constantTimeEquals_(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
