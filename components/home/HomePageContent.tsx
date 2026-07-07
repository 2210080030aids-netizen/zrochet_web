import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  getCatalog,
  getCoverImage,
  getProduct,
  getSiteSettings,
} from "@/lib/catalog";

export default async function HomePageContent() {
  const [catalog, settings] = await Promise.all([getCatalog(), getSiteSettings()]);
  const products = catalog.products;
  const collectionCards = catalog.categories.map((category) => {
    const categoryProducts = products.filter((product) => product.category === category.slug);
    const featured = categoryProducts[0];

    return {
      slug: category.slug,
      title: category.name,
      price: featured?.price ?? category.defaultPrice ?? 500,
      image: featured ? getCoverImage(featured) : settings.heroImage,
    };
  });
  const heroProduct = (await getProduct("oreo-bags", "B5")) ?? products[0];

  return (
    <>
      <section id="home" className="bg-gradient-to-b from-beige to-cream pt-28 pb-16 lg:pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-brown">
              Artisan Made · One of a Kind
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-brown-dark sm:text-5xl lg:text-6xl">
              Handcrafted Crochet Creations
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-text-muted">
              Discover beautifully handmade crochet bags, purses, and thoughtful gifts —
              each piece woven with care, warmth, and timeless charm.
            </p>
            <Link
              href="#shop"
              className="mt-8 inline-flex rounded-full bg-brown-dark px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-brown"
            >
              Shop Now
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl luxury-shadow-lg">
            <Image
              src={settings.heroImage}
              alt="Zrochet handcrafted crochet bag"
              width={800}
              height={1000}
              className="aspect-[4/5] w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section id="collections" className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown">
              Browse by Style
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-brown-dark md:text-4xl">
              Our Collections
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5">
            {collectionCards.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl luxury-shadow transition duration-300 hover:-translate-y-1.5 hover:luxury-shadow-lg"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-brown-dark/70 to-transparent p-5 text-white">
                  <h3 className="font-display text-lg font-semibold md:text-xl">{item.title}</h3>
                  <p className="mt-1 text-sm font-medium text-gold">
                    ₹{item.price.toLocaleString("en-IN")}
                  </p>
                  <span className="mt-1 text-xs opacity-0 transition group-hover:opacity-100">
                    Shop now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="shop" className="bg-cream py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown">
              Curated for You
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-brown-dark md:text-4xl">
              Featured Products
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-muted">
              Each piece is lovingly crafted by hand — no two are ever exactly alike.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id + product.category} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-beige py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl luxury-shadow-md">
            <Image
              src={getCoverImage(heroProduct)}
              alt="Artisan crafting crochet by hand"
              width={700}
              height={525}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown">Our Story</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-brown-dark md:text-4xl">
              The Heart of Zrochet
            </h2>
            <p className="mt-4 leading-relaxed text-text-muted">
              Zrochet began with a simple belief: that everyday objects deserve the warmth of human
              hands. What started as a quiet hobby at the kitchen table has blossomed into a boutique
              studio dedicated to slow, intentional craftsmanship.
            </p>
            <p className="mt-4 leading-relaxed text-text-muted">
              Every stitch is placed with purpose. We source soft, premium yarns in earthy tones and
              transform them into bags, purses, and gifts that carry a piece of our story — and soon,
              a piece of yours.
            </p>
            <ul className="mt-6 space-y-2 text-sm font-medium text-text">
              <li>✦ 100% handmade, never mass-produced</li>
              <li>✦ Eco-conscious yarn &amp; packaging</li>
              <li>✦ Custom orders welcome</li>
            </ul>
            <Link
              href="#contact"
              className="mt-8 inline-flex rounded-full border border-brown-dark px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-brown-dark transition hover:bg-brown-dark hover:text-white"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown">Kind Words</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-brown-dark md:text-4xl">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "The tote bag I ordered is absolutely stunning. You can feel the love in every stitch.",
                name: "Emily R.",
              },
              {
                quote:
                  "I bought the crochet flower bouquet as a gift — truly a work of art, delicate and beautiful.",
                name: "Sophia M.",
              },
              {
                quote: "Quality beyond expectations. Zrochet has a customer for life!",
                name: "Danielle K.",
              },
            ].map((item) => (
              <blockquote
                key={item.name}
                className="rounded-2xl border border-sand bg-cream p-6 transition hover:luxury-shadow"
              >
                <div className="mb-3 text-sm tracking-widest text-gold">★★★★★</div>
                <p className="font-display text-lg italic leading-relaxed text-text">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer className="mt-4">
                  <strong className="text-sm text-brown-dark">{item.name}</strong>
                  <span className="mt-1 block text-xs text-text-muted">Verified Buyer</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brown-dark py-16 text-white lg:py-20">
        <div className="mx-auto max-w-xl px-5 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">Stay Connected</p>
          <h2 className="font-display mt-2 text-3xl font-semibold md:text-4xl">
            Join the Zrochet Circle
          </h2>
          <p className="mt-4 text-white/75">
            Be the first to know about new collections, exclusive offers, and behind-the-scenes
            stories from our studio.
          </p>
          <form className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email address"
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="rounded-full bg-white px-8 py-3 text-sm font-medium uppercase tracking-wide text-brown-dark transition hover:bg-beige"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
