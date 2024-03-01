import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { faker } from "@faker-js/faker";

const client = new DynamoDBClient({
  endpoint: `http://localhost:4566`,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAMES = ["SpikeBatchGetAndQuery"];

const NUM_ROLES = 50;
const NUM_PARTIES = 10;

/**
 * Seed users with random data.
 */
async function seedRoles(tableName: string, parties) {
  let items = [];

  for (let i = 0; i < NUM_PARTIES; i++) {
    for (let j = 0; j < NUM_ROLES / NUM_PARTIES; j++) {
      const updatedAt = new Date().toISOString();

      items.push({
        PutRequest: {
          Item: {
            composite_id: `ROLE#${faker.string.uuid()}`,
            sort_key: parties[i],
            description: faker.string.alphanumeric(10),
            name: faker.string.alphanumeric(10),
            // The important stuff
            gsi_pk_2: parties[i],
            gsi_sk_2: updatedAt,
            created_at: updatedAt,
            updated_at: updatedAt,
          },
        },
      });

      if (items.length === 10) {
        await ddbDocClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: items,
            },
          })
        );
        items.length = 0; // Clear the array
      }
    }
  }
}

/**
 * Seed activities for the given users. This is done so that
 * some users become searchable from the `main.ts` file.
 */
async function mockParties() {
  // Create 10 different parties
  let parties = [];

  for (let i = 0; i < NUM_PARTIES; i++) {
    const partyType = "Merchant"; // I'm sure this is all we are using
    const partyId = faker.string.uuid();

    parties.push(`PartyType#${partyType}#PartyId#${partyId}`);
  }

  return parties;
}

async function seedData() {
  for (const tableName of TABLE_NAMES) {
    console.log(`Seeding data for table: ${tableName}`);

    console.log("Mocking parties...");
    const parties = await mockParties();

    console.log("Seeding roles with parties...");
    await seedRoles(tableName, parties);

    console.log("Seeding completed.");
  }
}

seedData().catch(console.error);
