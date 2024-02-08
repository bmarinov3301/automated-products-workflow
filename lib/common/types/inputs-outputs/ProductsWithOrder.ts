import { StatePayload } from './StatePayload';

export type ProductsWithOrder = {
  products?: any[],
  orderId?: string
} & StatePayload