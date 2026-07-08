import { normalizeProductId } from "./product-id";

export interface SampleReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

const DEFAULT_REVIEWS: SampleReview[] = [
  {
    id: "default-1",
    author: "Priya M.",
    rating: 5,
    date: "March 2026",
    title: "Absolutely stunning craftsmanship",
    body: "The quality exceeded my expectations. Every stitch is perfect and the bag gets compliments everywhere I go.",
    verified: true,
  },
  {
    id: "default-2",
    author: "Ananya R.",
    rating: 5,
    date: "February 2026",
    title: "Worth every rupee",
    body: "Beautiful handmade piece. The photos don't do justice — it's even prettier in person. Fast delivery too!",
    verified: true,
  },
  {
    id: "default-3",
    author: "Sarah K.",
    rating: 4,
    date: "January 2026",
    title: "Lovely bag, unique design",
    body: "Such a unique piece. Slightly smaller than I imagined but perfect for evenings out. Would buy again.",
    verified: true,
  },
];

const PRODUCT_SAMPLE_REVIEWS: Record<string, SampleReview[]> = {
  hb1: [
    {
      id: "b9-1",
      author: "Meera S.",
      rating: 5,
      date: "March 2026",
      title: "Perfect everyday top-handle",
      body: "The structured shape holds up beautifully. I carry it to work and brunch — the natural tone goes with everything.",
      verified: true,
    },
    {
      id: "b9-2",
      author: "Divya K.",
      rating: 5,
      date: "February 2026",
      title: "Boutique feel, handmade soul",
      body: "You can tell this was made with care. The top handle is sturdy and the crochet texture feels premium, not flimsy.",
      verified: true,
    },
    {
      id: "b9-3",
      author: "Rhea P.",
      rating: 4,
      date: "January 2026",
      title: "Elegant and compact",
      body: "Fits phone, wallet, and keys comfortably. A little snug for larger items, but that's exactly what I wanted.",
      verified: true,
    },
  ],
  mb1: [
    {
      id: "b1-1",
      author: "Priya M.",
      rating: 5,
      date: "March 2026",
      title: "The stripes are so fun!",
      body: "The bee-stripe pattern is even cuter in person. The chain strap sits nicely on the shoulder — I get stopped every time I wear it.",
      verified: true,
    },
    {
      id: "b1-2",
      author: "Kavya N.",
      rating: 5,
      date: "February 2026",
      title: "Statement mini bag",
      body: "Bold yellow and black without being loud. Perfect size for evenings out when I only need essentials.",
      verified: true,
    },
    {
      id: "b1-3",
      author: "Ishita L.",
      rating: 4,
      date: "December 2025",
      title: "Cheerful and well-made",
      body: "Chunky yarn gives it a lovely texture. Arrived quickly and the stitching is neat throughout.",
      verified: true,
    },
  ],
  mb2: [
    {
      id: "b2-1",
      author: "Ananya R.",
      rating: 5,
      date: "March 2026",
      title: "My go-to blue mini",
      body: "Classic colour, soft crochet feel. Pairs with jeans or a dress — I've used it almost daily for a month.",
      verified: true,
    },
    {
      id: "b2-2",
      author: "Sneha V.",
      rating: 5,
      date: "February 2026",
      title: "Timeless and versatile",
      body: "The blue shade is rich without being too dark. Holds my phone, lip balm, and cards with room to spare.",
      verified: true,
    },
    {
      id: "b2-3",
      author: "Nisha T.",
      rating: 4,
      date: "January 2026",
      title: "Pretty artisan charm",
      body: "Slightly smaller than expected but that's on me for not checking dimensions. Quality is excellent for the price.",
      verified: true,
    },
  ],
  ob1: [
    {
      id: "b5-1",
      author: "Aisha M.",
      rating: 5,
      date: "March 2026",
      title: "The swirl pattern is iconic",
      body: "Black-and-white contrast looks so modern. The Oreo swirl is hypnotic — friends always ask where I got it.",
      verified: true,
    },
    {
      id: "b5-2",
      author: "Tanvi G.",
      rating: 5,
      date: "February 2026",
      title: "Signature Zrochet energy",
      body: "Structured enough for day wear, edgy enough for nights out. The video on the product page sold me and it didn't disappoint.",
      verified: true,
    },
    {
      id: "b5-3",
      author: "Pooja H.",
      rating: 4,
      date: "January 2026",
      title: "Bold and well-crafted",
      body: "Stitch work is immaculate. White sections need a little care but that's expected with crochet — still love it.",
      verified: true,
    },
  ],
  ob2: [
    {
      id: "b6-1",
      author: "Lakshmi R.",
      rating: 5,
      date: "March 2026",
      title: "Refined Oreo classic",
      body: "Charcoal and cream feels more understated than the swirl version. Perfect for office and weekend alike.",
      verified: true,
    },
    {
      id: "b6-2",
      author: "Aditi C.",
      rating: 5,
      date: "February 2026",
      title: "Structured and versatile",
      body: "Holds its shape well and the neutral tones match most of my wardrobe. True Zrochet quality.",
      verified: true,
    },
    {
      id: "b6-3",
      author: "Shruti B.",
      rating: 4,
      date: "December 2025",
      title: "Elegant signature piece",
      body: "Slightly roomier than the mini bags. Cream sections are soft and the charcoal gives it a luxe edge.",
      verified: true,
    },
  ],
  pb1: [
    {
      id: "b3-1",
      author: "Neha W.",
      rating: 5,
      date: "March 2026",
      title: "Wedding guest favourite",
      body: "Wore this to a reception and it elevated my whole outfit. The champagne tone catches light beautifully.",
      verified: true,
    },
    {
      id: "b3-2",
      author: "Ritika S.",
      rating: 5,
      date: "February 2026",
      title: "Soirée-ready glamour",
      body: "Structured silhouette fits phone, compact, and a small clutch of essentials. Felt special without being over the top.",
      verified: true,
    },
    {
      id: "b3-3",
      author: "Maya J.",
      rating: 4,
      date: "January 2026",
      title: "Evening bag done right",
      body: "Premium finish for a crochet bag. A touch dressier than my everyday pieces — exactly what I needed.",
      verified: true,
    },
  ],
  pb2: [
    {
      id: "b4-1",
      author: "Sana F.",
      rating: 5,
      date: "March 2026",
      title: "Pearl white perfection",
      body: "Wore it to a dinner date and got so many compliments. The crochet detailing looks intricate up close.",
      verified: true,
    },
    {
      id: "b4-2",
      author: "Zara K.",
      rating: 5,
      date: "February 2026",
      title: "Bridal shower hit",
      body: "Gifted this to my sister for her shower — she loved it. Delicate white that still feels durable.",
      verified: true,
    },
    {
      id: "b4-3",
      author: "Emily D.",
      rating: 4,
      date: "January 2026",
      title: "Sophisticated party bag",
      body: "Pearl white is softer than stark white, which I prefer. Slightly compact but fits evening essentials.",
      verified: true,
    },
  ],
  sb1: [
    {
      id: "b7-1",
      author: "Arjun P.",
      rating: 5,
      date: "March 2026",
      title: "Hands-free and stylish",
      body: "Bought for my partner — the warm tan sling is perfect for market runs and coffee dates. Lightweight and secure.",
      verified: true,
    },
    {
      id: "b7-2",
      author: "Keerthi A.",
      rating: 5,
      date: "February 2026",
      title: "Urban chic everyday",
      body: "Crossbody sits flat and doesn't bounce. The relaxed crochet silhouette looks effortless with casual outfits.",
      verified: true,
    },
    {
      id: "b7-3",
      author: "Harsha M.",
      rating: 4,
      date: "January 2026",
      title: "Great street-style bag",
      body: "Tan colour pairs with denim and neutrals. Strap length works for my height — would love an adjustable option though.",
      verified: true,
    },
  ],
  sb2: [
    {
      id: "b8-1",
      author: "Diya S.",
      rating: 5,
      date: "March 2026",
      title: "Soft blush, hard to resist",
      body: "The blush tone is feminine without being too pink. Crossbody style keeps my hands free on busy days.",
      verified: true,
    },
    {
      id: "b8-2",
      author: "Freya L.",
      rating: 5,
      date: "February 2026",
      title: "Lightweight companion",
      body: "Barely feel it on my shoulder. Artisan texture adds character — doesn't look mass-produced at all.",
      verified: true,
    },
    {
      id: "b8-3",
      author: "Gayatri N.",
      rating: 4,
      date: "December 2025",
      title: "Pretty and practical",
      body: "Blush goes with more outfits than I expected. Slightly smaller interior but fine for phone and wallet.",
      verified: true,
    },
  ],
  TEST: [
    {
      id: "test-1",
      author: "Dev Tester",
      rating: 5,
      date: "March 2026",
      title: "Checkout test passed",
      body: "Used this ₹1 bag to verify the full payment flow — smooth experience from cart to UPI.",
      verified: true,
    },
  ],
  TEST2: [
    {
      id: "test2-1",
      author: "Dev Tester",
      rating: 5,
      date: "March 2026",
      title: "Blue variant works great",
      body: "Tested the blue colour option checkout — same smooth flow as the natural test bag.",
      verified: true,
    },
  ],
};

export function getSampleReviewsForProduct(productId: string): SampleReview[] {
  const key = normalizeProductId(productId);
  return PRODUCT_SAMPLE_REVIEWS[key] ?? DEFAULT_REVIEWS;
}

/** @deprecated Use getSampleReviewsForProduct instead */
export const SAMPLE_REVIEWS = DEFAULT_REVIEWS;
