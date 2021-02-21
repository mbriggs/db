import { Context } from "@mbriggs/context";

export type Query = (ctx: Context, query: string, params: any[]) => Promise<any[]>;

export interface Exec extends Query {
  tx(ctx: Context, fn: (query: Query) => Promise<any[]>): Promise<any[]>;
}
