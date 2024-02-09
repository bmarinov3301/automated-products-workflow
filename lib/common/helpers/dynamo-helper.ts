import {
  DynamoDB
} from 'aws-sdk';
import ExternalProduct from '../types/ExternalProduct';
import Product from '../types/Product';
import { v4 as uuidv6 } from 'uuid';
import { env } from 'process';

const productsTable = env.productsTableName ?? '';
const ordersTable = env.ordersTableName ?? '';
const client = new DynamoDB.DocumentClient({
  region: 'eu-central-1',
});

export const uploadProducts = async (dataRows: ExternalProduct[]): Promise<void> => {
  console.log(`Uploading products to DynamoDB: ${JSON.stringify(dataRows)}`);
  for (let row of dataRows) {
      const params: DynamoDB.DocumentClient.PutItemInput = {
        TableName: productsTable,
        Item: {
          id: row.Id,
          name: row.Name,
          price: row.Price,
          available: row.Available,
          availableAfter: row.AvailableAfter
        }
      };

      const response = await client.put(params).promise();
  }
}

export const getProduct = async (productId: string): Promise<Product | null> => {
  console.log(`Fetching item with key ${productId} from DynamoDB...`);
  const params: DynamoDB.DocumentClient.GetItemInput = {
    Key: {
      id: productId
    },
    TableName: productsTable
  }
  const response = await client.get(params).promise();

  if (response.Item) {
    return response.Item as Product;
  } else {
    return null;
  }
}

export const createOrder = async (): Promise<string> => {
  const orderId = uuidv6();
  console.log(`Creating order in DynamoDB with order id ${orderId}`);

  const params: DynamoDB.DocumentClient.PutItemInput = {
    TableName: ordersTable,
    Item: {
      orderId,
      isComplete: false,
      products: []
    }
  }

  const response = await client.put(params).promise();
  return orderId;
}