import knex from "knex";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "surya.db");

const db = knex({
  client: "sqlite3",
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
  pool: { afterCreate: (conn, cb) => { conn.run("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;", cb); } },
});

export async function initDB() {
  // BILLS
  const hasBills = await db.schema.hasTable("bills");
  if (!hasBills) {
    await db.schema.createTable("bills", (t) => {
      t.string("id").primary();
      t.string("bill_number").notNullable();
      t.string("customer_name").notNullable();
      t.string("customer_phone");
      t.string("customer_email");
      t.float("subtotal").defaultTo(0);
      t.float("tax").defaultTo(0);
      t.float("discount").defaultTo(0);
      t.float("total").defaultTo(0);
      t.string("payment_method").defaultTo("cash");
      t.string("notes");
      t.string("status").defaultTo("pending");
      t.string("payment_status").defaultTo("unpaid");
      t.string("created_at").notNullable();
      t.string("date").notNullable();
    });
  } else {
    const cols = ["payment_status","customer_email"];
    for (const col of cols) {
      if (!await db.schema.hasColumn("bills", col))
        await db.schema.table("bills", t => t.string(col).defaultTo(col === "payment_status" ? "unpaid" : null));
    }
  }

  // BILL ITEMS
  const hasItems = await db.schema.hasTable("bill_items");
  if (!hasItems) {
    await db.schema.createTable("bill_items", (t) => {
      t.string("id").primary();
      t.string("bill_id").notNullable();
      t.string("cloth_type").notNullable();
      t.string("bolt_id"); // optional bolt reference
      t.float("meters").notNullable();
      t.float("price_per_meter").notNullable();
      t.float("amount").notNullable();
    });
  } else {
    if (!await db.schema.hasColumn("bill_items","bolt_id"))
      await db.schema.table("bill_items", t => t.string("bolt_id"));
  }

  // CUSTOMERS
  const hasCustomers = await db.schema.hasTable("customers");
  if (!hasCustomers) {
    await db.schema.createTable("customers", (t) => {
      t.string("id").primary();
      t.string("name").notNullable();
      t.string("phone").unique();
      t.string("email");
      t.float("total_purchases").defaultTo(0);
      t.integer("visit_count").defaultTo(0);
      t.string("created_at").notNullable();
    });
  }

  // CLOTH CATALOG
  const hasCatalog = await db.schema.hasTable("cloth_catalog");
  if (!hasCatalog) {
    await db.schema.createTable("cloth_catalog", (t) => {
      t.string("id").primary();
      t.string("name").notNullable().unique();
      t.float("default_price");
      t.string("unit").defaultTo("meter");
    });
    await db("cloth_catalog").insert([
      {id:"1",name:"Cotton",default_price:120},{id:"2",name:"Silk",default_price:450},
      {id:"3",name:"Polyester",default_price:90},{id:"4",name:"Linen",default_price:280},
      {id:"5",name:"Wool",default_price:380},{id:"6",name:"Denim",default_price:200},
      {id:"7",name:"Chiffon",default_price:320},{id:"8",name:"Velvet",default_price:500},
      {id:"9",name:"Satin",default_price:350},{id:"10",name:"Georgette",default_price:290},
      {id:"11",name:"Khadi",default_price:160},{id:"12",name:"Banarasi",default_price:1200},
      {id:"13",name:"Chanderi",default_price:650},{id:"14",name:"Tussar",default_price:420},
    ]);
  }

  // BOLTS OF CLOTH — inventory
  const hasBolts = await db.schema.hasTable("bolts");
  if (!hasBolts) {
    await db.schema.createTable("bolts", (t) => {
      t.string("id").primary(); // e.g. BOLT-CTN-001
      t.string("cloth_type").notNullable();
      t.string("cloth_catalog_id");
      t.float("total_meters").notNullable();
      t.float("remaining_meters").notNullable();
      t.float("cost_price_per_meter").defaultTo(0); // purchase price
      t.float("selling_price_per_meter").defaultTo(0);
      t.string("color");
      t.string("supplier");
      t.string("notes");
      t.string("status").defaultTo("active"); // active | exhausted | returned
      t.string("received_date").notNullable();
      t.string("created_at").notNullable();
    });
  }

  // DELETED BILLS ARCHIVE
  const hasDeleted = await db.schema.hasTable("deleted_bills");
  if (!hasDeleted) {
    await db.schema.createTable("deleted_bills", (t) => {
      t.string("id").primary();
      t.string("original_id").notNullable();
      t.string("bill_number");
      t.string("customer_name");
      t.string("customer_phone");
      t.float("total").defaultTo(0);
      t.string("payment_method");
      t.string("status");
      t.string("deleted_at").notNullable();
      t.string("deleted_by").defaultTo("admin");
      t.text("bill_snapshot");
    });
  }

  // EXPENDITURES
  const hasExp = await db.schema.hasTable("expenditures");
  if (!hasExp) {
    await db.schema.createTable("expenditures", (t) => {
      t.string("id").primary();
      t.string("type").notNullable();
      t.string("category");
      t.string("description").notNullable();
      t.string("party_name");
      t.string("party_phone");
      t.float("amount").notNullable();
      t.string("status").defaultTo("done");
      t.string("due_date");
      t.string("date").notNullable();
      t.string("created_at").notNullable();
    });
  }

  // CASH REGISTER — daily cash tracking
  const hasCash = await db.schema.hasTable("cash_register");
  if (!hasCash) {
    await db.schema.createTable("cash_register", (t) => {
      t.string("id").primary();
      t.string("date").notNullable();
      t.string("type").notNullable(); // opening | deposit | withdrawal | closing
      t.float("amount").notNullable();
      t.string("description");
      t.string("created_at").notNullable();
    });
  }

  // DAY SETTLEMENTS
  const hasSettlement = await db.schema.hasTable("day_settlements");
  if (!hasSettlement) {
    await db.schema.createTable("day_settlements", (t) => {
      t.string("id").primary();
      t.string("date").notNullable().unique();
      t.float("total_sales").defaultTo(0);
      t.float("cash_sales").defaultTo(0);
      t.float("upi_sales").defaultTo(0);
      t.float("card_sales").defaultTo(0);
      t.float("credit_sales").defaultTo(0);
      t.float("total_tax").defaultTo(0);
      t.float("total_discount").defaultTo(0);
      t.float("total_expenditure").defaultTo(0);
      t.float("opening_cash").defaultTo(0);
      t.float("closing_cash").defaultTo(0);
      t.float("net_cash_in_register").defaultTo(0);
      t.integer("total_bills").defaultTo(0);
      t.string("notes");
      t.string("closed_at");
      t.string("status").defaultTo("open");
    });
  }

  // PURCHASE ORDERS
  const hasPO = await db.schema.hasTable("purchase_orders");
  if (!hasPO) {
    await db.schema.createTable("purchase_orders", (t) => {
      t.string("id").primary();
      t.string("po_number").notNullable();
      t.string("supplier_name");
      t.string("cloth_type").notNullable();
      t.float("meters_ordered").notNullable();
      t.float("price_per_meter");
      t.float("total_amount").defaultTo(0);
      t.string("status").defaultTo("pending"); // pending | received | cancelled
      t.string("expected_date");
      t.string("notes");
      t.string("created_at").notNullable();
      t.string("date").notNullable();
    });
  }

  // ADMIN USERS
  const hasAdmin = await db.schema.hasTable("admin_users");
  if (!hasAdmin) {
    await db.schema.createTable("admin_users", (t) => {
      t.string("id").primary();
      t.string("username").notNullable().unique();
      t.string("password_hash").notNullable();
      t.string("role").defaultTo("admin");
      t.string("created_at").notNullable();
      t.string("last_login");
    });
    const { createHash } = await import("crypto");
    const hash = createHash("sha256").update("surya123" + "surya_salt_2024").digest("hex");
    await db("admin_users").insert({ id:"1", username:"admin", password_hash: hash, role:"superadmin", created_at: new Date().toISOString() });
  }

  console.log("✅ Database ready:", DB_PATH);
}

export default db;
