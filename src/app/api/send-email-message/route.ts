import fs from "fs";
import fsPromises from "fs/promises";
import { gmail_v1, google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const url = "https://api.inkeep.com/v0/chat_sessions/chat_results";

// Load environment variables
const CLIENT_ID = process.env.GCP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GCP_REDIRECT_URI || "";

const INKEEP_INTEGRATION_ID = process.env.INKEEP_INTEGRATION_ID || "";
const INKEEP_API_KEY = process.env.INKEEP_API_KEY || "";

const getEmailTemplate = (replyEmailBody: string) =>
  `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html dir="ltr" lang="en">
    <head>
      <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
  
    <body
      style="
        background-color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
      "
    >
      <table
        align="center"
        width="100%"
        border="0"
        cellpadding="0"
        cellspacing="0"
        role="presentation"
        style="
          max-width: 37.5em;
          margin: 0 auto;
          padding: 20px 25px 48px;
          background-image: url('/assets/raycast-bg.png');
          background-position: bottom;
          background-repeat: no-repeat, no-repeat;
        "
      >
        <tbody>
          <tr style="width: 100%">
            <td>
              <img
                alt="Inkeep"
                height="48"
                src="https://mintlify.s3-us-west-1.amazonaws.com/inkeep/_generated/favicon/apple-touch-icon.png?v=3"
                style="
                  display: block;
                  outline: none;
                  border: none;
                  text-decoration: none;
                "
                width="48"
              />
              <h1 style="font-size: 28px; font-weight: bold; margin-top: 48px">
                ✨ Response from AI:
              </h1>
              <table
                align="center"
                width="100%"
                border="0"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="margin: 24px 0"
              >
                <tbody>
                  <tr>
                    <td>${replyEmailBody.replace(/\n/g, "<br>")}</td>
                  </tr>
                </tbody>
              </table>
              <hr
                style="
                  width: 100%;
                  border: none;
                  border-top: 1px solid #eaeaea;
                  border-color: #dddddd;
                  margin-top: 48px;
                "
              />
              <a
                href="https://inkeep.com/"
                aria-label="https://inkeep.com/"
                target="_blank"
              >
                <img
                  height="32"
                  src="https://mintlify.s3-us-west-1.amazonaws.com/inkeep/_generated/favicon/apple-touch-icon.png?v=3"
                  style="
                    display: block;
                    outline: none;
                    border: none;
                    text-decoration: none;
                    -webkit-filter: grayscale(100%);
                    filter: grayscale(100%);
                    margin: 20px 0;
                  "
                  width="32"
                />
              </a>
  
              <p
                style="
                  font-size: 12px;
                  line-height: 24px;
                  margin: 16px 0;
                  color: #8898aa;
                  margin-left: 4px;
                "
              >
                @ 2024 Inkeep, Inc.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>`;

// Function to get AI response from email body and subject
const getResponseFromAI = async (emailBody: string, emailSubject: string) => {
  if (!INKEEP_API_KEY || !INKEEP_INTEGRATION_ID) {
    throw new Error("Not found API key or integration id");
  }

  const data = {
    integration_id: INKEEP_INTEGRATION_ID,
    chat_session: {
      messages: [
        {
          role: "user",
          content: `<emailSubject>${emailSubject}</emailSubject>\n<emailBody>${emailBody}</emailBody>`,
        },
      ],
      context:
        "The user is reaching out to customer support via email. Your response will be returned as an automatic reply to the email.",
      guidance: `
         <law>
           <name>Natural Human Tone</name>
           <conditions>
             <condition>For all messages</condition>
           </conditions>
           <action>Do **not** use the phrases <bad>"According to the documentation"</bad> or <bad>"the information sources"</bad>, these sound like you are an robot which will annoy users. Instead, just make statements factually and concisely, e.g. <good>"You can try doing X by doing Y[1]"</good>. They make you sound natural. Sound humble and helpful.</action>
         </law>
         <law>
           <name>Ask user to reply to email for additional help</name>
           <conditions>
             <condition>You are not confident in the response because an answer is unclear from the information sources.</condition>
           </conditions>
           <action><good>Recommend the user reply to the email if they need additional help, a human will take over.</good><bad>Do not recommend they reach out via other support channels, they might get frustrated because they expect this to be a support channel</bad></action>
         </law>
       `,
    },
    chat_mode: "turbo",
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INKEEP_API_KEY}`,
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(url, options);
  const responseFromAIMessage = await response.json();

  return responseFromAIMessage.message.content;
};

const setEmailMessageId = async (messageId: string | null | undefined) => {
  try {
    const payload = JSON.stringify({
      prevMessageID: messageId,
    });
    fs.writeFileSync("./message-options.json", payload);
    console.log("Message ID updated:", messageId);
  } catch (error) {
    console.error(error);
    return new NextResponse(null, {
      status: 400,
      statusText: "Error writing message options",
    });
  }
};

const getEmailMessageId = async () => {
  try {
    const messageOptions = await fsPromises.readFile("./message-options.json");
    const { prevMessageID } = JSON.parse(messageOptions?.toString() || '{}');

    return prevMessageID;
  } catch (error) {
    console.error(error);
    return new NextResponse(null, {
      status: 400,
      statusText: "Error reading message options",
    });
  }
};

// Function to get email message details
const getEmailMessage = async (gmail: gmail_v1.Gmail) => {
  const emailMessagesList = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: 1,
  });
  const messages = emailMessagesList.data?.messages || [];

  const newMessageId = messages[0].id;
  const prevMessageId = await getEmailMessageId();

  if (prevMessageId !== newMessageId) {
    await setEmailMessageId(newMessageId);

    const emailMessage = await gmail.users.messages.get({
      userId: "me",
      id: `${newMessageId}`,
    });

    return emailMessage.data;
  }
};

// Function to extract email message options from headers
const emailMessageOptions = (headers: gmail_v1.Schema$MessagePartHeader[]) => {
  const emailFrom = process.env.EMAIL_ADDRESS;
  let subject, emailTo;

  headers?.forEach((header) => {
    if (header.name === "Subject") subject = header.value;

    if (header.name === "From") {
      const email = header.value;
      const foundSupportEmail = email?.match(
        /georgiy-izmailov-v@[A-Za-z0-9.-]+.(com)/g
      );

      if (!foundSupportEmail?.length) {
        return new NextResponse(null, {
          status: 400,
          statusText: "Not found support email",
        });
      }

      emailTo = foundSupportEmail[0];
    }
  });

  return { from: emailFrom, subject, to: emailTo };
};

// Function to send email reply
const sendEmailReply = async (
  emailId: string,
  gmail: gmail_v1.Gmail,
  headers: gmail_v1.Schema$MessagePartHeader[],
  parts: gmail_v1.Schema$MessagePart[]
) => {
  // Extract email message options
  const { from, to, subject } = emailMessageOptions(headers);
  const [part_plain] = parts;

  if (!part_plain.body?.data) {
    throw new Error("Empty email message body");
  }

  const emailMessageText = Buffer.from(part_plain.body.data, "base64").toString(
    "utf-8"
  );

  // Get AI response
  const responseFromAI = await getResponseFromAI(
    emailMessageText,
    subject || ""
  );

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

  // Send email
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
      threadId: emailId,
    },
  });

  return response;
};

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    // Check if required environment variables are provided
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error("Missing environment variables");
    }

    // Authenticate with Google API
    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    const tokens = await fsPromises.readFile("./token.json");
    oAuth2Client.setCredentials(JSON.parse(tokens.toString()));

    const gmail = google.gmail({
      version: "v1",
      auth: oAuth2Client,
    });

    setInterval(async () => {
      // Get email details
      const emailMessage = await getEmailMessage(gmail);

      if (!emailMessage?.id || !emailMessage?.payload?.parts || !emailMessage?.payload?.headers) {
        return new NextResponse(null, {
          status: 400,
          statusText: "Invalid email data",
        });
      }

      const { id, payload: { headers, parts } } = emailMessage;

      // Send email reply
      const response = await sendEmailReply(
        id,
        gmail,
        headers,
        parts
      );

      if (response.status !== 200) {
        return new NextResponse(null, {
          status: 500,
          statusText: "Failed to send email reply",
        });
      }
    }, 15000);

    return new NextResponse(null, {
      status: 200,
      statusText: "Email sent successfully",
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, {
      status: 500,
      statusText: "Internal error",
    });
  }
}
