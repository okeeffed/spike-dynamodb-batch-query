import {
  Stack,
  StackProps,
  aws_dynamodb as dynamodb,
  aws_opensearchservice as opensearch,
  aws_lambda as lambda,
  aws_iam as iam,
  CfnOutput,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "node:path";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

/**
 * TODO: Unused for now since spiking the stream is deemde out-of-scope.
 */
export class DynamoESStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, "ActivitiesAndUsersWithES", {
      tableName: "ActivitiesAndUsersWithES",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // or PROVISIONED
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // OpenSearch Domain
    const domain = new opensearch.Domain(this, "MyDomain", {
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      domainName: "activities-index",
      // Other configuration options as needed
    });

    // Lambda Function for Synchronization
    const syncLambda = new lambda.Function(this, "SyncLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.resolve(__dirname, "../lambda")),
      environment: {
        DYNAMODB_TABLE_NAME: table.tableName,
        OPENSEARCH_ENDPOINT: domain.domainEndpoint,
      },
    });

    // Grant the Lambda function permissions to read from DynamoDB and write to OpenSearch
    table.grantStreamRead(syncLambda);
    domain.grantWrite(syncLambda);

    // You might need additional IAM permissions depending on your OpenSearch access policy
    syncLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["es:ESHttpPost", "es:ESHttpPut"],
        resources: [domain.domainArn],
      })
    );

    // Create a Log Group for the Lambda function
    const lambdaLogGroup = new LogGroup(this, "LambdaLogGroup", {
      logGroupName: `/aws/lambda/${syncLambda.functionName}`,
      retention: RetentionDays.ONE_WEEK, // Optional: Configure log retention period
      removalPolicy: RemovalPolicy.DESTROY, // Optional: Configure removal policy
    });

    // Print the OpenSearch endpoint
    new CfnOutput(this, "OpenSearchEndpoint", {
      value: domain.domainEndpoint,
      description: "The endpoint for the OpenSearch domain",
    });

    new CfnOutput(this, "LogGroupArn", {
      value: lambdaLogGroup.logGroupArn,
      description: "LogGroup ARN",
    });
  }
}
