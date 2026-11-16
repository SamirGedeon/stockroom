# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_11_16_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "accounts", force: :cascade do |t|
    t.string "name", null: false
    t.string "time_zone", default: "America/Sao_Paulo", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "movements", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "product_id", null: false
    t.bigint "actor_id", null: false
    t.string "kind", null: false
    t.integer "quantity", null: false
    t.integer "balance_after", null: false
    t.string "reference", null: false
    t.string "idempotency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "created_at"], name: "index_movements_on_account_id_and_created_at"
    t.index ["account_id", "idempotency_key"], name: "index_movements_on_account_id_and_idempotency_key", unique: true
    t.index ["account_id"], name: "index_movements_on_account_id"
    t.index ["actor_id"], name: "index_movements_on_actor_id"
    t.index ["product_id"], name: "index_movements_on_product_id"
    t.check_constraint "(kind::text = ANY (ARRAY['in'::character varying, 'out'::character varying]::text[])) AND quantity >= 1 AND quantity <= 1000000 AND balance_after >= 0 AND balance_after <= 1000000", name: "valid_movement"
  end

  create_table "products", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "supplier_id"
    t.string "sku", null: false
    t.string "name", null: false
    t.string "location"
    t.integer "on_hand", default: 0, null: false
    t.integer "reorder_point", default: 0, null: false
    t.integer "unit_cost_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "sku"], name: "index_products_on_account_id_and_sku", unique: true
    t.index ["account_id"], name: "index_products_on_account_id"
    t.index ["supplier_id"], name: "index_products_on_supplier_id"
    t.check_constraint "on_hand >= 0 AND on_hand <= 1000000 AND reorder_point >= 0 AND reorder_point <= 1000000 AND unit_cost_cents >= 0 AND unit_cost_cents <= 1000000", name: "valid_stock_values"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "suppliers", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.string "email", null: false
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "name"], name: "index_suppliers_on_account_id_and_name", unique: true
    t.index ["account_id"], name: "index_suppliers_on_account_id"
  end

  create_table "users", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", default: "viewer", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_users_on_account_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.check_constraint "role::text = ANY (ARRAY['owner'::character varying, 'operator'::character varying, 'viewer'::character varying]::text[])", name: "valid_role"
  end

  add_foreign_key "movements", "accounts"
  add_foreign_key "movements", "products"
  add_foreign_key "movements", "users", column: "actor_id"
  add_foreign_key "products", "accounts"
  add_foreign_key "products", "suppliers"
  add_foreign_key "sessions", "users"
  add_foreign_key "suppliers", "accounts"
  add_foreign_key "users", "accounts"
end
