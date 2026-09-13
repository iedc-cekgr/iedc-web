/**
 * ==============================================================================
 * IEDC WEBSITE - EVENT APPROVAL SYSTEM GOOGLE APPS SCRIPT
 * ==============================================================================
 * 
 * HOW TO SETUP THIS GOOGLE APPS SCRIPT:
 * 1. Open Google Sheets (https://sheets.google.com) and create a new sheet named "IEDC Event Approval Logs".
 * 2. In the menu, click Extensions > Apps Script.
 * 3. Delete any default code in Code.gs and paste THIS entire script file into Code.gs.
 * 4. Click the Save icon (Ctrl+S or Cmd+S).
 * 5. Click Deploy > New deployment.
 * 6. Click Select type (gear icon) > Web app.
 * 7. Set:
 *    - Description: "IEDC Event Approval Webhook"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (CRITICAL: Must be Anyone so the website can send POST requests).
 * 8. Click Deploy, grant required permissions, and COPY the Web App URL provided.
 * 9. Paste that Web App URL into the "Google Script Webhook Settings" on the IEDC Admin Page!
 * ==============================================================================
 */

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    
    var action = contents.action || 'EVENT_CREATED';
    var eventTitle = contents.eventTitle || 'Untitled Event';
    var eventType = contents.eventType || 'N/A';
    var eventDate = contents.eventDate || 'N/A';
    var eventDescription = contents.eventDescription || 'No description provided';
    var eventImage = contents.eventImage || '';
    var actorEmail = contents.actorEmail || 'Admin';
    var actorRole = contents.actorRole || 'ADMIN';
    var nodalOfficerEmail = contents.nodalOfficerEmail || 'nodalofficer@ce-kgr.org';
    var rejectionReason = contents.rejectionReason || '';
    var timestamp = contents.timestamp ? new Date(contents.timestamp).toLocaleString() : new Date().toLocaleString();

    var adminUrl = contents.adminUrl || 'https://iedc-ce-kidangoor.web.app/nodal-officer';

    // 1. Log to Google Sheet
    logToSheet(timestamp, eventTitle, eventType, action, rejectionReason);

    // 2. Send Emails based on Action
    if (action === 'EVENT_CREATED' || action === 'EVENT_RESUBMITTED') {
      sendApprovalRequestEmail(nodalOfficerEmail, actorEmail, eventTitle, eventType, eventDate, eventDescription, eventImage, action, adminUrl);
    } else if (action === 'EVENT_APPROVED') {
      sendApprovalNotificationToAdmin(actorEmail, nodalOfficerEmail, eventTitle, timestamp);
    } else if (action === 'EVENT_REJECTED') {
      sendRejectionNotificationToAdmin(actorEmail, nodalOfficerEmail, eventTitle, rejectionReason, timestamp);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Action processed successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Appends data row into active Google Sheet
function logToSheet(timestamp, eventTitle, eventType, action, rejectionReason) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Create Header Row if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp", 
      "Event Title", 
      "Event Type", 
      "Action", 
      "Rejection Reason"
    ]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#2563EB").setFontColor("#FFFFFF");
  }

  sheet.appendRow([
    timestamp, 
    eventTitle, 
    eventType, 
    action, 
    rejectionReason || 'N/A'
  ]);
}

// Send email to Nodal Officer requesting approval
function sendApprovalRequestEmail(nodalOfficerEmail, adminEmail, eventTitle, eventType, eventDate, eventDescription, eventImage, action, adminUrl) {
  var subject = "🚨 Action Required: New Event Approval Request - " + eventTitle;
  
  var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">IEDC Event Approval Request</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">${action === 'EVENT_RESUBMITTED' ? 'Resubmitted Event' : 'New Pending Event'}</p>
      </div>
      
      <div style="padding: 20px; background-color: #ffffff;">
        <p>Respected Nodal Officer,</p>
        <p>A new event has been added to the IEDC Website admin portal by <strong>${adminEmail}</strong> and requires your approval before it goes live on the public website.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Event Title:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${eventTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Type / Category:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${eventType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Date:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${eventDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f8fafc;">Description:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${eventDescription}</td>
          </tr>
        </table>

        ${eventImage ? `<p><strong>Poster Preview:</strong><br><a href="${eventImage}" target="_blank"><img src="${eventImage}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #ccc; margin-top: 5px; max-height: 250px;"></a></p>` : ''}

        <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
          <a href="${adminUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);">
            🔐 Click Here to Log In & Review Request
          </a>
          <p style="font-size: 12px; color: #64748b; margin-top: 10px;">Direct Link: <a href="${adminUrl}" style="color: #2563eb;">${adminUrl}</a></p>
        </div>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px;">
        IEDC CE Kidangoor Official Portal Notification System
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: nodalOfficerEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

// Send email to Admin notifying that Nodal Officer approved event
function sendApprovalNotificationToAdmin(nodalOfficerEmail, adminEmail, eventTitle, timestamp) {
  var subject = "✅ Event Approved: " + eventTitle;
  var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
      <div style="background-color: #16a34a; color: white; padding: 15px; text-align: center;">
        <h3 style="margin: 0;">Event Approved & Published</h3>
      </div>
      <div style="padding: 20px;">
        <p>The event <strong>${eventTitle}</strong> has been approved by Nodal Officer (<strong>${nodalOfficerEmail}</strong>) at ${timestamp}.</p>
        <p>The event is now live and visible on the public website.</p>
      </div>
    </div>
  `;
  MailApp.sendEmail({ to: adminEmail, subject: subject, htmlBody: htmlBody });
}

// Send email to Admin notifying that Nodal Officer rejected event
function sendRejectionNotificationToAdmin(nodalOfficerEmail, adminEmail, eventTitle, reason, timestamp) {
  var subject = "❌ Event Approval Rejected: " + eventTitle;
  var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
      <div style="background-color: #dc2626; color: white; padding: 15px; text-align: center;">
        <h3 style="margin: 0;">Event Approval Rejected</h3>
      </div>
      <div style="padding: 20px;">
        <p>The event <strong>${eventTitle}</strong> was rejected by Nodal Officer (<strong>${nodalOfficerEmail}</strong>) at ${timestamp}.</p>
        <p><strong>Reason specified:</strong></p>
        <blockquote style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; font-style: italic; margin: 10px 0;">
          ${reason || 'No specific reason provided.'}
        </blockquote>
        <p>You can edit and resubmit the event from the IEDC Admin Dashboard.</p>
      </div>
    </div>
  `;
  MailApp.sendEmail({ to: adminEmail, subject: subject, htmlBody: htmlBody });
}
