import { get } from "@vercel/edge-config";
import { gmail_v1, google } from "googleapis";

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VER_API_ACCESS_TOKEN = process.env.VER_API_ACCESS_TOKEN;
const VER_TEAM_ID = process.env.VER_TEAM_ID;

const CLIENT_ID = process.env.GCP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GCP_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GCP_REDIRECT_URI || "";

const GMAIL_API_CREDENTIALS = "gmail_api_credentials";
const EMAIL_MESSAGE_ID = "email_message_id";

export const runtime = 'edge';

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const setEmailMessageIdInEdgeConfig = async (newMessageId: string | null | undefined) => {
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

const getCredentialsFromEdgeStore = async () => {
    const response = await fetch(
        `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${VER_TEAM_ID}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${VER_API_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );

    const [_, tokens] = await response.json();

    return tokens
}

const getEmailMessage = async (gmail: gmail_v1.Gmail) => {
    const emailMessagesList = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX"],
        maxResults: 1,
    });
    const messages = emailMessagesList.data?.messages || [];

    const newMessageId = messages[0].id;

    const prevMessageId = "";

    if (prevMessageId !== newMessageId) {
        await setEmailMessageIdInEdgeConfig(newMessageId);

        const emailMessage = await gmail.users.messages.get({
            userId: "me",
            id: `${newMessageId}`,
        });

        return emailMessage.data;
    }
};

const sendEmailReply = async () => {
    const tokens = await get(GMAIL_API_CREDENTIALS);
    console.log(tokens)

    // const gmail = google.gmail({
    //     version: "v1",
    //     auth: oAuth2Client,
    // });

    // const emailMessage = await getEmailMessage(gmail);

    // if (!emailMessage?.id || !emailMessage?.payload?.parts || !emailMessage?.payload?.headers) {
    //     return new Error('Invalid email data')
    // }

    // const { id, payload: { headers, parts } } = emailMessage;
}

sendEmailReply();
