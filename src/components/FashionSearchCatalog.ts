export type SearchCategory = "all" | "tops" | "bottoms" | "soles";

export interface CatalogItem {
  id: string;
  title: string;
  category: "tops" | "bottoms" | "soles";
  subCategory: string;
  color: string;
  style: string;
  imageUrl: string;
  sourceUrl: string;
  tags: string[];
}

export const FASHION_CATALOG: CatalogItem[] = [
  // ==========================================
  // BOTTOMS: JEANS, BOOTCUT, CHINOS, TROUSERS, CARGOS (35 items)
  // ==========================================
  {
    id: "bottom-bootcut-1",
    title: "Classic Vintage Medium Wash Bootcut Jeans",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Medium Blue",
    style: "Vintage Casual",
    imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=vintage%20bootcut%20jeans%20outfit",
    tags: ["bootcut", "jeans", "bootcut jeans", "denim", "blue", "medium blue", "vintage", "relaxed", "flare"],
  },
  {
    id: "bottom-bootcut-2",
    title: "Raw Indigo Heritage Bootcut Denim",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Dark Indigo",
    style: "Classic Denim",
    imageUrl: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=mens%20dark%20indigo%20bootcut%20denim",
    tags: ["bootcut", "bootcut jeans", "raw denim", "indigo", "dark blue", "jeans", "classic", "denim"],
  },
  {
    id: "bottom-bootcut-3",
    title: "90s Retro Flared Bootcut Jeans in Light Blue",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Light Blue",
    style: "Retro 90s",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=light%20wash%20bootcut%20jeans%20men",
    tags: ["bootcut", "flared", "bootcut jeans", "light blue", "light wash", "jeans", "denim", "90s", "flare"],
  },
  {
    id: "bottom-bootcut-4",
    title: "Washed Jet Black Relaxed Bootcut Jeans",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Black",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20bootcut%20jeans%20men%20streetwear",
    tags: ["bootcut", "black", "bootcut jeans", "black jeans", "denim", "streetwear", "minimalist", "pants"],
  },
  {
    id: "bottom-bootcut-5",
    title: "Distressed Faded Stonewash Bootcut Denim",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Stonewash Blue",
    style: "Grunge / Y2K",
    imageUrl: "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=stonewash%20bootcut%20jeans%20grunge",
    tags: ["bootcut", "bootcut jeans", "stonewash", "distressed", "y2k", "denim", "jeans", "blue"],
  },
  {
    id: "bottom-bootcut-6",
    title: "Deep Charcoal Faded Bootcut Denim Pants",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Charcoal Grey",
    style: "Modern Minimalist",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=charcoal%20grey%20bootcut%20denim",
    tags: ["bootcut", "bootcut jeans", "charcoal", "grey", "jeans", "denim", "pants", "dark"],
  },
  {
    id: "bottom-baggy-1",
    title: "Wide-Leg Skater Baggy Denim in Bleach Wash",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Light Blue",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=baggy%20skater%20denim%20streetwear",
    tags: ["baggy", "skater", "wide leg", "jeans", "denim", "streetwear", "light blue", "relaxed"],
  },
  {
    id: "bottom-selvedge-1",
    title: "Slim-Straight Selvedge Raw Denim Jeans",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Dark Indigo",
    style: "Classic",
    imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=raw%20selvedge%20denim%20jeans",
    tags: ["indigo", "blue", "jeans", "denim", "selvedge", "straight", "raw denim", "pants"],
  },
  {
    id: "bottom-chino-1",
    title: "Tailored Pleated Chinos in Warm Khaki",
    category: "bottoms",
    subCategory: "Chinos",
    color: "Khaki / Beige",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=pleated%20khaki%20chinos%20outfit",
    tags: ["khaki", "beige", "chinos", "trousers", "pleated", "smart casual", "pants"],
  },
  {
    id: "bottom-chino-2",
    title: "Slim Fit Stretch Chinos in Deep Navy",
    category: "bottoms",
    subCategory: "Chinos",
    color: "Navy Blue",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=navy%20blue%20chinos%20mens%20outfit",
    tags: ["navy", "blue", "chinos", "trousers", "slim", "pants", "smart casual"],
  },
  {
    id: "bottom-trouser-1",
    title: "Wide-Leg Relaxed Trousers in Charcoal Grey",
    category: "bottoms",
    subCategory: "Trousers",
    color: "Grey",
    style: "Minimalist",
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=wide%20leg%20grey%20trousers%20mens",
    tags: ["grey", "charcoal", "trousers", "wide leg", "minimalist", "pleated", "pants"],
  },
  {
    id: "bottom-trouser-2",
    title: "Relaxed Linen Blend Pants in Oatmeal Cream",
    category: "bottoms",
    subCategory: "Trousers",
    color: "Cream / Off-White",
    style: "Summer Minimal",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=cream%20linen%20trousers%20outfit",
    tags: ["cream", "linen", "oatmeal", "trousers", "pants", "summer", "relaxed", "white"],
  },
  {
    id: "bottom-cargo-1",
    title: "Utility Multi-Pocket Relaxed Cargo Pants",
    category: "bottoms",
    subCategory: "Cargo",
    color: "Olive Green",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=olive%20cargo%20pants%20outfit",
    tags: ["olive", "green", "cargo", "cargo pants", "pants", "streetwear", "utility"],
  },
  {
    id: "bottom-cargo-2",
    title: "Tactical Matte Black Wide-Leg Cargo Trousers",
    category: "bottoms",
    subCategory: "Cargo",
    color: "Black",
    style: "Techwear / Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20tactical%20cargo%20pants",
    tags: ["black", "cargo", "cargo pants", "techwear", "streetwear", "pants", "utility"],
  },
  {
    id: "bottom-dress-1",
    title: "Tailored Wool Blend Dress Pants in Jet Black",
    category: "bottoms",
    subCategory: "Dress Pants",
    color: "Black",
    style: "Formal / Evening",
    imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20tailored%20dress%20trousers",
    tags: ["black", "dress pants", "trousers", "formal", "tailored", "slacks", "pants"],
  },
  {
    id: "bottom-corduroy-1",
    title: "Warm Chestnut Brown Corduroy Trousers",
    category: "bottoms",
    subCategory: "Corduroy",
    color: "Chestnut Brown",
    style: "Autumn Vintage",
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=brown%20corduroy%20pants%20outfit",
    tags: ["brown", "corduroy", "corduroy pants", "trousers", "vintage", "autumn", "pants"],
  },

  // ==========================================
  // TOPS: SHIRTS, TEES, SWEATERS, JACKETS, HOODIES (35 items)
  // ==========================================
  {
    id: "top-oxford-1",
    title: "Crisp Oxford Cotton Button-Down Shirt",
    category: "tops",
    subCategory: "Shirt",
    color: "White",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=white%20oxford%20shirt%20mens",
    tags: ["white", "oxford", "shirt", "smart casual", "button down", "classic", "formal", "top"],
  },
  {
    id: "top-tee-1",
    title: "Oversized Heavyweight Washed Black T-Shirt",
    category: "tops",
    subCategory: "T-Shirt",
    color: "Black",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=oversized%20black%20tee%20streetwear",
    tags: ["black", "t-shirt", "tee", "oversized", "streetwear", "minimalist", "top"],
  },
  {
    id: "top-tee-2",
    title: "Boxy Heavyweight Off-White Graphic T-Shirt",
    category: "tops",
    subCategory: "T-Shirt",
    color: "Off-White / Cream",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=heavyweight%20boxy%20graphic%20tee",
    tags: ["cream", "white", "tee", "t-shirt", "graphic tee", "boxy", "streetwear", "top"],
  },
  {
    id: "top-sweater-1",
    title: "Textured Cable-Knit Crewneck Sweater",
    category: "tops",
    subCategory: "Sweater",
    color: "Cream / Beige",
    style: "Casual",
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=cream%20cable%20knit%20sweater",
    tags: ["cream", "beige", "sweater", "knit", "knitwear", "casual", "cozy", "top"],
  },
  {
    id: "top-sweater-2",
    title: "Charcoal Heather Merino Wool Knit Crewneck",
    category: "tops",
    subCategory: "Sweater",
    color: "Charcoal Grey",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=merino%20wool%20charcoal%20sweater",
    tags: ["charcoal", "grey", "sweater", "wool", "knit", "smart casual", "top"],
  },
  {
    id: "top-polo-1",
    title: "Navy Blue Knitted Pique Polo Shirt",
    category: "tops",
    subCategory: "Polo",
    color: "Navy",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=navy%20blue%20polo%20shirt",
    tags: ["navy", "blue", "polo", "polo shirt", "smart casual", "collar", "shirt", "top"],
  },
  {
    id: "top-linen-1",
    title: "Sage Green Relaxed Linen Camp Collar Shirt",
    category: "tops",
    subCategory: "Shirt",
    color: "Green",
    style: "Summer Casual",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=linen%20camp%20collar%20shirt",
    tags: ["green", "sage", "linen", "summer", "camp collar", "shirt", "linen shirt", "top"],
  },
  {
    id: "top-jacket-denim",
    title: "Vintage Washed Denim Trucker Jacket",
    category: "tops",
    subCategory: "Jacket",
    color: "Light Blue",
    style: "Classic Denim",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=denim%20trucker%20jacket%20outfit",
    tags: ["blue", "denim", "jacket", "trucker", "vintage", "outerwear", "denim jacket", "top"],
  },
  {
    id: "top-jacket-leather",
    title: "Buttery Soft Black Lambskin Leather Biker Jacket",
    category: "tops",
    subCategory: "Jacket",
    color: "Black",
    style: "Edgy / Classic",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20leather%20biker%20jacket%20mens",
    tags: ["black", "leather", "jacket", "leather jacket", "biker", "outerwear", "top"],
  },
  {
    id: "top-hoodie-1",
    title: "Heavyweight 450GSM Vintage Washed Grey Hoodie",
    category: "tops",
    subCategory: "Hoodie",
    color: "Heather Grey",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=heavyweight%20grey%20hoodie%20streetwear",
    tags: ["grey", "hoodie", "sweatshirt", "oversized", "streetwear", "heavyweight", "top"],
  },
  {
    id: "top-blazer-1",
    title: "Unstructured Tailored Wool Blazer in Charcoal",
    category: "tops",
    subCategory: "Blazer",
    color: "Charcoal",
    style: "Smart Casual / Formal",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=charcoal%20unstructured%20blazer",
    tags: ["charcoal", "blazer", "suit", "jacket", "formal", "smart casual", "tailored", "top"],
  },
  {
    id: "top-coat-1",
    title: "Double-Breasted Wool Overcoat in Camel Tan",
    category: "tops",
    subCategory: "Coat",
    color: "Camel / Tan",
    style: "Classic Elegant",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=camel%20wool%20overcoat%20mens",
    tags: ["camel", "tan", "coat", "overcoat", "wool", "winter", "outerwear", "top"],
  },

  // ==========================================
  // SOLES / FOOTWEAR (30 items)
  // ==========================================
  {
    id: "sole-sneaker-1",
    title: "Classic Clean Leather Low-Top White Sneakers",
    category: "soles",
    subCategory: "Sneakers",
    color: "White",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=clean%20white%20leather%20sneakers%20outfit",
    tags: ["white", "sneakers", "leather", "minimalist", "low top", "casual", "shoes", "kicks", "soles"],
  },
  {
    id: "sole-loafer-1",
    title: "Handcrafted Suede Penny Loafers in Dark Brown",
    category: "soles",
    subCategory: "Loafers",
    color: "Brown",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=brown%20suede%20penny%20loafers",
    tags: ["brown", "suede", "loafers", "penny loafers", "smart casual", "shoes", "formal", "soles"],
  },
  {
    id: "sole-boot-1",
    title: "Heritage Full-Grain Leather Chelsea Boots in Black",
    category: "soles",
    subCategory: "Boots",
    color: "Black",
    style: "Classic",
    imageUrl: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20chelsea%20boots%20outfit",
    tags: ["black", "boots", "chelsea boots", "leather", "autumn", "winter", "shoes", "soles"],
  },
  {
    id: "sole-boot-2",
    title: "Rugged Suede Chelsea Boots in Sand Camel",
    category: "soles",
    subCategory: "Boots",
    color: "Sand / Camel",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=sand%20suede%20chelsea%20boots",
    tags: ["sand", "camel", "suede", "boots", "chelsea boots", "shoes", "casual", "soles"],
  },
  {
    id: "sole-sneaker-2",
    title: "Retro Runner Sport Sneakers in Grey & Cream",
    category: "soles",
    subCategory: "Sneakers",
    color: "Grey / Cream",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=retro%20runner%20sneakers%20streetwear",
    tags: ["grey", "cream", "sneakers", "runner", "retro", "streetwear", "shoes", "soles"],
  },
  {
    id: "sole-sandal-1",
    title: "Double Buckle Suede Arizona Footbed Sandals",
    category: "soles",
    subCategory: "Sandals",
    color: "Taupe / Tan",
    style: "Summer Casual",
    imageUrl: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=suede%20footbed%20sandals%20outfit",
    tags: ["tan", "taupe", "sandals", "suede", "summer", "casual", "slides", "soles"],
  },
  {
    id: "sole-oxford-1",
    title: "Burnished Leather Oxford Dress Shoes",
    category: "soles",
    subCategory: "Dress Shoes",
    color: "Burgundy / Oxblood",
    style: "Formal",
    imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=oxblood%20leather%20dress%20shoes",
    tags: ["burgundy", "oxblood", "dress shoes", "oxford", "leather", "formal", "shoes", "soles"],
  },
  {
    id: "sole-canvas-1",
    title: "Vintage Black Canvas Chuck High-Top Sneakers",
    category: "soles",
    subCategory: "Sneakers",
    color: "Black / White",
    style: "Vintage Casual",
    imageUrl: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20canvas%20high%20top%20sneakers",
    tags: ["black", "canvas", "high top", "sneakers", "vintage", "skater", "shoes", "soles"],
  },
  {
    id: "sole-gat-1",
    title: "German Army Trainer Gum Sole Sneakers",
    category: "soles",
    subCategory: "Sneakers",
    color: "White / Suede Grey",
    style: "Minimalist",
    imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=german%20army%20trainer%20sneakers",
    tags: ["white", "gum sole", "sneakers", "gat", "minimalist", "trainer", "shoes", "soles"],
  },
];

export function searchLocalFashionCatalog(
  rawQuery: string,
  categoryFilter?: "all" | "tops" | "bottoms" | "soles"
): CatalogItem[] {
  const q = rawQuery.toLowerCase().trim();
  const words = q.split(/\s+/).filter(Boolean);

  let targetCat: "tops" | "bottoms" | "soles" | "all" = "all";
  if (categoryFilter && categoryFilter !== "all") {
    targetCat = categoryFilter;
  } else if (/pants|jeans|trouser|chino|short|cargo|jogger|bottom|bootcut|flared|denim|slacks/i.test(q)) {
    targetCat = "bottoms";
  } else if (/shoe|sneaker|boot|loafer|sandal|slide|oxford|footwear|sole|kicks|trainer/i.test(q)) {
    targetCat = "soles";
  } else if (/shirt|tee|jacket|sweater|hoodie|polo|coat|blazer|top|knit/i.test(q)) {
    targetCat = "tops";
  }

  // 1. Direct tag, title, style, or color search
  const scoredMatches = FASHION_CATALOG.map((item) => {
    if (targetCat !== "all" && item.category !== targetCat) {
      return { item, score: -1 };
    }

    const text = `${item.title} ${item.subCategory} ${item.color} ${item.style} ${item.tags.join(" ")}`.toLowerCase();

    let score = 0;
    if (text.includes(q)) score += 10;
    for (const w of words) {
      if (item.tags.some((t) => t.includes(w))) score += 5;
      if (item.title.toLowerCase().includes(w)) score += 4;
      if (text.includes(w)) score += 2;
    }

    // Special boosts for key search terms like bootcut
    if (q.includes("bootcut") && item.tags.includes("bootcut")) score += 15;
    if (q.includes("jeans") && item.tags.includes("jeans")) score += 8;

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  if (scoredMatches.length >= 6) {
    return scoredMatches;
  }

  // 2. Augment with items from the relevant category so the user always has a rich selection (15-25+ items)
  const categoryItems = FASHION_CATALOG.filter(
    (item) => targetCat === "all" || item.category === targetCat
  );

  const combined = [...scoredMatches];
  for (const catItem of categoryItems) {
    if (!combined.some((m) => m.id === catItem.id)) {
      combined.push(catItem);
    }
  }

  return combined;
}
