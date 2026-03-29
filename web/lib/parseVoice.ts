export type ParsedLine = {
  itemName: string;
  quantity: number;
  unit: string;
};

/**
 * Simple parser for phrases like "2 kilo chini", "chini 2 kg", "aata 5".
 */
export function parseVoiceLine(text: string): ParsedLine | null {
  const t = text.trim();
  if (!t) return null;

  const numMatch = t.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return null;
  const quantity = parseFloat(numMatch[1]);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  let unit = "kg";
  const lower = t.toLowerCase();
  const attachedUnit = lower.match(
    /(\d+(?:\.\d+)?)\s*(kilo|kg|kilogram|किलो|gram|gm|g|ग्राम|liter|litre|ltr|लीटर|pcs|piece|pieces|पीस|नग)\b/i
  );
  const explicitUnit = attachedUnit?.[2] || "";
  if (/(kilo|kg|kilogram|किलो)/i.test(explicitUnit) || /(^|[\s,.-])(kilo|kg|kilogram|किलो)(?=$|[\s,.-])/i.test(lower))
    unit = "kg";
  else if (/(gram|gm|g|ग्राम)/i.test(explicitUnit) || /(^|[\s,.-])(gram|gm|g|ग्राम)(?=$|[\s,.-])/i.test(lower))
    unit = "g";
  else if (/(liter|litre|ltr|लीटर)/i.test(explicitUnit) || /(^|[\s,.-])(liter|litre|ltr|लीटर)(?=$|[\s,.-])/i.test(lower))
    unit = "liter";
  else if (/(pcs|piece|pieces|पीस|नग)/i.test(explicitUnit) || /(^|[\s,.-])(pcs|piece|pieces|पीस|नग)(?=$|[\s,.-])/i.test(lower))
    unit = "pcs";

  let itemName = t
    .replace(numMatch[0], " ")
    .replace(
      /(^|[\s,.-])(kilo|kg|kilogram|किलो|gram|gm|g|ग्राम|liter|litre|ltr|लीटर|pcs|piece|pieces|पीस|नग)(?=$|[\s,.-])/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!itemName) {
    const parts = t.split(/\d+(?:\.\d+)?/);
    itemName = (parts[0] || parts[1] || "")
      .replace(
        /(^|[\s,.-])(kilo|kg|kilogram|किलो|gram|gm|g|ग्राम|liter|litre|ltr|लीटर|pcs|piece|pieces|पीस|नग)(?=$|[\s,.-])/gi,
        " "
      )
      .trim();
  }

  if (!itemName) return null;
  return { itemName, quantity, unit };
}
