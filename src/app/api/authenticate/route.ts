import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.GCP_CLIENT_ID;
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET;
const REDIRECT_URI = process.env.GCP_REDIRECT_URI;

// Specify the required scopes
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

export async function GET(req: NextRequest, res: NextResponse) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error("Missing environment variables");
  }

  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    scope: SCOPES,
  });

  // Manually set the redirection headers
  return NextResponse.redirect(authUrl);
}
