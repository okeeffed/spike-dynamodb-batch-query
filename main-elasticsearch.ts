import { defaultProvider } from "@aws-sdk/credential-provider-node"; // V3 SDK.
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import env from "./env.json";

const client = new Client({
  ...AwsSigv4Signer({
    region: "ap-southeast-2",
    service: "es", // 'aoss' for OpenSearch Serverless
    // Must return a Promise that resolve to an AWS.Credentials object.
    // This function is used to acquire the credentials when the client start and
    // when the credentials are expired.
    // The Client will refresh the Credentials only when they are expired.
    // With AWS SDK V2, Credentials.refreshPromise is used when available to refresh the credentials.

    // Example with AWS SDK V3:
    getCredentials: () => {
      // Any other method to acquire a new Credentials object can be used.
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  node: `http://${env.OPENSEARCH_ENDPOINT}`, // OpenSearch domain URL
  // node: "https://xxx.region.aoss.amazonaws.com" for OpenSearch Serverless
});

// Define the search function
async function searchActivities(searchTerm: string): Promise<void> {
  try {
    // Execute the search query
    const response = await client.search({
      index: "activities-index", // Replace with your actual index name
      body: {
        query: {
          prefix: {
            SearchableFirstName: {
              value: searchTerm,
            },
          },
        },
      },
    });

    // Process the search results
    console.log("Search Results:", response.body.hits);
  } catch (error) {
    console.error("An error occurred during the search:", error);
  }
}

async function searchAll(): Promise<void> {
  try {
    // Execute the search query
    const response = await client.search({
      index: "activities-index", // Replace with your actual index name
      body: {
        query: {
          match_all: {},
        },
      },
      size: 10, // Adjust the size according to your needs, bearing in mind the performance implications
    });

    // Process the search results
    console.log("Search Results:", response.body.hits);
  } catch (error) {
    console.error("An error occurred during the search:", error);
  }
}

// Example usage
const userSearchTerm = "ja"; // Replace with your search term
searchActivities(userSearchTerm)
  .then(() => console.log("Search completed."))
  .catch(console.error);

searchAll()
  .then(() => console.log("Search completed."))
  .catch(console.error);
