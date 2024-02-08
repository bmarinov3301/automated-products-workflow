import {
  DynamoDBClient,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";
import Product from '../../common/types/Product';

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