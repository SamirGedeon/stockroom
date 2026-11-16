class CreateInventory < ActiveRecord::Migration[7.2]
  def change
    create_table :accounts do |t|
      t.string :name, null: false
      t.string :time_zone, null: false, default: "America/Sao_Paulo"
      t.timestamps
    end
    create_table :users do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "viewer"
      t.timestamps
    end
    add_index :users, :email, unique: true
    add_check_constraint :users, "role IN ('owner','operator','viewer')", name: "valid_role"
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :sessions, :token_digest, unique: true
    create_table :suppliers do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.string :phone
      t.timestamps
    end
    add_index :suppliers, [:account_id, :name], unique: true
    create_table :products do |t|
      t.references :account, null: false, foreign_key: true
      t.references :supplier, foreign_key: true
      t.string :sku, null: false
      t.string :name, null: false
      t.string :location
      t.integer :on_hand, null: false, default: 0
      t.integer :reorder_point, null: false, default: 0
      t.integer :unit_cost_cents, null: false, default: 0
      t.timestamps
    end
    add_index :products, [:account_id, :sku], unique: true
    add_check_constraint :products, "on_hand BETWEEN 0 AND 1000000 AND reorder_point BETWEEN 0 AND 1000000 AND unit_cost_cents BETWEEN 0 AND 1000000", name: "valid_stock_values"
    create_table :movements do |t|
      t.references :account, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :kind, null: false
      t.integer :quantity, null: false
      t.integer :balance_after, null: false
      t.string :reference, null: false
      t.string :idempotency_key, null: false
      t.timestamps
    end
    add_index :movements, [:account_id, :idempotency_key], unique: true
    add_index :movements, [:account_id, :created_at]
    add_check_constraint :movements, "kind IN ('in','out') AND quantity BETWEEN 1 AND 1000000 AND balance_after BETWEEN 0 AND 1000000", name: "valid_movement"
  end
end
