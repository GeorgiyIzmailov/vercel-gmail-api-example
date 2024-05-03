import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const GMAIL_API_CREDENTIALS = "gmail_api_credentials";

// Load environment variables
const CLIENT_ID = process.env.GCP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GCP_REDIRECT_URI || "";

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VER_API_ACCESS_TOKEN = process.env.VER_API_ACCESS_TOKEN;
const VER_TEAM_ID = process.env.VER_TEAM_ID;

const setCredentials = async (code: string, oAuth2Client: any) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  if (!EDGE_CONFIG_ID || !VER_API_ACCESS_TOKEN) {
    throw new Error("Vercel Edge Config ID or Vercel API Token not found");
  }

  const payload = {
    type: "authorized_user",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    access_token: tokens.access_token,
  };

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
            operation: "create",
            key: GMAIL_API_CREDENTIALS,
            value: payload,
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
