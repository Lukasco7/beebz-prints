"use client";

import { useMemo, useState } from "react";

type PricingTier = {
  id: string;
  minimum_quantity: number;
  unit_price: number;
};

type ProductPricingProps = {
  tiers: PricingTier[];
  fallbackPrice: number | null;
  priceUnit: string | null;
};

export default function ProductPricing({
  tiers,
  fallbackPrice,
  priceUnit,
}: ProductPricingProps) {
  const minimumQuantity =
    tiers.length > 0 ? tiers[0].minimum_quantity : 1;

  const [quantity, setQuantity] = useState(minimumQuantity);

  const activeTier = useMemo(() => {
    if (tiers.length === 0) {
      return null;
    }

    let selected = tiers[0];

    for (const tier of tiers) {
      if (quantity >= tier.minimum_quantity) {
        selected = tier;
      } else {
        break;
      }
    }

    return selected;
  }, [quantity, tiers]);

  // Use the active tier price when tiers exist.
  // Otherwise use the product's starting price.
  const unitPrice =
    activeTier?.unit_price ??
    (fallbackPrice !== null ? Number(fallbackPrice) : null);

  // ALWAYS calculate total when a unit price exists.
  const total =
    unitPrice !== null && quantity > 0
      ? unitPrice * quantity
      : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
      {/* CURRENT PRICE */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Volume Pricing
        </p>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold md:text-4xl">
            {unitPrice !== null
              ? `GH₵ ${unitPrice.toLocaleString()}`
              : "Get a quote"}
          </span>

          {priceUnit && (
            <span className="pb-1 text-sm text-white/40">
              {priceUnit}
            </span>
          )}
        </div>
      </div>

      {/* QUANTITY */}
      <div className="mt-6">
        <label
          htmlFor="product-quantity"
          className="text-sm font-medium text-white/70"
        >
          Quantity
        </label>

        <input
          id="product-quantity"
          type="number"
          min={minimumQuantity}
          step="1"
          value={quantity}
          onChange={(event) => {
            const value = Number(event.target.value);

            if (!Number.isFinite(value) || value < 1) {
              setQuantity(1);
              return;
            }

            setQuantity(Math.floor(value));
          }}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-lg text-white outline-none transition focus:border-[#FF6B35]"
        />
      </div>

      {/* PRICE CALCULATION */}
      {unitPrice !== null && (
        <div className="mt-5 rounded-2xl border border-[#FF6B35]/20 bg-[#FF6B35]/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-white/50">
              Unit price
            </span>

            <span className="font-semibold text-[#FF6B35]">
              GH₵ {unitPrice.toLocaleString()}
              {priceUnit ? ` / ${priceUnit}` : ""}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-white/50">
              Quantity
            </span>

            <span className="font-semibold">
              {quantity.toLocaleString()}
            </span>
          </div>

          <div className="my-4 border-t border-white/10" />

          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-medium text-white/70">
              Estimated Total
            </span>

            <span className="text-2xl font-bold text-white">
              GH₵ {total?.toLocaleString() ?? "0"}
            </span>
          </div>
        </div>
      )}

      {/* DISCOUNT TIERS */}
      {tiers.length > 1 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35">
            Quantity Discounts
          </p>

          <div className="mt-3 space-y-2">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                  activeTier?.id === tier.id
                    ? "border border-[#FF6B35]/30 bg-[#FF6B35]/10"
                    : "border border-white/5 bg-white/[0.02]"
                }`}
              >
                <span className="text-white/60">
                  {tier.minimum_quantity.toLocaleString()}+ units
                </span>

                <span className="font-semibold">
                  GH₵ {tier.unit_price.toLocaleString()} / unit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-white/35">
        Prices shown are estimates. Final pricing may vary depending on
        specifications, materials, finishing, and artwork requirements.
      </p>
    </div>
  );
}