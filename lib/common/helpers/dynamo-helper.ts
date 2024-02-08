import {
  DynamoDB
} from 'aws-sdk';
import Product from '../types/Product';
import { env } from 'process';

const tableName = env.productsTableName ?? '';
const client = new DynamoDB.DocumentClient({
  region: 'eu-central-1',
});

export const uploadProducts = async (dataRows: Product[]): Promise<void> => {
  console.log(`Uploading products to DynamoDB: ${JSON.stringify(dataRows)}`);
  for (let row of dataRows) {
      const params: DynamoDB.DocumentClient.PutItemInput = {
        TableName: tableName,
        Item: {
          productId: row.Id,
          productName: row.Name,
          price: row.Price,
          available: row.Available,
          availableAfter: row.AvailableAfter
        }
      };

      const response = await client.put(params).promise();
  }
}

export const getProduct = async (productId: string): Promise<void> => {
  const params: DynamoDB.DocumentClient.GetItemInput = {
    Key: {
      productId: productId
    },
    TableName: tableName
  }
  const response = await client.get(params).promise();

  console.log(`Retrieved item from Dynamo: ${JSON.stringify(response)}`);
}