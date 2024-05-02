import fs from "fs";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.GCP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GCP_REDIRECT_URI || "";

const setCredentials = async (code: string, oAuth2Client: any) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    access_token: tokens.access_token,
  });

  fs.writeFileSync("./token.json", payload);
};

const getCodeFromURL = async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    throw new Error("Missing code parameter");
  }

  return code;
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

    const code = await getCodeFromURL(req);
    await setCredentials(code, oAuth2Client);

    return new NextResponse(null, {
      status: 200,
      statusText: "Success",
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, {
      status: 500,
      statusText: "Error set credentials",
    });
  }
}
