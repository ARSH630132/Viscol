const syncTimeoutMs = 10000;

export async function syncLoanApplicationToSheet({ application, eventType, previousStatus = null, eventAt }) {
  const url = process.env.GOOGLE_APPS_SCRIPT_LOAN_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_LOAN_SECRET;

  if (!url || !secret) {
    console.error("Loan Google Sheets sync is not configured");
    return { synced: false, message: "Loan saved in the platform, but Google Sheets sync is not configured" };
  }

  const eventTimestamp = new Date(eventAt).toISOString();
  const eventId = `loan-${application.id}-${eventType}-${eventTimestamp}`;
  const payload = {
    action: "syncLoanApplication",
    secret,
    eventId,
    eventType,
    eventAt: eventTimestamp,
    previousStatus,
    application: {
      id: application.id,
      studentName: application.studentName,
      studentEmail: application.studentEmail,
      studentMobile: application.studentMobile,
      providerName: application.providerName,
      loanType: application.loanType,
      course: application.course,
      collegeName: application.collegeName,
      requestedAmount: application.requestedAmount,
      coBorrowerName: application.coBorrowerName,
      coBorrowerRelationship: application.coBorrowerRelationship,
      message: application.message,
      status: application.status,
      adminRemark: application.adminRemark,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(syncTimeoutMs),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || result?.ok !== true) {
      console.error("Loan Google Sheets sync was rejected", {
        status: response.status,
        message: result?.message || "Unexpected response from Apps Script",
        applicationId: application.id,
      });
      return { synced: false, message: "Loan saved in the platform, but Google Sheets could not be updated" };
    }

    return { synced: true };
  } catch (error) {
    console.error("Loan Google Sheets sync failed", {
      name: error?.name,
      message: error?.message,
      applicationId: application.id,
    });
    return { synced: false, message: "Loan saved in the platform, but Google Sheets could not be reached" };
  }
}
