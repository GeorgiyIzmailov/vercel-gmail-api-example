import { gmail_v1, google } from "googleapis";
import { getResponseFromAI } from "./helper/getResponseFromAI";
import { getEmailTemplate } from "./helper/getEmailTemplate";

const EMAIL_PATTERN = /georgiy-izmailov-v@[A-Za-z0-9.-]+.(com)/g;

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VER_API_ACCESS_TOKEN = process.env.VER_API_ACCESS_TOKEN;
const VER_TEAM_ID = process.env.VER_TEAM_ID;

const CLIENT_ID = process.env.GCP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GCP_REDIRECT_URI || "";

const GMAIL_API_CREDENTIALS = "gmail_api_credentials";
const EMAIL_MESSAGE_ID = "email_message_id";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const getDataFromEdgeStore = async (itemKey: string) => {
  try {
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/item/${itemKey}?teamId=${VER_TEAM_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${VER_API_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Not found credentials');
    }

    return await response.json();
  } catch (error) {
    console.error(error)
  }
}

const setEmailMessageIdInEdgeStore = async (newMessageId: string | null | undefined, prevMessageId: string | null | undefined) => {
  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${VER_TEAM_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VER_API_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            operation: prevMessageId ? "update" : "create",
            key: EMAIL_MESSAGE_ID,
            value: newMessageId,
          },
        ],
      }),
    }
  );

  const responseData = await response.json();

  if (response.status !== 200 || responseData.status !== "ok") {
    throw new Error(
      `Failed to write Gami API credentials to Vercel Edge Config: ${response.statusText
      } - ${JSON.stringify(responseData)}`
    );
  }
}

const getEmailMessage = async (gmail: gmail_v1.Gmail) => {
  const emailMessagesList = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: 1,
  });
  const messages = emailMessagesList.data?.messages || [];
  const newMessageId = messages[0].id;

  const prevMessageId = await getDataFromEdgeStore(EMAIL_MESSAGE_ID);

  if (prevMessageId?.value !== newMessageId) {
    await setEmailMessageIdInEdgeStore(newMessageId, prevMessageId?.value);

    const emailMessage = await gmail.users.messages.get({
      userId: "me",
      id: `${newMessageId}`,
    });

    return emailMessage.data;
  }
}

const settingEmailMessageOptions = (headers: gmail_v1.Schema$MessagePartHeader[]) => {
  const emailFrom = process.env.EMAIL_ADDRESS;
  let subject, emailTo;

  headers?.forEach((header) => {
    if (header.name === "Subject") subject = header.value;

    if (header.name === "From") {
      const email = header.value;
      const foundSupportEmail = email?.match(EMAIL_PATTERN);

      if (!foundSupportEmail?.length) {
        return new Error("Not found support email");
      }

      emailTo = foundSupportEmail[0];
    }
  });

  return { from: emailFrom, subject, to: emailTo };
};

const sendEmailReply = async (
  emailThreadId: string,
  gmail: gmail_v1.Gmail,
  headers: gmail_v1.Schema$MessagePartHeader[],
  parts: gmail_v1.Schema$MessagePart[]) => {
  const [part_plain] = parts;
  const { from, to, subject } = settingEmailMessageOptions(headers);

  if (!part_plain.body?.data) {
    return new Error("Empty email message body");
  }

  const emailMessageText = Buffer.from(part_plain.body.data, "base64").toString(
    "utf-8"
  );

  const responseFromAI = await getResponseFromAI(
    emailMessageText,
    subject || ""
  )

  // Prepare email to send
  const emailToSend = [
    "MIME-Version: 1.0",
    "Content-type: text/html;charset=iso-8859-1",
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "",
    getEmailTemplate(responseFromAI),
  ]
    .join("\r\n")
    .trim();

  // Encoding a message in base64
  const encodedEmail = Buffer.from(emailToSend).toString("base64");

  return await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
      threadId: emailThreadId,
    },
  });
}

const gmailListener = async () => {
  const gmail = google.gmail({
    version: "v1",
    auth: oAuth2Client,
  });

  setInterval(async () => {
    const tokens = await getDataFromEdgeStore(GMAIL_API_CREDENTIALS);

    if (!tokens) {
      return new Error('Invalid credentials');
    }

    oAuth2Client.setCredentials(tokens.value);
    const emailMessage = await getEmailMessage(gmail);

    console.log("emailMessage", emailMessage);

    if (!emailMessage?.id || !emailMessage?.payload?.parts || !emailMessage?.payload?.headers) {
      return new Error('Invalid email data');
    }

    const { id, payload: { headers, parts } } = emailMessage;

    await sendEmailReply(
      id,
      gmail,
      headers,
      parts
    ).catch((error) => console.error(error));

  }, 15000)
}

gmailListener();
