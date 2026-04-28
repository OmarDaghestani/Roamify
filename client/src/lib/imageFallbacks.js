function seedFrom(value, fallback = "roamify") {
  const raw = String(value ?? "").trim();
  return raw || fallback;
}

export function tripImageFallback(seed) {
  const safeSeed = encodeURIComponent(seedFrom(seed, "trip"));
  return `https://picsum.photos/seed/roamify-trip-${safeSeed}/900/600`;
}

export function heroImageFallback() {
  return "https://picsum.photos/seed/roamify-hero/2000/1200";
}
