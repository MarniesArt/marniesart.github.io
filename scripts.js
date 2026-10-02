/*
  Artwork lives in public/artworks.js, generated from the Full_Res and Assets
  folders. A regular script works whether this site is double-clicked or served.
*/
const artworks = Array.isArray(window.portfolioArtworks)
  ? window.portfolioArtworks
  : [];

function titleFromFilename(src) {
  const filename = decodeURIComponent(src.split("/").pop() || "Untitled");

  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function shuffled(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function openFullResolution(src) {
  if (!src) return;
  window.open(src, "_blank", "noopener,noreferrer");
}

document.addEventListener("DOMContentLoaded", () => {
  initialiseWorkMenus();
  initialiseInspirationTabs();
  initialiseArtworkGrids();

  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    initialiseGallery(gallery);
  });
});

function initialiseInspirationTabs() {
  document.querySelectorAll("[data-inspiration-tabs]").forEach((tabList) => {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const section = tabList.closest(".inspirations-section");
    const panels = [...section.querySelectorAll('[role="tabpanel"]')];

    function showTab(activeTab) {
      const activePanelId = activeTab.getAttribute("aria-controls");

      tabs.forEach((tab) => {
        const isActive = tab === activeTab;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        panel.hidden = panel.id !== activePanelId;
      });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => showTab(tab));

      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          return;
        }

        event.preventDefault();
        const nextIndex =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
        tabs[nextIndex].focus();
        showTab(tabs[nextIndex]);
      });
    });
  });
}

function initialiseWorkMenus() {
  document.querySelectorAll(".main-nav").forEach((nav) => {
    const trigger = nav.querySelector(".work-trigger");
    const menu = nav.querySelector(".work-dropdown");

    if (!trigger || !menu) return;

    function setOpen(isOpen) {
      trigger.setAttribute("aria-expanded", String(isOpen));
      menu.hidden = !isOpen;
    }

    trigger.addEventListener("click", () => {
      setOpen(trigger.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.focus();
    });
  });
}

function initialiseArtworkGrids() {
  document.querySelectorAll("[data-artwork-grid]").forEach((grid) => {
    // Archive order changes on each page load, while the source files stay put.
    const archivePieces = shuffled(artworks);

    grid.innerHTML = archivePieces
      .map((piece) => {
        const artworkName = titleFromFilename(piece.src);

        return `
          <button class="archive-card" type="button" aria-label="Open ${artworkName} full resolution" data-full-src="${piece.fullSrc || piece.src}">
            <span class="archive-loader">Loading...</span>
            <img data-src="${piece.src}" alt="${artworkName} — artwork by Amarni Stephenson" loading="lazy" decoding="async">
            <span class="archive-label">${artworkName}</span>
          </button>
        `;
      })
      .join("");

    grid.querySelectorAll(".archive-card").forEach((card) => {
      const image = card.querySelector("img");
      const loader = card.querySelector(".archive-loader");

      image.onload = () => {
        card.classList.add("is-loaded");
        loader.hidden = true;
      };

      image.onerror = () => {
        loader.textContent = "Could not load image";
      };

      card.addEventListener("click", () =>
        openFullResolution(card.dataset.fullSrc),
      );
      image.src = image.dataset.src;
    });
  });
}

function initialiseGallery(gallery) {
  const category = gallery.dataset.category || "All";
  const pieces = shuffled(
    artworks.filter(
      (piece) => category === "All" || piece.category === category,
    ),
  );
  const image = gallery.querySelector(".artwork-image");
  const emptyState = gallery.querySelector(".empty-artwork");
  const title = gallery.querySelector(".artwork-title");
  const medium = gallery.querySelector(".artwork-medium");
  const previous = gallery.querySelector(".previous");
  const next = gallery.querySelector(".next");
  const dots = gallery.parentElement.querySelector(".gallery-dots");
  const count = gallery.closest("main").querySelector("#slide-count");
  let activeIndex = 0;
  let currentFullSrc = "";

  const loader = document.createElement("div");
  loader.className = "artwork-loader";
  loader.hidden = true;
  loader.setAttribute("role", "status");
  loader.innerHTML =
    '<span class="loader-mark" aria-hidden="true"></span><span>Loading artwork...</span>';
  image.before(loader);

  image.loading = "lazy";
  image.tabIndex = 0;
  image.setAttribute("role", "button");

  image.addEventListener("click", () => openFullResolution(currentFullSrc));
  image.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openFullResolution(currentFullSrc);
  });

  if (!pieces.length) {
    previous.hidden = true;
    next.hidden = true;
    if (count) count.textContent = "00 / 00";
    return;
  }

  function render() {
    const piece = pieces[activeIndex];
    const artworkName = titleFromFilename(piece.src);
    currentFullSrc = piece.fullSrc || piece.src;

    image.alt = `${artworkName} — artwork by Amarni Stephenson`;
    image.setAttribute("aria-label", `Open ${artworkName} full resolution`);
    image.classList.remove("is-visible");
    emptyState.hidden = true;
    loader.hidden = false;
    title.textContent = artworkName;
    medium.textContent = piece.category;

    image.onload = () => {
      loader.hidden = true;
      image.classList.add("is-visible");
    };

    image.onerror = () => {
      loader.hidden = true;
      image.classList.remove("is-visible");
      emptyState.hidden = false;
      emptyState.querySelector("p").textContent =
        "This artwork could not be loaded.";
    };

    image.src = piece.src;

    if (count) {
      count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(pieces.length).padStart(2, "0")}`;
    }

    dots.innerHTML = pieces
      .map(
        (item, index) => `
          <button
            class="gallery-dot${index === activeIndex ? " is-active" : ""}"
            type="button"
            aria-label="View ${titleFromFilename(item.src)}"
            aria-current="${index === activeIndex ? "true" : "false"}"
            data-index="${index}">
          </button>
        `,
      )
      .join("");
  }

  function move(amount) {
    activeIndex = (activeIndex + amount + pieces.length) % pieces.length;
    render();
  }

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  dots.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-index]");
    if (!dot) return;

    activeIndex = Number(dot.dataset.index);
    render();
  });

  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  gallery.tabIndex = 0;
  render();
}
