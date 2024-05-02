# Vercel - Gmail API example

## Getting Started

Clone this repository:

```bash
git clone https://github.com/GeorgiyIzmailov/vercel-gmail-api-example.git
```

## Setup dependencies:

```bash
pnpm install
```

Copy the example env file to make a .env.example for local development:

```bash
cp .env.example .env
```

## Create a Google Cloud project

Create a project on the GCP platform by going to **Menu** > **IAM & Admin** > **Create Project** in the Google Cloud console. Learn more [here](https://developers.google.com/workspace/guides/create-project#google-cloud-console).

### Enable the Gmail API

1. In the Google Cloud console, go to **Menu** > **More products** > **Google Workspace** > **Product Library**

2. Click on the **Gmail API**

3. Click **Enable**

### Configure the OAuth consent screen

1. In the Google Cloud console, go to **Menu** > **APIs & Services** > **OAuth consent screen**

2. For User type select **Internal**, then click **Create**

3. Complete the app registration form, then click **Save and Continue**

4. Set the following scopes:

   - [ https://www.googleapis.com/auth/gmail.readonly ]
   - [ https://www.googleapis.com/auth/gmail.send ]

5. Click **Save and Continue** and **Bach to Dashboard**

### Authorize credentials for a web application

1. In the Google Cloud console, go to **Menu** > **APIs & Services** > **Credentials**

2. Click **Create Credentials** and select **OAuth Client ID**

3. Click **Application type** > **Web application**

4. In the **Authorized redirect URIs** section, specify the URI for redirection:

```bash
GCP_REDIRECT_URI="https://<your_domain>/api/authenticate-redirect"
```

5. Click **Create**. The OAuth client created screen appears, showing your new **Client ID** and **Client secret**

6. Copy and add the **Client ID** and **Client secret** to the `.env` file:

```bash
GCP_CLIENT_ID="YOUR_GCP_CLIENT_ID"
GCP_CLIENT_SECRET="YOUR_GCP_CLIENT_SECRET"
```

7. Click **OK**

### Specify email

Add your email address specified when creating the web client:

```bash
EMAIL_ADDRESS="YOUR_EMAIL_ADDRESS"
```

### Inkeep env

Add **API_KEY** and **INTEGRATION_ID** to the environment variables:

```bash
INKEEP_API_KEY="YOUR_INKEEP_API_KEY"
INKEEP_INTEGRATION_ID="YOUR_INKEEP_INTEGRATION_ID"
```

## Run locally

```bash
pnpm dev
```

## API Routes

`/api/authenticate` - authorization and initialization of the web client

`/api/authenticate-redirect` - processing of authentication and token retrieval

`/api/send-email-message` - receiving an email and sending a response from AI