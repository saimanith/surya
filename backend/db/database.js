import knex from "knex";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "surya.db");

const db = knex({
  client: "sqlite3",
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.run("PRAGMA journal_mode=WAL;", cb);
    },
  },
});

export async function initDB() {
  const hasBills = await db.schema.hasTable("bills");
  if (!hasBills) {
    await db.schema.createTable("bills", (t) => {
      t.string("id").primary();
      t.string("bill_number").notNullable();
      t.string("customer_name").notNullable();
      t.string("customer_phone");
      t.float("subtotal").defaultTo(0);
      t.float("tax").defaultTo(0);
      t.float("discount").defaultTo(0);
      t.float("total").defaultTo(0);
      t.string("payment_method").defaultTo("cash");
      t.string("notes");
      t.string("status").defaultTo("pending");
      t.string("created_at").notNullable();
      t.string("date").notNullable();
    });
  }

  const hasItems = await db.schema.hasTable("bill_items");
  if (!hasItems) {
    await db.schema.createTable("bill_items", (t) => {
      t.string("id").primary();
      t.string("bill_id").notNullable();
      t.string("cloth_type").notNullable();
      t.float("meters").notNullable();
      t.float("price_per_meter").notNullable();
      t.float("amount").notNullable();
    });
  }

  const hasCustomers = await db.schema.hasTable("customers");
  if (!hasCustomers) {
    await db.schema.createTable("customers", (t) => {
      t.string("id").primary();
      t.string("name").notNullable();
      t.string("phone").unique();
      t.float("total_purchases").defaultTo(0);
      t.integer("visit_count").defaultTo(0);
      t.string("created_at").notNullable();
    });
  }

  const hasCatalog = await db.schema.hasTable("cloth_catalog");
  if (!hasCatalog) {
    await db.schema.createTable("cloth_catalog", (t) => {
      t.string("id").primary();
      t.string("name").notNullable().unique();
      t.float("default_price");
      t.string("unit").defaultTo("meter");
    });
    await db("cloth_catalog").insert([
      { id: "1",  name: "Cotton",    default_price: 120  },
      { id: "2",  name: "Silk",      default_price: 450  },
      { id: "3",  name: "Polyester", default_price: 90   },
      { id: "4",  name: "Linen",     default_price: 280  },
      { id: "5",  name: "Wool",      default_price: 380  },
      { id: "6",  name: "Denim",     default_price: 200  },
      { id: "7",  name: "Chiffon",   default_price: 320  },
      { id: "8",  name: "Velvet",    default_price: 500  },
      { id: "9",  name: "Satin",     default_price: 350  },
      { id: "10", name: "Georgette", default_price: 290  },
      { id: "11", name: "Khadi",     default_price: 160  },
      { id: "12", name: "Banarasi",  default_price: 1200 },
      { id: "13", name: "Chanderi",  default_price: 650  },
      { id: "14", name: "Tussar",    default_price: 420  },
    ]);
  }

  console.log("✅ Database ready:", DB_PATH);
}

export default db;
