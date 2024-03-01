## Recount (OMITTED TODO)

First, I created a new folder `spike-dynamodb-search`, and then added some base files:

```bash
# Create folder
$ mkdir spike-dynamodb-search
$ cd spike-dynamodb-search
$ pnpm init
$ touch README.md docker-compose.yml
```

Inside of `docker-compose.yml`:

```yml
version: "3.8"

services:
  localstack:
    container_name: "${LOCALSTACK_DOCKER_NAME:-localstack-main}"
    image: localstack/localstack
    ports:
      - "127.0.0.1:4566:4566" # LocalStack Gateway
      - "127.0.0.1:4510-4559:4510-4559" # external services port range
    environment:
      # LocalStack configuration: https://docs.localstack.cloud/references/configuration/
      - DEBUG=${DEBUG:-0}
      - "SERVICES=dynamodb"
      - "PORT_WEB_UI=8090"
    volumes:
      - "${LOCALSTACK_VOLUME_DIR:-./volume}:/var/lib/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
    networks:
      - "local"
  dynamodb-admin:
    image: "aaronshaf/dynamodb-admin:latest"
    container_name: "dynamodb-viewer"
    ports:
      - "8001:8001"
    environment:
      DYNAMO_ENDPOINT: http://localstack:4566
      AWS_REGION: ${AWS_REGION:-local}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-local}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:-local}
    depends_on:
      - "localstack"
    networks:
      - "local"

networks:
  local:
    driver: "bridge"
```

I saw [dynamodb-admin](https://github.com/aaronshaf/dynamodb-admin/issues/29) online and decided to try it out for the demo.

### Setting up the AWS CDK

```bash
# Create an infra directory from root
$ mkdir infra
$ cd infra
$ cdk init app --language typescript
```

Afterwards, I removed `package-lock.json` and so I could use `pnpm` instead.

To configure `aws-cdk-local` for the infra to run on LocalStack, I just followed [an old tutorial I wrote years ago](https://blog.dennisokeeffe.com/blog/2021-08-07-using-the-aws-cdk-with-localstack-and-aws-cdk-local).

It's just a thin wrapper pointing to the local URL, so I just add a new script `"cdk-local": "pnpnx aws-cdk-local"` to `infra/package.json`.

```bash
# Install required values
$ pn add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb typescript @types/node @faker-js/faker
```
