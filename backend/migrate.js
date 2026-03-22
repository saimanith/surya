import knex from "knex";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = knex({
  client: "sqlite3",
  connection: { filename: path.join(__dirname, "db/surya.db") },
  useNullAsDefault: true,
});

const columns = [
  { name: "description",     type: "string",  def: "" },
  { name: "fabric_category", type: "string",  def: "" },
  { name: "markup_pct",      type: "float",   def: 90 },
  { name: "seller_name",     type: "string",  def: "" },
  { name: "seller_phone",    type: "string",  def: "" },
  { name: "seller_id",       type: "string",  def: "" },
  { name: "purchase_date",   type: "string",  def: "" },
];

for (const col of columns) {
  const exists = await db.schema.hasColumn("bolts", col.name);
  if (!exists) {
    await db.schema.table("bolts", t => {
      if (col.type === "float") t.float(col.name).defaultTo(col.def);
      else t.string(col.name).defaultTo(col.def);
    });
    console.log(`✅ Added: ${col.name}`);
  } else {
    console.log(`⏭  Already exists: ${col.name}`);
  }
}

console.log("Migration complete.");
await db.destroy();
