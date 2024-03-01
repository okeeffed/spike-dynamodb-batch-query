import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import data from "./parties.json";

const SEARCH_PARTIES_LIMIT = data.parties.length;
const PAGE_SIZE = 5;
const PAGE_NUMBER = 1;

const client = new DynamoDBClient({
  endpoint: `http://localhost:4566`,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  region: "us-east-1",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function queryPartyRoles(partyKey: string, attempt: number = 0) {
  const params = {
    TableName: "SpikeBatchGetAndQuery",
    IndexName: "gsi_2", // Assuming GSI1PK is the partition key for the GSI
    KeyConditionExpression: "gsi_pk_2 = :pk",
    ExpressionAttributeValues: {
      ":pk": partyKey,
    },
  };

  try {
    // Using the QueryCommand with the new client
    const command = new QueryCommand(params);
    const result = await ddbDocClient.send(command);
    return result;
  } catch (error) {
    if (attempt < 3) {
      // Retry up to 3 times
      console.log(`Retrying ${partyKey}, attempt ${attempt + 1}`);
      return queryPartyRoles(partyKey, attempt + 1);
    } else {
      throw new Error(
        `Failed to query ${partyKey} after several attempts: ${error}`
      );
    }
  }
}

async function executeBatch(partyKeys: string[]) {
  const promises = partyKeys.map((key) => queryPartyRoles(key));
  return Promise.all(promises);
}

async function batchProcess(
  partyKeys: string[],
  limit: number,
  batchSize: number = 10
) {
  const batchedResults = [];
  for (let i = 0; i < partyKeys.length; i += batchSize) {
    console.log("Running batch nunber:", i);
    const batch = partyKeys.slice(i, i + batchSize);
    const results = await executeBatch(batch);
    batchedResults.push(
      ...results.flatMap((item) => item.Items).filter(Boolean)
    );

    if (batchedResults.length >= limit) {
      break;
    }
  }
  return batchedResults;
}

async function main() {
  const partyKeys = data.parties.slice(0, SEARCH_PARTIES_LIMIT);
  const batchedRoles = await batchProcess(partyKeys, PAGE_SIZE, 10); // Process in batches of 10
  const pageSize = PAGE_SIZE; // Default pageSize to 10 if not provided
  const pageNumber = PAGE_NUMBER; // Default pageNumber to 1 if not provided

  // Sort the flattened array by the `updated_at` attribute
  const sortedRoles = batchedRoles.sort((a, b) => {
    // @ts-expect-error: ignored for spike
    const dateA = new Date(a.updated_at);
    // @ts-expect-error: ignored for spike
    const dateB = new Date(b.updated_at);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate start index for slicing
  const startIndex = (pageNumber - 1) * pageSize;
  // Slice the sorted array for pagination
  const paginatedRoles = sortedRoles.slice(startIndex, startIndex + pageSize);

  console.log("@ Sorted roles (last 5):", sortedRoles.slice(-5));
  console.log("@ Paginated roles:", paginatedRoles);

  console.log("@ sorted roles length", sortedRoles.length);
  console.log("@ paginated roles length", paginatedRoles.length);
}

main().catch(console.error);
