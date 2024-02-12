import {
  DynamoDB
} from 'aws-sdk';
import ExternalProduct from '../types/ExternalProduct';
import Product from '../types/Product';
import { region } from '../constants';
import { v4 as uuidv6 } from 'uuid';
import { env } from 'process';
import { Order } from '../types/Order';

const productsTable = env.productsTableName ?? '';
const ordersTable = env.ordersTableName ?? '';
const client = new DynamoDB.DocumentClient({ region });

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

export const getOrder = async (orderId: string): Promise<Order | null> => {
  console.log(`Retrieving order from DynamoDB with order id ${orderId}`);
  const params: DynamoDB.DocumentClient.GetItemInput = {
    TableName: ordersTable,
    Key: {
      orderId: orderId
    }
  }

  const response = await client.get(params).promise();
  if (response.Item) {
    return response.Item as Order;
  } else {
    return null;
  }
}

export const createOrder = async (products: Product[]): Promise<string> => {
  const orderId = uuidv6();
  console.log(`Creating order in DynamoDB with id ${orderId}`);

  const params: DynamoDB.DocumentClient.PutItemInput = {
    TableName: ordersTable,
    Item: {
      orderId,
      isComplete: false,
      products
    }
  }

  const response = await client.put(params).promise();
  return orderId;
}

export const completeOrder = async (orderId: string): Promise<string> => {
  console.log(`Completing order with id ${orderId}`);

  const order = await getOrder(orderId);
  if (!order) {
    console.log(`Could not find order with id ${orderId}`);
    return '';
  } else {
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: ordersTable,
      Item: {
        orderId,
        isComplete: true,
        products: []
      }
    }

    const response = await client.put(params).promise();
    return orderId;
  }
}