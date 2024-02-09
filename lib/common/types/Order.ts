import Product from "./Product"

export type Order = {
  orderId: string,
  isComplete: boolean,
  products: Product[]
}