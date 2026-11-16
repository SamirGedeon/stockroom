abort "Demo seed disabled in production" if Rails.env.production?
a = Account.find_or_create_by!(name: "Aurora Supply")
[["owner", "Samir Gedeon"], ["operator", "Marina Costa"], ["viewer", "Lucas Almeida"]].each do |role, name|
  User.find_or_create_by!(email: "#{role}@stockroom.test") { |u| u.assign_attributes(account: a, name: name, role: role, password: ENV.fetch("DEMO_PASSWORD", "Stockroom-demo-2026!")) }
end
owner = a.users.find_by!(role: "owner")
[["Papel & Forma", "contato@papelforma.example.test"], ["Studio Essentials", "vendas@studio.example.test"]].each do |name, email|
  a.suppliers.find_or_create_by!(name: name) { |s| s.email = email }
end
[["Caderno pontilhado A5", "PAP-001", "A-01", 24, 10, 3290], ["Caneta gel preta", "PAP-002", "A-02", 8, 15, 890], ["Planner semanal", "PAP-003", "A-03", 16, 5, 4590], ["Bloco de notas adesivas", "PAP-004", "B-01", 0, 10, 1290], ["Pasta organizadora", "ORG-001", "B-02", 42, 12, 1890], ["Estojo de lona", "ORG-002", "B-03", 6, 8, 2590]].each_with_index do |(name, sku, location, stock, min, cost), i|
  p = a.products.find_or_create_by!(sku: sku) { |x| x.assign_attributes(name: name, location: location, reorder_point: min, unit_cost_cents: cost, supplier: a.suppliers.order(:id)[i % 2]) }
  StockMove.call(p, owner, { kind: "in", quantity: stock, reference: "Saldo inicial de demonstração" }, "seed-in-#{sku}") if stock > 0
end
