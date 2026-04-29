/**
 * Smart Order Parser
 * Extracts Name, Phone, Address, and Items from unstructured text.
 * Uses the Product Catalog for high-accuracy item matching.
 */

export function parseOrderText(text, catalog = []) {
  const result = {
    custName: '',
    custPhone: '',
    deliveryAddr: '',
    items: [],
    confidence: {
      name: false,
      phone: false,
      address: false,
      items: false
    }
  };

  if (!text) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const lowercaseText = text.toLowerCase();

  // 1. ── PHONE EXTRACTION ──────────────────────────────────────────────────
  // Matches Nigerian formats: +234..., 080..., 090..., 070... 
  const phoneRegex = /(?:\+234|0)[789][01]\d{8}/g; 
  const phoneMatches = text.replace(/[\s-]/g, '').match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    result.custPhone = phoneMatches[0];
    result.confidence.phone = true;
  }

  // 2. ── ADDRESS EXTRACTION ────────────────────────────────────────────────
  const addressKeywords = ['address:', 'deliver to:', 'delivery to:', 'delivering to:', 'location:', 'shipping to:'];
  for (const kw of addressKeywords) {
    if (lowercaseText.includes(kw)) {
      const parts = lowercaseText.split(kw);
      if (parts.length > 1) {
        // Take the line containing the keyword or until the next major punctuation
        const afterKw = parts[1].split('\n')[0].trim();
        if (afterKw) {
          result.deliveryAddr = afterKw.charAt(0).toUpperCase() + afterKw.slice(1);
          result.confidence.address = true;
          break;
        }
      }
    }
  }
  // Fallback: search for "Lekki", "Ikeja", "Victoria Island", "Abuja", "No." patterns
  if (!result.deliveryAddr) {
    const locRegex = /(?:No\.?\s?\d+|Lekki|Ikeja|Surulere|Victoria Island|Maitama|Wuse|Garki|Ajah)/i;
    const match = text.match(locRegex);
    if (match) {
      const line = lines.find(l => l.includes(match[0]));
      if (line && line.length < 100) {
        result.deliveryAddr = line;
        result.confidence.address = true;
      }
    }
  }

  // 3. ── NAME EXTRACTION ───────────────────────────────────────────────────
  const nameKeywords = ['name:', 'customer:', 'client:', "i'm", "i am"];
  for (const kw of nameKeywords) {
    if (lowercaseText.includes(kw)) {
      const parts = lowercaseText.split(kw);
      if (parts.length > 1) {
        const afterKw = parts[1].split(/[\n,]/)[0].trim();
        if (afterKw && afterKw.length < 30) {
          result.custName = afterKw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          result.confidence.name = true;
          break;
        }
      }
    }
  }
  // Fallback: If no name found, look at the first line if it's short and contains no numbers
  if (!result.custName && lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 25 && !/\d/.test(firstLine) && !firstLine.toLowerCase().includes('order')) {
      result.custName = firstLine;
      result.confidence.name = true;
    }
  }

  // 4. ── ITEM EXTRACTION (Catalog Matching) ────────────────────────────────
  if (catalog && catalog.length > 0) {
    const detectedItems = [];
    
    catalog.forEach(product => {
      const productName = product.name.toLowerCase();
      // Look for the product name in the text
      if (lowercaseText.includes(productName)) {
        // Found a match! Now search for quantity near it
        let qty = 1;
        
        // Strategy A: Search the exact line for patterns like "Item x 2" or "2 Item"
        const line = lines.find(l => l.toLowerCase().includes(productName)) || '';
        const qtyMatch = line.match(/(\d+)\s*(?:x|pcs|qty|quantity)?/i) || line.match(/(?:x|pcs|qty|quantity)\s*(\d+)/i);
        
        if (qtyMatch) {
          qty = parseInt(qtyMatch[1] || qtyMatch[0].replace(/\D/g, '')) || 1;
        }

        detectedItems.push({
          id: Date.now() + Math.random(),
          desc: product.name,
          qty: qty,
          price: product.price
        });
      }
    });

    if (detectedItems.length > 0) {
      result.items = detectedItems;
      result.confidence.items = true;
    }
  }

  return result;
}
