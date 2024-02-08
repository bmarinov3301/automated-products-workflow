import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand
} from "@aws-sdk/client-dynamodb";
import Product from '../types/Product';
import { env } from 'process';

const tableName = 'products-table';
const client = new DynamoDBClient({
  region: 'eu-central-1',
});

export const uploadProducts = async (dataRows: Product[]): Promise<void> => {
  console.log(`Uploading products to DynamoDB: ${JSON.stringify(dataRows)}`);
  for (let row of dataRows) {
    const availableAfter = row.AvailableAfter ?
      `${row.AvailableAfter}` : '0';

      await client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          productId: { S: row.Id},
          productName: { S: row.Name },
          price: { N: `${row.Price}` },
          available: { BOOL: row.Available},
          availableAfter: { N: availableAfter }
        },
      })
    );
  }
}

export const getProduct = async (productId: string): Promise<void> => {
  const command = new GetItemCommand({
    TableName: env.productsTableName,
    Key: {
      productId: { S: productId }
    }
  });
  const response = await client.send(command);

  console.log(`Retrieved item from Dynamo: ${JSON.stringify(response.Item)}`);
}