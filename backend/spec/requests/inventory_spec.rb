require "rails_helper"
require "csv"
RSpec.describe "Inventory API", type: :request do
  let!(:account) { Account.create!(name: "Store") }
  let!(:owner) { account.users.create!(name: "Owner", email: "owner@example.test", password: "long-enough-password", role: "owner") }
  let!(:supplier) { account.suppliers.create!(name: "Supplier", email: "supplier@example.test") }
  let!(:product) { account.products.create!(name: "Notebook", sku: "PAP-001", supplier: supplier, unit_cost_cents: 1250, reorder_point: 5) }
  let(:auth) { { "Authorization" => "Bearer #{Session.issue!(owner)}" } }
  def move(kind, quantity, key = "request-#{SecureRandom.uuid}", reference = "Test operation")
    post "/api/products/#{product.id}/movements", params: { movement: { kind: kind, quantity: quantity, reference: reference } }, headers: auth.merge("Idempotency-Key" => key)
  end
  it "authenticates, expires and revokes sessions" do
    get "/api/products"
    expect(response.status).to eq(401)
    post "/api/session", params: { email: owner.email, password: "long-enough-password" }
    expect(response.status).to eq(201)
    h = { "Authorization" => "Bearer #{response.parsed_body.fetch('token')}" }
    delete "/api/session", headers: h
    get "/api/session", headers: h
    expect(response.status).to eq(401)
    owner.sessions.create!(token_digest: Digest::SHA256.hexdigest("expired"), expires_at: 1.minute.ago)
    get "/api/products", headers: { "Authorization" => "Bearer expired" }
    expect(response.status).to eq(401)
  end
  it "normalizes SKU and ignores client-supplied starting balances" do
    post "/api/products", params: { product: { name: "Pen", sku: "pen-002", on_hand: 999, account_id: 999 } }, headers: auth
    expect(response.status).to eq(201)
    expect(response.parsed_body).to include("sku" => "PEN-002", "on_hand" => 0)
  end
  it "records movements and prevents negative inventory atomically" do
    move("in", 10)
    expect(response.status).to eq(201)
    move("out", 7)
    expect(response.status).to eq(201)
    expect(product.reload.on_hand).to eq(3)
    move("out", 4)
    expect(response.status).to eq(422)
    expect(product.reload.on_hand).to eq(3)
    expect(product.movements.count).to eq(2)
    expect(product.movements.order(:id).pluck(:balance_after)).to eq([10,3])
  end
  it "replays identical requests without applying stock twice" do
    move("in", 10, "same-request-0001")
    expect(response.parsed_body.fetch("replayed")).to be(false)
    id = response.parsed_body.fetch("movement").fetch("id")
    move("in", 10, "same-request-0001")
    expect(response.status).to eq(200)
    expect(response.parsed_body).to include("replayed" => true)
    expect(response.parsed_body.dig("movement", "id")).to eq(id)
    expect(product.reload.on_hand).to eq(10)
    expect(product.movements.count).to eq(1)
  end
  it "rejects key reuse with different data and invalid quantities" do
    move("in", 10, "fixed-reference-1")
    move("in", 11, "fixed-reference-1")
    expect(response.status).to eq(409)
    [0, -1, "1.5", 1000001].each do |n|
      move("in", n)
      expect(response.status).to eq(422)
    end
    move("in", 1, "bad")
    expect(response.status).to eq(422)
    expect(product.reload.on_hand).to eq(10)
  end
  it "rolls back balance changes when the movement record is invalid" do
    move("in", 5, "valid-reference-1", "x" * 161)
    expect(response.status).to eq(422)
    expect(product.reload.on_hand).to eq(0)
    expect(product.movements.count).to eq(0)
  end
  it "isolates lists, suppliers, movement details and reports by workspace" do
    other = Account.create!(name: "Other")
    private_supplier = other.suppliers.create!(name: "Private", email: "private@example.test")
    private_product = other.products.create!(name: "Private product", sku: "PRIVATE", on_hand: 99)
    get "/api/products/#{private_product.id}", headers: auth
    expect(response.status).to eq(404)
    get "/api/products", params: { supplier_id: private_supplier.id }, headers: auth
    expect(response.status).to eq(404)
    post "/api/products", params: { product: { name: "Foreign", sku: "FOREIGN", supplier_id: private_supplier.id } }, headers: auth
    expect(response.status).to eq(404)
    get "/api/summary", headers: auth
    expect(response.parsed_body).to include("products" => 1, "units" => 0)
    post "/api/products/#{private_product.id}/movements", params: { movement: { kind: "in", quantity: 1, reference: "Forbidden" } }, headers: auth.merge("Idempotency-Key" => "foreign-reference-1")
    expect(response.status).to eq(404)
  end
  it "enforces owner/operator/viewer permissions" do
    owner.update!(role: "operator")
    post "/api/products", params: { product: { name: "Forbidden", sku: "NO" } }, headers: auth
    expect(response.status).to eq(403)
    post "/api/suppliers", params: { supplier: { name: "Forbidden" } }, headers: auth
    expect(response.status).to eq(403)
    move("in", 2)
    expect(response.status).to eq(201)
    owner.update!(role: "viewer")
    move("out", 1)
    expect(response.status).to eq(403)
    get "/api/products", headers: auth
    expect(response.status).to eq(200)
  end
  it "summarizes exact costs and filters inclusive reorder thresholds" do
    move("in", 5)
    get "/api/summary", headers: auth
    expect(response.parsed_body).to include("units" => 5, "inventory_value_cents" => 6250, "low_stock" => 1, "incoming_30d" => 5)
    get "/api/products", params: { stock: "low" }, headers: auth
    expect(response.parsed_body.fetch("total")).to eq(1)
    move("in", 1)
    get "/api/products", params: { stock: "low" }, headers: auth
    expect(response.parsed_body.fetch("total")).to eq(0)
  end
  it "paginates and exports safe filtered CSV" do
    20.times { |i| account.products.create!(name: "Item #{i}", sku: "ITEM-#{i}") }
    get "/api/products", params: { page: 2 }, headers: auth
    expect(response.parsed_body.fetch("products").size).to eq(1)
    get "/api/products", params: { q: "PAP-001" }, headers: auth
    expect(response.parsed_body.fetch("total")).to eq(1)
    product.update!(name: "=HYPERLINK(unsafe)")
    get "/api/export", params: { q: "PAP-001" }, headers: auth
    rows = CSV.parse(response.body, headers: true)
    expect(rows.size).to eq(1)
    expect(rows.first["name"]).to start_with("'=")
    expect(rows.first["unit_cost_brl"]).to eq("12.50")
  end
  it "enforces nonnegative balances in PostgreSQL and immutable movements in Active Record" do
    expect { Product.transaction(requires_new: true) { product.update_columns(on_hand: -1) } }.to raise_error(ActiveRecord::StatementInvalid)
    move("in", 1)
    expect { product.movements.first.update!(quantity: 10) }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end
end
