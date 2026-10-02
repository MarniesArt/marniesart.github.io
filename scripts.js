/*
  Artwork lives in public/artworks.js, generated from the Assets folder.
  A regular script works whether this site is double-clicked or served.
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

let openArtworkViewer = () => {};

document.addEventListener("DOMContentLoaded", () => {
  openArtworkViewer = initialiseArtworkViewer();
  initialiseWorkMenus();
  initialiseInspirationTabs();
  initialiseArtworkGrids();

  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    initialiseGallery(gallery);
  });
});

function initialiseArtworkViewer() {
  const dialog = document.createElement("dialog");
  dialog.className = "artwork-viewer";
  dialog.setAttribute("aria-labelledby", "artwork-viewer-title");
  dialog.innerHTML = `
    <div class="artwork-viewer__layout">
      <div class="artwork-viewer__image-wrap">
        <img class="artwork-viewer__image" alt="">
      </div>
      <section class="artwork-viewer__details">
        <button class="artwork-viewer__close" type="button" aria-label="Close artwork viewer">&times;</button>
        <p class="eyebrow artwork-viewer__category"></p>
        <h2 id="artwork-viewer-title"></h2>
        <p class="artwork-viewer__description">A selected piece from Amarni Stephenson’s portfolio.</p>
      </section>
    </div>`;
  document.body.append(dialog);

  const image = dialog.querySelector(".artwork-viewer__image");
  const title = dialog.querySelector("#artwork-viewer-title");
  const category = dialog.querySelector(".artwork-viewer__category");
  const close = dialog.querySelector(".artwork-viewer__close");
  let trigger = null;

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    image.removeAttribute("src");
    trigger?.focus();
    trigger = null;
  });

  return ({ src, artworkName, artworkCategory }, openedBy) => {
    if (!src) return;
    trigger = openedBy;
    image.src = src;
    image.alt = `${artworkName} — artwork by Amarni Stephenson`;
    title.textContent = artworkName;
    category.textContent = artworkCategory;
    dialog.showModal();
    close.focus();
  };
}

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
          <button class="archive-card" type="button" aria-label="View ${artworkName}" data-artwork-src="${piece.src}" data-artwork-name="${artworkName}" data-artwork-category="${piece.category}">
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
        openArtworkViewer(
          {
            src: card.dataset.artworkSrc,
            artworkName: card.dataset.artworkName,
            artworkCategory: card.dataset.artworkCategory,
          },
          card,
        ),
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
  let currentPiece = null;

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

  image.addEventListener("click", () => {
    if (!currentPiece) return;
    openArtworkViewer(
      {
        src: currentPiece.src,
        artworkName: titleFromFilename(currentPiece.src),
        artworkCategory: currentPiece.category,
      },
      image,
    );
  });
  image.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    image.click();
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
    currentPiece = piece;

    image.alt = `${artworkName} — artwork by Amarni Stephenson`;
    image.setAttribute("aria-label", `View ${artworkName}`);
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
