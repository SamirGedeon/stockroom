require "rails_helper"
RSpec.describe "Concurrent withdrawals", type: :request do
  self.use_transactional_tests = false
  it "serializes competing withdrawals and preserves a nonnegative reconciled balance" do
    account = Account.create!(name: "Concurrency fixture")
    owner = account.users.create!(name: "Operator", email: "concurrency-#{SecureRandom.hex(8)}@example.test", password: "long-enough-password", role: "owner")
    product = account.products.create!(name: "Limited stock", sku: "LIMITED")
    StockMove.call(product, owner, { kind: "in", quantity: 5, reference: "Initial stock" }, "initial-#{SecureRandom.uuid}")
    ready, start = Queue.new, Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          start.pop
          begin
            StockMove.call(Product.find(product.id), owner, { kind: "out", quantity: 4, reference: "Concurrent withdrawal" }, SecureRandom.uuid)
            :success
          rescue InvalidInput
            :rejected
          end
        end
      end
    end
    2.times { ready.pop }
    2.times { start << true }
    expect(threads.map(&:value).sort).to eq([:rejected, :success])
    expect(product.reload.on_hand).to eq(1)
    expect(product.movements.where(kind: "out").sum(:quantity)).to eq(4)
  ensure
    if account&.persisted?
      Movement.where(account_id: account.id).delete_all
      Product.where(account_id: account.id).delete_all
      User.where(account_id: account.id).delete_all
      account.reload.destroy!
    end
  end
end
