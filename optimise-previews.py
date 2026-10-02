"""Create gallery-ready WebP previews without changing source artwork.

Run: python optimise-previews.py
"""

from pathlib import Path
from PIL import Image


ASSETS = Path("public/Assets")
MAX_EDGE = 1600
QUALITY = 82


def optimise(image_path: Path) -> tuple[int, int, int, int, int, int]:
    before = image_path.stat().st_size
    with Image.open(image_path) as source:
        source.load()
        width, height = source.size
        scale = min(1, MAX_EDGE / max(width, height))
        target = (round(width * scale), round(height * scale))
        image = source.resize(target, Image.Resampling.LANCZOS) if scale < 1 else source.copy()

        # Keep genuine transparency, but avoid a larger RGBA file when there is none.
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in source.info else "RGB")

        temporary = image_path.with_suffix(".optimising.webp")
        image.save(temporary, "WEBP", quality=QUALITY, method=6)

    temporary.replace(image_path)
    return width, height, target[0], target[1], before, image_path.stat().st_size


def main() -> None:
    paths = sorted(ASSETS.rglob("*.webp"))
    before_total = after_total = 0

    for path in paths:
        width, height, new_width, new_height, before, after = optimise(path)
        before_total += before
        after_total += after
        print(f"{path}: {width}x{height} -> {new_width}x{new_height}; {before / 1_000_000:.2f} MB -> {after / 1_000_000:.2f} MB")

    print(f"\nOptimised {len(paths)} previews: {before_total / 1_000_000:.2f} MB -> {after_total / 1_000_000:.2f} MB")


if __name__ == "__main__":
    main()
