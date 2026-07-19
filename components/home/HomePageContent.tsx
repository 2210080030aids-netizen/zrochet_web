import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import {
  getCatalog,
  getCoverImage,
  getProduct,
  getSiteSettings,
} from "@/lib/catalog";

const FEATURED_PRODUCTS_LIMIT = 12;

const PRIMARY_BTN =
  "inline-flex rounded-full bg-brown-dark px-8 py-3.5 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-brown";

export default async function HomePageContent() {
  const [catalog, settings] = await Promise.all([getCatalog(), getSiteSettings()]);
  const products = catalog.products;
  const featuredProducts = products.slice(0, FEATURED_PRODUCTS_LIMIT);
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
  const heroProduct = (await getProduct("oreo-bags", "ob1")) ?? products[0];

  const storyImageSrc = settings.storyImage || getCoverImage(heroProduct);
  const storyParagraphs = settings.storyText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const storyPoints = [
    settings.storyPoint1,
    settings.storyPoint2,
    settings.storyPoint3,
  ]
    .map((point) => point.trim())
    .filter(Boolean);

  return (
    <>
      <section id="home" className="bg-gradient-to-b from-beige to-cream pt-28 pb-16 lg:pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-brown">
              {settings.heroEyebrow}
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-brown-dark sm:text-5xl lg:text-6xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-5 max-w-lg whitespace-pre-line text-lg leading-relaxed text-text-muted">
              {settings.heroText}
            </p>
            <Link href="#shop" className={`mt-8 ${PRIMARY_BTN}`}>
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
                <ProductImage
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
            {featuredProducts.map((product) => (
              <ProductCard key={product.id + product.category} product={product} />
            ))}
          </div>
          {products.length > 0 && (
            <div className="mt-10 text-center">
              <Link href="/shop" className={PRIMARY_BTN}>
                View more
              </Link>
            </div>
          )}
        </div>
      </section>

      <section id="about" className="bg-beige py-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl luxury-shadow-md">
            <ProductImage
              src={storyImageSrc}
              alt={settings.storyTitle}
              width={700}
              height={525}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-brown">Our Story</p>
            <h2 className="font-display mt-2 text-3xl font-semibold text-brown-dark md:text-4xl">
              {settings.storyTitle}
            </h2>
            {storyParagraphs.map((paragraph, index) => (
              <p key={index} className="mt-4 leading-relaxed text-text-muted">
                {paragraph}
              </p>
            ))}
            {storyPoints.length > 0 && (
              <ul className="mt-6 space-y-2 text-sm font-medium text-text">
                {storyPoints.map((point, index) => (
                  <li key={index}>✦ {point}</li>
                ))}
              </ul>
            )}
            <Link href="#contact" className={`mt-8 ${PRIMARY_BTN}`}>
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
                name: "Ananya R.",
              },
              {
                quote:
                  "I bought the crochet flower bouquet as a gift — truly a work of art, delicate and beautiful.",
                name: "Sneha M.",
              },
              {
                quote: "Quality beyond expectations. Zrochet has a customer for life!",
                name: "Divya K.",
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
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
