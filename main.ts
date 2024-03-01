import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const SEARCH_FIRST_NAME = "c";
// const SEARCH_LAST_NAME = "he";
// const SEARCH_EMAIL = "letha";

type TODO = any;

const client = new DynamoDBClient({
  endpoint: `http://localhost:4566`,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function findUsersByFirstName(firstNamePrefix: string) {
  // Assuming you know the partition key value you want to query against.
  // This value needs to be known or determined based on your application's logic.

  const params = {
    TableName: "ActivitiesAndUsers",
    IndexName: "GSI1",
    KeyConditionExpression:
      "GSI1PK = :pk AND begins_with(GSI1SK, :firstNamePrefix)",
    ExpressionAttributeValues: {
      ":pk": "USER#SearchableFirstName",
      ":firstNamePrefix": firstNamePrefix.toLowerCase(),
    },
  };

  const command = new QueryCommand(params);
  const result = await ddbDocClient.send(command);
  return result.Items;
}

async function findUserByLastName(lastNamePrefix: string) {
  const params = {
    TableName: "ActivitiesAndUsers",
    IndexName: "GSI2", // Assuming GSI1PK is the partition key for the GSI
    KeyConditionExpression:
      "GSI1PK = :pk AND begins_with(GSI2SK, :lastNamePrefix)",
    ExpressionAttributeValues: {
      ":pk": "USER#SearchableLastName",
      ":lastNamePrefix": lastNamePrefix.toLowerCase(),
    },
  };

  // Using the QueryCommand with the new client
  const command = new QueryCommand(params);
  const result = await ddbDocClient.send(command);
  return result.Items?.[0];
}

async function findUserByEmail(emailPrefix: string) {
  const params = {
    TableName: "ActivitiesAndUsers",
    IndexName: "GSI3", // Assuming GSI1PK is the partition key for the GSI
    KeyConditionExpression:
      "GSI1PK = :pk AND begins_with(GSI3SK, :emailPrefix)",
    ExpressionAttributeValues: {
      ":pk": "USER#SearchableEmail",
      ":emailPrefix": emailPrefix.toLowerCase(),
    },
  };

  // Using the QueryCommand with the new client
  const command = new QueryCommand(params);
  const result = await ddbDocClient.send(command);
  return result.Items?.[0];
}

/**
 * Finds all activities for a given user ID.
 *
 * @param userId The ID of the user whose activities to find.
 * @returns A promise that resolves to an array of activities.
 */
async function findActivitiesByUserId(userIds: string[]) {
  console.log("Searching with matching user IDs", userIds);

  const filterExpression = `GSI1PK IN (${userIds
    .map((_, i) => `:userid${i + 1}`)
    .join(", ")})`;
  const expressionAttributeValues = userIds.reduce(
    (acc, userId, i) => ({ ...acc, [`:userid${i + 1}`]: userId }),
    {}
  );

  console.log("Filter expression", filterExpression);
  console.log("Expression attribute values", expressionAttributeValues);

  const params = {
    TableName: "ActivitiesAndUsers",
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    // Hack interpolations
    FilterExpression: filterExpression,
    ExpressionAttributeValues: {
      ":pk": "STORE#123",
      ":sk": "STORE#123#ACTIVITY#",
      ...expressionAttributeValues,
    },
  };

  console.log(params);

  const command = new QueryCommand(params);
  const result = await ddbDocClient.send(command);
  return result.Items;
}

async function main() {
  // Example usage of searching against first name
  const usersFirstName = await findUsersByFirstName(SEARCH_FIRST_NAME);
  console.log(usersFirstName);

  if (!usersFirstName?.length) {
    console.log("No users found with the given first name prefix.");
  } else {
    const user1Activities = await findActivitiesByUserId(
      usersFirstName.map((user: TODO) => user.PK)
    );
    console.log(user1Activities);
  }
}

main().catch(console.error);
