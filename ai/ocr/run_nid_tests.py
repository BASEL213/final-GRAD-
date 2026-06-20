"""
OCR test runner — executes llm_extract() against all images in the TESTS folder
and prints a structured result for each one.
"""
import os, sys, time, pathlib

# Force UTF-8 output on Windows so Arabic and box-drawing chars render
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── Load .env from the same directory ────────────────────────────────────────
env_path = pathlib.Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

# ── Import the extractor from the same directory ──────────────────────────────
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from llm_extractor import llm_extract, has_llm_key

TESTS_DIR   = pathlib.Path(__file__).parent.parent.parent / "TESTS"
IMAGE_EXTS  = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def _bar(label: str, width: int = 60) -> str:
    return f"\n{'─' * width}\n  {label}\n{'─' * width}"

def _format_field(key: str, val) -> str:
    if val is None:
        return f"  {'✗':<4} {key:<30}  (not extracted)"
    return f"  {'✓':<4} {key:<30}  {val}"

def run_tests():
    if not has_llm_key():
        print("ERROR: No LLM API key found. Set GROQ_API_KEY or GOOGLE_API_KEY in .env")
        sys.exit(1)

    images = sorted(
        p for p in TESTS_DIR.iterdir()
        if p.suffix.lower() in IMAGE_EXTS
    )
    if not images:
        print(f"No images found in {TESTS_DIR}")
        sys.exit(1)

    print(f"\n{'═' * 60}")
    print(f"  Findoor OCR — NID Test Runner")
    print(f"  Images found: {len(images)}")
    print(f"{'═' * 60}")

    total_fields  = 0
    total_extracted = 0

    for idx, img_path in enumerate(images, 1):
        print(_bar(f"[{idx}/{len(images)}]  {img_path.name}"))
        print(f"  Path   : {img_path}")
        print(f"  Size   : {img_path.stat().st_size // 1024} KB")

        meta: dict = {}
        t0 = time.time()

        try:
            result = llm_extract(str(img_path), _meta=meta)
        except Exception as exc:
            print(f"\n  ERROR: {exc}")
            continue

        elapsed = time.time() - t0

        if result is None:
            print("\n  RESULT: extraction returned None (no LLM key or total failure)")
            continue

        print(f"\n  Method     : {meta.get('method_detail', '—')}")
        print(f"  Deskewed   : {meta.get('deskewed', False)}")
        print(f"  Time       : {elapsed:.1f}s")
        print()

        n_extracted = 0
        conf = meta.get("confidence", {})
        for field, val in result.items():
            c = conf.get(field, "")
            badge = f"[{c}]" if c else ""
            if val:
                n_extracted += 1
                print(f"  ✓  {field:<30}  {val}  {badge}")
            else:
                print(f"  ✗  {field:<30}  (not extracted)")

        total_fields    += 6
        total_extracted += n_extracted

        print(f"\n  Extracted: {n_extracted}/6 fields")

        df = meta.get("derived_fields", {})
        if df:
            print(f"\n  Derived fields:")
            for k, v in df.items():
                print(f"    {k}: {v}")

        cache_info = "(cache hit)" if meta.get("cache_hit") else ""
        print(f"\n  {cache_info}")

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'═' * 60}")
    print(f"  SUMMARY")
    print(f"  Images tested : {len(images)}")
    if total_fields:
        pct = 100 * total_extracted / total_fields
        print(f"  Fields found  : {total_extracted}/{total_fields}  ({pct:.0f}%)")
    print(f"{'═' * 60}\n")

if __name__ == "__main__":
    run_tests()
