import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { EventApprovalLog } from '../types';

export interface ApprovalConfig {
  nodalOfficerEmail: string;
  webhookUrl: string;
  nodalOfficerUsername?: string;
  nodalOfficerPassword?: string;
}

const DEFAULT_CONFIG: ApprovalConfig = {
  nodalOfficerEmail: 'nodalofficer@ce-kgr.org',
  webhookUrl: '',
  nodalOfficerUsername: 'nodalofficer',
  nodalOfficerPassword: 'nodal@123'
};

// Fetch approval settings from Firestore
export const getApprovalConfig = async (): Promise<ApprovalConfig> => {
  try {
    const docRef = doc(db, 'settings', 'approval_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_CONFIG, ...docSnap.data() };
    }
  } catch (err) {
    console.warn("Could not fetch approval_config from Firestore, using default:", err);
  }
  return DEFAULT_CONFIG;
};

// Save approval settings to Firestore
export const saveApprovalConfig = async (config: ApprovalConfig): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'settings', 'approval_config'), config, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving approval config:", err);
    return false;
  }
};

// Send webhook trigger to Google Apps Script Web App
export const sendGoogleScriptPayload = async (payload: {
  action: 'EVENT_CREATED' | 'EVENT_APPROVED' | 'EVENT_REJECTED' | 'EVENT_RESUBMITTED';
  eventId: string | number;
  eventTitle: string;
  eventType?: string;
  eventDate?: string;
  eventDescription?: string;
  eventImage?: string;
  actorEmail: string;
  actorRole: 'ADMIN' | 'NODAL_OFFICER';
  nodalOfficerEmail?: string;
  rejectionReason?: string;
  timestamp?: string;
  adminUrl?: string;
}) => {
  try {
    const config = await getApprovalConfig();
    const webhookUrl = config.webhookUrl || localStorage.getItem('iedc_gas_webhook_url');

    if (!webhookUrl) {
      console.log("No Google Apps Script Webhook URL configured. Skipping remote script notification.");
      return false;
    }

    const defaultAdminUrl = typeof window !== 'undefined' ? `${window.location.origin}/nodal-officer` : 'https://iedc-ce-kidangoor.web.app/nodal-officer';

    const dataToSend = {
      ...payload,
      adminUrl: payload.adminUrl || defaultAdminUrl,
      nodalOfficerEmail: payload.nodalOfficerEmail || config.nodalOfficerEmail,
      timestamp: payload.timestamp || new Date().toISOString()
    };

    // Send POST request with no-cors or JSON body to Apps Script
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script Web Apps require no-cors or redirect handling
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend)
    });

    console.log("Google Apps Script webhook triggered successfully.");
    return true;
  } catch (error) {
    console.error("Failed to post payload to Google Apps Script Webhook:", error);
    return false;
  }
};

// Record an audit log entry in Firestore collection 'approval_logs'
export const logApprovalAction = async (logData: EventApprovalLog) => {
  try {
    await addDoc(collection(db, 'approval_logs'), {
      ...logData,
      createdAt: serverTimestamp(),
      actionDate: logData.actionDate || new Date().toISOString()
    });
  } catch (error) {
    console.error("Error writing approval log to Firestore:", error);
  }
};
