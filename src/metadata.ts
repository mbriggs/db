import metadata from "@mbriggs/metadata";
import debug from "debug";

const log = debug("db:cancel");

interface Queryer {
  query(query: string): Promise<any>;
}

type WithConnection = (fn: (query: Queryer) => Promise<void>) => Promise<void>;

class ClientMetadata {
  pid: string;
  withConnection: WithConnection;
  configured: boolean;

  assure() {
    if (!this.withConnection) {
      throw new Error("connection not configured");
    }
  }
}

export function configure(client: any, withConnection: WithConnection) {
  let meta = metadata(client, ClientMetadata);
  if (meta.configured) {
    return;
  }

  meta.withConnection = withConnection;
  meta.configured = true;
}

export async function assurePID(client: any) {
  let meta = metadata(client, ClientMetadata);
  if (meta.pid) {
    return;
  }

  let result = await client.query("SELECT pg_backend_pid()");

  if (meta.pid) {
    return;
  }
  meta.pid = result.rows[0]["pg_backend_pid"];
}

export async function cancelQuery(client: any) {
  let meta = metadata(client, ClientMetadata);
  meta.assure();

  await meta.withConnection(async (queryer) => {
    log("cancelling pid: %s", meta.pid);

    await queryer.query("SELECT pg_cancel_backend($1);", [meta.pid]);

    log("done");
  });
}
