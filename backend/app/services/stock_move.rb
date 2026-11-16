class StockMove
  def self.call(product, actor, attrs, key)
    key = key.to_s
    raise InvalidInput, "Idempotency-Key must contain 8 to 100 letters, digits or . _ : -" unless key.match?(/\A[A-Za-z0-9][A-Za-z0-9._:-]{7,99}\z/)
    kind = attrs[:kind].to_s
    quantity = Integer(attrs[:quantity].to_s, exception: false)
    reference = attrs[:reference].to_s.strip
    raise InvalidInput, "kind must be in or out" unless %w[in out].include?(kind)
    raise InvalidInput, "quantity must be an integer from 1 to 1000000" unless quantity && (1..1_000_000).cover?(quantity)
    raise InvalidInput, "reference must contain 1 to 160 characters" unless (1..160).cover?(reference.length)
    raise InvalidInput, "Actor must belong to this workspace" unless actor.account_id == product.account_id
    result = product.with_lock do
      existing = product.account.movements.find_by(idempotency_key: key)
      if existing
        unless existing.product_id == product.id && existing.kind == kind && existing.quantity == quantity && existing.reference == reference
          raise RequestConflict, "This Idempotency-Key was already used with different data"
        end
        next { movement: existing, replayed: true }
      end
      balance = product.on_hand + (kind == "in" ? quantity : -quantity)
      raise InvalidInput, "Insufficient stock for this withdrawal" if balance.negative?
      raise InvalidInput, "Stock cannot exceed 1000000 units per product" if balance > 1_000_000
      product.update!(on_hand: balance)
      movement = product.account.movements.create!(product: product, actor: actor, kind: kind, quantity: quantity, reference: reference, balance_after: balance, idempotency_key: key)
      { movement: movement, replayed: false }
    end
    result
  end
end
