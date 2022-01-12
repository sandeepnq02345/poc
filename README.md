# Webhook Fulfillment

### Design Consideration

- Fulfillment returns within time constraints
- Abstracts Responsibility of Data Processing to Separate Spring Boot Query Processing API
- Handles Tagging Logic From Dialogflow Dictates Initial Response
- Parses, Resolves, and validates values absorbed from user

### Design Components

- This is the NodeJS Functions Framework Service for Dialogflow Webhook Fulfillment
- Retrieves Query State Parameters Cached By Query Processor
- Published Query State Parameters to Query Processor
- Builds a Query on behalf of a user via build Query API of Query Processor
- Should the state parameters of a query state change, this fulfillment function sets a query id within the fulfillment response
- If a response does not require a new query id then no query id is returned

## Develop Server Setup
   - Configurations (to be done in config file based on NODE_ENV)
        - Provide the platform supported by your Virtual Agent

   - Commands to run 
        ```bash
        >$ npm i
        >$ export NODE_ENV="environment_name"
        >$ export USER_NAME="username" (optional)
        >$ export PASSWORD="password" (optional)
        >$ export GEOCODING_API_KEY="APIKEY"
        >$ export FIRESTORE_CREDENTIALS="BASE64 Encoded JSON FILE" (optional)
        >$ export QUERY_PROCESSOR_API_KEY: "KEY VALUE"
        >$ export INTERNAL_CLIENT_ID: "KEY VALUE"
        >$ export INTERNAL_CLIENT_SECRET: "SECRET VALUE"
        >$ export INTERNAL_GET_TOKEN_URL: "URL VALUE"
        >$ npm start

        ```
## Setting Up Development Workspace ##

Create a valid .env file with the following:
 * GOOGLE_APPLICATION_CREDENTIALS=<path-to-sa>.json
 * FIRESTORE_CREDENTIALS='firestore-sa-key json contents'
 * NODE_ENV='LOCAL'
 * DATABASE_URL='Database you're testing against'
 * APIGEE_USERNAME='GEORGIEPORGIE'
 * APIGEE_PASSWORD='HUNTER1'

## Local Development Steps ##

In the same directory as `mockWebhookRequest.json`,
use `curl` to invoke the Functions Framework including
the Pub/Sub JSON in the POST data:

```sh 
curl -d "@mockWebhookRequest.json" \
  -X POST \
  -H "Ce-Type: true" \
  -H "Ce-Specversion: true" \
  -H "Ce-Source: true" \
  -H "Ce-Id: true" \
  -H "Content-Type: application/json" \
  http://localhost:8070
```
