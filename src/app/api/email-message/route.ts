import fsPromises from "fs/promises";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const url = "https://api.inkeep.com/v0/chat_sessions/chat_results";

const CLIENT_ID = process.env.GCP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GCP_REDIRECT_URI || "";

const INKEEP_INTEGRATION_ID = process.env.INKEEP_INTEGRATION_ID || "";
const INKEEP_API_KEY = process.env.INKEEP_API_KEY || "";

const getResponseFromAI = async (emailBody: string) => {
  if (!INKEEP_API_KEY || !INKEEP_INTEGRATION_ID) {
    throw new Error("Not found API key or integration id");
  }

  const data = {
    integration_id: INKEEP_INTEGRATION_ID,
    chat_session: {
      messages: [
        {
          role: "user",
          content: emailBody,
        },
      ],
    },
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

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error("Missing environment variables");
    }

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

    const gmailRes = await gmail.users.messages.get({
      userId: "me",
      id: "message_id",
    });

    return new NextResponse(null, {
      status: 200,
      statusText: "Success",
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, {
      status: 500,
      statusText: "Error",
    });
  }
}
