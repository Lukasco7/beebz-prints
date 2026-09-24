"use client";

import { useMemo, useState } from "react";

type PricingTier = {
  id: string;
  minimum_quantity: number;
  unit_price: number;
};

type ProductPriceCalculatorProps = {
  tiers: PricingTier[];
  fallbackPrice: number | null;
  priceUnit: string | null;
};

export default function ProductPriceCalculator({
  tiers,
  fallbackPrice,
  priceUnit,
}: ProductPriceCalculatorProps) {
  // Start empty so the customer can type immediately.
  const [quantity, setQuantity] = useState("");

  const sortedTiers = useMemo(
    () =>
      [...tiers].sort(
        (a, b) => a.minimum_quantity - b.minimum_quantity
      ),
    [tiers]
  );

  const numericQuantity = Number(quantity);

  const hasValidQuantity =
    quantity !== "" &&
    Number.isFinite(numericQuantity) &&
    numericQuantity >= 1;

  const selectedTier = useMemo(() => {
    if (!hasValidQuantity || sortedTiers.length === 0) {
      return null;
    }

    let current = sortedTiers[0];

    for (const tier of sortedTiers) {
      if (numericQuantity >= tier.minimum_quantity) {
        current = tier;
      } else {
        break;
      }
    }

    return current;
  }, [numericQuantity, hasValidQuantity, sortedTiers]);

  const unitPrice =
    selectedTier?.unit_price ?? fallbackPrice;

  const totalPrice =
    hasValidQuantity && unitPrice !== null
      ? unitPrice * numericQuantity
      : null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  if (unitPrice === null) {
    return null;
  }

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B000D4]">
        Calculate Your Price
      </p>

      <div className="mt-5">
        <label
          htmlFor="product-quantity"
          className="text-sm font-medium text-white/70"
        >
          Quantity
        </label>

        <input
          id="product-quantity"
          type="number"
          min="1"
          step="1"
          value={quantity}
          placeholder="Enter quantity"
          onChange={(event) => {
            const value = event.target.value;

            // Allow the field to be completely empty.
            if (value === "") {
              setQuantity("");
              return;
            }

            // Only allow whole numbers.
            if (!/^\d+$/.test(value)) {
              return;
            }

            // Prevent zero.
            if (Number(value) < 1) {
              return;
            }

            setQuantity(value);
          }}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080A0F] px-4 py-3 text-white outline-none transition focus:border-[#B000D4]"
        />
      </div>

      {hasValidQuantity ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Unit Price */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm text-white/50">
              Unit Price
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatPrice(unitPrice!)}
            </p>

            <p className="mt-1 text-sm text-white/40">
              per {priceUnit ?? "unit"}
            </p>
          </div>

          {/* Total Price */}
          <div className="rounded-2xl border border-[#B000D4]/30 bg-[#B000D4]/10 p-5">
            <p className="text-sm text-white/50">
              Estimated Total
            </p>

            <p className="mt-2 text-2xl font-bold text-[#B000D4]">
              {totalPrice !== null
                ? formatPrice(totalPrice)
                : "—"}
            </p>

            <p className="mt-1 text-sm text-white/40">
              {numericQuantity} {priceUnit ?? "units"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm text-white/50">
            Enter a quantity above to calculate your price.
          </p>
        </div>
      )}

      {hasValidQuantity &&
        selectedTier &&
        sortedTiers.length > 1 && (
          <p className="mt-5 text-sm text-white/45">
            Your quantity qualifies for the{" "}
            <span className="font-semibold text-white/70">
              {selectedTier.minimum_quantity}+
            </span>{" "}
            volume price of{" "}
            <span className="font-semibold text-white/70">
              {formatPrice(selectedTier.unit_price)}
            </span>{" "}
            per {priceUnit ?? "unit"}.
          </p>
        )}
    </div>
  );
}