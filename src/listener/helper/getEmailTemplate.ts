export const getEmailTemplate = (replyEmailBody: string) =>
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