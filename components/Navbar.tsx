"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";

const NAV_LINKS = [
  { href: "/#home", label: "Home", id: "home" },
  { href: "/#shop", label: "Shop", id: "shop" },
  { href: "/#collections", label: "Collections", id: "collections" },
  { href: "/#about", label: "About", id: "about" },
  { href: "/#contact", label: "Contact", id: "contact" },
];

function navLinkClass(active: boolean) {
  return [
    "relative text-sm font-medium transition-colors",
    "after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:bg-brown-dark after:transition-all after:duration-300",
    active
      ? "text-brown-dark after:w-full"
      : "text-text-muted hover:text-brown-dark after:w-0 hover:after:w-full",
  ].join(" ");
}

function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-sand text-brown-dark transition hover:border-brown-dark hover:bg-brown-dark hover:text-white"
      aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brown-dark px-1 text-[10px] font-semibold text-white">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;

    const tracked = [
      { id: "home", nav: "home" },
      { id: "collections", nav: "collections" },
      { id: "shop", nav: "shop" },
      { id: "about", nav: "about" },
      { id: "contact", nav: "contact" },
    ]
      .map(({ id, nav }) => {
        const element = document.getElementById(id);
        return element ? { element, nav } : null;
      })
      .filter(Boolean) as { element: HTMLElement; nav: string }[];

    function updateActiveSection() {
      const scrollPos = window.scrollY + 120;
      let current = "home";

      tracked.forEach(({ element, nav }) => {
        if (scrollPos >= element.offsetTop) {
          current = nav;
        }
      });

      setActiveSection(current);
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [isHome]);

  function isActive(id: string) {
    return isHome && activeSection === id;
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-cream transition-shadow">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-6 lg:px-10">
        <Link
          href="/"
          className="font-display text-[1.75rem] font-bold tracking-wide text-brown-dark"
        >
          Zrochet
        </Link>

        <div className="ml-auto flex items-center gap-4 md:gap-8">
          <nav className="hidden items-center gap-8 lg:flex lg:gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={navLinkClass(isActive(link.id))}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <CartButton />

          <button
            type="button"
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span className={`h-0.5 w-5 bg-brown-dark transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-5 bg-brown-dark transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-5 bg-brown-dark transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-sand bg-cream px-6 py-4 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`block py-3 text-sm font-medium ${
                isActive(link.id) ? "text-brown-dark" : "text-text-muted"
              }`}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className="block py-3 text-sm font-medium text-brown-dark"
            onClick={closeMenu}
          >
            Cart
          </Link>
        </nav>
      )}
    </header>
  );
}
