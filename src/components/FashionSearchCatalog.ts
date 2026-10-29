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
  // --- BOTTOMS: JEANS, BOOTCUT, CHINOS, TROUSERS ---
  {
    id: "bottom-bootcut-1",
    title: "Classic Vintage Wash Bootcut Jeans",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Medium Blue",
    style: "Vintage Casual",
    imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=mens%20bootcut%20jeans%20outfit",
    tags: ["bootcut", "jeans", "bootcut jeans", "denim", "blue", "medium blue", "vintage", "relaxed"],
  },
  {
    id: "bottom-bootcut-2",
    title: "Raw Indigo Heritage Bootcut Denim",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Dark Indigo",
    style: "Classic",
    imageUrl: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=mens%20dark%20indigo%20bootcut%20denim",
    tags: ["bootcut", "bootcut jeans", "raw denim", "indigo", "dark blue", "jeans", "classic"],
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
    tags: ["bootcut", "flared", "bootcut jeans", "light blue", "light wash", "jeans", "denim", "90s"],
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
    tags: ["bootcut", "black", "bootcut jeans", "black jeans", "denim", "streetwear", "minimalist"],
  },
  {
    id: "bottom-1",
    title: "Slim-Straight Selvedge Raw Denim Jeans",
    category: "bottoms",
    subCategory: "Jeans",
    color: "Dark Indigo",
    style: "Classic",
    imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=raw%20selvedge%20denim%20jeans",
    tags: ["indigo", "blue", "jeans", "denim", "selvedge", "straight", "raw denim"],
  },
  {
    id: "bottom-2",
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
    id: "bottom-3",
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
    id: "bottom-4",
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
    id: "bottom-5",
    title: "Tailored Wool Blend Dress Pants in Jet Black",
    category: "bottoms",
    subCategory: "Dress Pants",
    color: "Black",
    style: "Formal / Evening",
    imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20tailored%20dress%20trousers",
    tags: ["black", "dress pants", "trousers", "formal", "tailored", "slacks", "pants"],
  },

  // --- TOPS: SHIRTS, TEES, SWEATERS, JACKETS ---
  {
    id: "top-1",
    title: "Crisp Oxford Cotton Button-Down Shirt",
    category: "tops",
    subCategory: "Shirt",
    color: "White",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=white%20oxford%20shirt%20mens",
    tags: ["white", "oxford", "shirt", "smart casual", "button down", "classic", "formal"],
  },
  {
    id: "top-2",
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
    id: "top-3",
    title: "Textured Cable-Knit Crewneck Sweater",
    category: "tops",
    subCategory: "Sweater",
    color: "Cream / Beige",
    style: "Casual",
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=cream%20cable%20knit%20sweater",
    tags: ["cream", "beige", "sweater", "knit", "knitwear", "casual", "cozy"],
  },
  {
    id: "top-4",
    title: "Navy Blue Knitted Pique Polo Shirt",
    category: "tops",
    subCategory: "Polo",
    color: "Navy",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=navy%20blue%20polo%20shirt",
    tags: ["navy", "blue", "polo", "polo shirt", "smart casual", "collar", "shirt"],
  },
  {
    id: "top-5",
    title: "Sage Green Relaxed Linen Camp Collar Shirt",
    category: "tops",
    subCategory: "Shirt",
    color: "Green",
    style: "Summer Casual",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=linen%20camp%20collar%20shirt",
    tags: ["green", "sage", "linen", "summer", "camp collar", "shirt", "linen shirt"],
  },
  {
    id: "top-6",
    title: "Vintage Washed Denim Trucker Jacket",
    category: "tops",
    subCategory: "Jacket",
    color: "Light Blue",
    style: "Classic",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=denim%20trucker%20jacket%20outfit",
    tags: ["blue", "denim", "jacket", "trucker", "vintage", "outerwear"],
  },

  // --- SOLES / FOOTWEAR ---
  {
    id: "sole-1",
    title: "Classic Clean Leather Low-Top White Sneakers",
    category: "soles",
    subCategory: "Sneakers",
    color: "White",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=clean%20white%20leather%20sneakers%20outfit",
    tags: ["white", "sneakers", "leather", "minimalist", "low top", "casual", "shoes", "kicks"],
  },
  {
    id: "sole-2",
    title: "Handcrafted Suede Penny Loafers in Dark Brown",
    category: "soles",
    subCategory: "Loafers",
    color: "Brown",
    style: "Smart Casual",
    imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=brown%20suede%20penny%20loafers",
    tags: ["brown", "suede", "loafers", "penny loafers", "smart casual", "shoes", "formal"],
  },
  {
    id: "sole-3",
    title: "Heritage Leather Chelsea Boots in Black",
    category: "soles",
    subCategory: "Boots",
    color: "Black",
    style: "Classic",
    imageUrl: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=black%20chelsea%20boots%20outfit",
    tags: ["black", "boots", "chelsea boots", "leather", "autumn", "winter", "shoes"],
  },
  {
    id: "sole-4",
    title: "Retro Runner Sport Sneakers in Grey & Cream",
    category: "soles",
    subCategory: "Sneakers",
    color: "Grey / Cream",
    style: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=retro%20runner%20sneakers%20streetwear",
    tags: ["grey", "cream", "sneakers", "runner", "retro", "streetwear", "shoes"],
  },
  {
    id: "sole-5",
    title: "Double Buckle Suede Arizona Footbed Sandals",
    category: "soles",
    subCategory: "Sandals",
    color: "Taupe / Tan",
    style: "Summer Casual",
    imageUrl: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=suede%20footbed%20sandals%20outfit",
    tags: ["tan", "taupe", "sandals", "suede", "summer", "casual", "slides"],
  },
  {
    id: "sole-6",
    title: "Burnished Leather Oxford Dress Shoes",
    category: "soles",
    subCategory: "Dress Shoes",
    color: "Burgundy / Oxblood",
    style: "Formal",
    imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=700&q=80",
    sourceUrl: "https://www.google.com/search?tbm=isch&q=oxblood%20leather%20dress%20shoes",
    tags: ["burgundy", "oxblood", "dress shoes", "oxford", "leather", "formal", "shoes"],
  },
];

export function searchLocalFashionCatalog(
  rawQuery: string,
  categoryFilter?: "all" | "tops" | "bottoms" | "soles"
): CatalogItem[] {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);

  const matched = FASHION_CATALOG.filter((item) => {
    if (categoryFilter && categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }
    const text = `${item.title} ${item.subCategory} ${item.color} ${item.style} ${item.tags.join(" ")}`.toLowerCase();
    if (text.includes(q)) return true;
    return words.some((w) => text.includes(w));
  });

  if (matched.length > 0) {
    return matched.sort((a, b) => {
      const textA = `${a.title} ${a.subCategory} ${a.color} ${a.tags.join(" ")}`.toLowerCase();
      const textB = `${b.title} ${b.subCategory} ${b.color} ${b.tags.join(" ")}`.toLowerCase();
      const countA = words.filter((w) => textA.includes(w)).length;
      const countB = words.filter((w) => textB.includes(w)).length;
      return countB - countA;
    });
  }

  // Graceful category fallback if query didn't match exact keywords
  let targetCat: "tops" | "bottoms" | "soles" = "tops";
  if (categoryFilter && categoryFilter !== "all") {
    targetCat = categoryFilter;
  } else if (/pants|jeans|trouser|chino|short|cargo|jogger|bottom|bootcut|flared|denim/i.test(q)) {
    targetCat = "bottoms";
  } else if (/shoe|sneaker|boot|loafer|sandal|slide|oxford|footwear|sole|kicks/i.test(q)) {
    targetCat = "soles";
  }

  return FASHION_CATALOG.filter((item) => item.category === targetCat).slice(0, 6);
}
