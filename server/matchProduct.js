/**
 * Match spoken / typed item name to a product from DB (simple substring / token overlap).
 */
const WORD_ALIASES = new Map([
  ["आटा", "aata"],
  ["चीनी", "chini"],
  ["चावल", "chawal"],
  ["तेल", "tel"],
  ["नमक", "namak"],
  ["दाल", "dal"],
  ["मसूर", "masoor"],
  ["साबुन", "sabun"],
  ["किलो", ""],
  ["ग्राम", ""],
  ["लीटर", ""],
  ["पीस", ""],
  ["नग", ""],
]);

function normalizeName(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (WORD_ALIASES.has(w) ? WORD_ALIASES.get(w) : w))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export function findBestProduct(products, rawName) {
  const q = normalizeName(rawName);
  if (!q) return null;

  let best = null;
  let bestScore = 0;

  for (const p of products) {
    const n = normalizeName(p.name);
    let score = 0;
    if (n === q) score = 100;
    else if (n.includes(q) || q.includes(n)) score = 80;
    else {
      const qt = new Set(tokens(q));
      const nt = new Set(tokens(n));
      let overlap = 0;
      for (const t of qt) {
        if (nt.has(t)) overlap++;
      }
      score = overlap * 15;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return bestScore >= 15 ? best : null;
}
