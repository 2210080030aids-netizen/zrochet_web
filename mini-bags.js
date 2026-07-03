(function () {
  "use strict";

  const CATALOG_URL = "data/minibags.json";
  const page = document.body.dataset.page;
  const toast = document.getElementById("toast");
  const cartCount = document.getElementById("cartCount");

  let cartItems = 0;
  let toastTimer;

  /* ── Shared utilities ── */

  function formatPrice(product) {
    if (product.currency === "INR") {
      return "₹" + product.price.toLocaleString("en-IN");
    }
    return "$" + product.price.toFixed(2);
  }

  function imageSrc(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2800);
  }

  function bumpCart() {
    if (!cartCount) return;
    cartItems += 1;
    cartCount.textContent = cartItems;
    cartCount.classList.remove("bump");
    void cartCount.offsetWidth;
    cartCount.classList.add("bump");
  }

  async function loadCatalog() {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error("Could not load product catalog.");
    return response.json();
  }

  function initNavbar() {
    const navbar = document.getElementById("navbar");
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");

    if (!navbar) return;

    function handleScroll() {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", function () {
        const isOpen = navMenu.classList.toggle("open");
        navToggle.classList.toggle("active", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
        document.body.style.overflow = isOpen ? "hidden" : "";
      });

      navMenu.querySelectorAll(".nav-link").forEach(function (link) {
        link.addEventListener("click", function () {
          navMenu.classList.remove("open");
          navToggle.classList.remove("active");
          navToggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        });
      });
    }
  }

  function initFadeIn() {
    const fadeElements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    fadeElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function showError(container, message) {
    container.innerHTML =
      '<div class="minibag-empty fade-in visible">' +
      "<p>" + message + "</p>" +
      '<a href="index.html" class="btn btn--outline">Back to Home</a>' +
      "</div>";
  }

  /* ── Listing page ── */

  function renderListing(products) {
    const grid = document.getElementById("minibagGrid");
    if (!grid) return;

    if (!products.length) {
      showError(
        grid,
        "No mini bag products found. Add images named like B1_minibag (1).png to the images folder, then run npm run generate:minibags."
      );
      return;
    }

    grid.innerHTML = products
      .map(function (product, i) {
        const cover = imageSrc(product.images[0]);
        const photoCount = product.images.length;
        return (
          '<a href="mini-bag?id=' +
          encodeURIComponent(product.id) +
          '" class="product-card fade-in" style="--delay:' +
          i * 0.08 +
          's">' +
          '<div class="product-card__image">' +
          '<img src="' +
          cover +
          '" alt="' +
          product.name +
          '" loading="lazy">' +
          (photoCount > 1
            ? '<span class="product-card__badge">' + photoCount + " photos</span>"
            : "") +
          "</div>" +
          '<div class="product-card__body">' +
          '<h3 class="product-card__name">' +
          product.name +
          "</h3>" +
          '<p class="product-card__price">' +
          formatPrice(product) +
          "</p>" +
          '<span class="product-card__link">View details →</span>' +
          "</div>" +
          "</a>"
        );
      })
      .join("");

    initFadeIn();
  }

  async function initListing() {
    const grid = document.getElementById("minibagGrid");
    if (!grid) return;

    try {
      const catalog = await loadCatalog();
      renderListing(catalog.products);
    } catch (err) {
      showError(grid, err.message);
    }
  }

  /* ── Detail page ── */

  function renderAllImages(product) {
    const container = document.getElementById("productImages");
    if (!container) return;

    container.innerHTML = product.images
      .map(function (src, i) {
        return (
          '<figure class="product-detail__figure">' +
          '<img src="' +
          imageSrc(src) +
          '" alt="' +
          product.name +
          " — photo " +
          (i + 1) +
          '" loading="' +
          (i === 0 ? "eager" : "lazy") +
          '">' +
          "</figure>"
        );
      })
      .join("");
  }

  function renderDetail(product) {
    document.title = product.name + " — Zrochet";
    document.getElementById("detailName").textContent = product.name;
    document.getElementById("detailId").textContent = product.id;
    document.getElementById("detailPrice").textContent = formatPrice(product);
    document.getElementById("detailDescription").textContent = product.description;

    const breadcrumbName = document.getElementById("breadcrumbName");
    if (breadcrumbName) breadcrumbName.textContent = product.name;

    renderAllImages(product);

    const addBtn = document.getElementById("addToCartBtn");
    addBtn.addEventListener("click", function () {
      bumpCart();
      addBtn.textContent = "Added ✓";
      addBtn.classList.add("added");
      showToast(product.name + " added to cart");

      setTimeout(function () {
        addBtn.textContent = "Add to Cart";
        addBtn.classList.remove("added");
      }, 2000);
    });

    document.getElementById("productDetail").hidden = false;
    initFadeIn();
  }

  async function initDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const notFound = document.getElementById("productNotFound");

    if (!id) {
      if (notFound) notFound.hidden = false;
      return;
    }

    try {
      const catalog = await loadCatalog();
      const product = catalog.products.find(function (p) {
        return p.id.toUpperCase() === id.toUpperCase();
      });

      if (!product) {
        if (notFound) notFound.hidden = false;
        return;
      }

      renderDetail(product);
    } catch (err) {
      if (notFound) {
        notFound.querySelector("p").textContent = err.message;
        notFound.hidden = false;
      }
    }
  }

  /* ── Init ── */

  initNavbar();

  if (page === "listing") {
    initListing();
  } else if (page === "detail") {
    initDetail();
  }
})();
