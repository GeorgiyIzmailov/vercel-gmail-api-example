const INKEEP_INTEGRATION_ID = process.env.INKEEP_INTEGRATION_ID || "";
const INKEEP_API_KEY = process.env.INKEEP_API_KEY || "";

const inkeepUrl = "https://api.inkeep.com/v0/chat_sessions/chat_results";

export const getResponseFromAI = async (emailBody: string, emailSubject: string) => {
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

    const response = await fetch(inkeepUrl, options);
    const responseFromAIMessage = await response.json();

    return responseFromAIMessage.message.content;
};