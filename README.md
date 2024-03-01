# Spike DynamoDB for self-controlled batch fetch

## How to run the spike

I opted to use [LocalStack](https://www.localstack.cloud/) for the spike with `aws-cdk` to attempt to keep it minimal. This means that you will need to run.

### Prerequisites

- Docker (used for `docker compose`).
- Node 20.
- PNPM

## Running the spike

Run a bash bootstrap script to set up LocalStack, DynamoDB admin, deploy the AWS CDK locally (very limited capabilities but useful) and seed the data.

```bash
# Run the bootstrap script
$ pnpm bootstrap
```

Once the data it bootstrapped and Docker compose is up, you can head to `localhost:8001` to see the data.

![Admin panel](./imgs/admin.png)

Open the `SpikeBatchGetAndQuery` table to see the date.
