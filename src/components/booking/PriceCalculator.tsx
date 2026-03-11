import { formatPrice } from "@/lib/utils";
import { addOns } from "./AddOnSelector";

interface PriceCalculatorProps {
  basePrice: number;
  selectedAddOns: Record<string, boolean>;
  attendees: number;
}

export default function PriceCalculator({
  basePrice,
  selectedAddOns,
  attendees,
}: PriceCalculatorProps) {
  const addOnItems: { label: string; amount: number }[] = [];

  for (const addon of addOns) {
    if (!selectedAddOns[addon.id]) continue;
    let amount = addon.price;
    if (addon.id === "catering") amount = addon.price * attendees;
    if (addon.id === "parking") amount = addon.price * Math.ceil(attendees / 2);
    addOnItems.push({ label: addon.label, amount });
  }

  const addOnTotal = addOnItems.reduce((sum, item) => sum + item.amount, 0);
  const total = basePrice + addOnTotal;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Price Estimate</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
          <span>Venue (full day)</span>
          <span>{formatPrice(basePrice)}</span>
        </div>

        {addOnItems.map((item) => (
          <div key={item.label} className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
            <span>{item.label}</span>
            <span>{formatPrice(item.amount)}</span>
          </div>
        ))}

        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-white font-semibold">
          <span>Total</span>
          <span className="text-om-orange text-lg">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
