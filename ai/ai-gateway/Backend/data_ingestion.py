import os
import pandas as pd
from config import UPLOADS_DIR, CHUNK_SIZE, CHUNK_OVERLAP


def load_from_mongodb() -> list[dict]:
    """Load all MongoDB collections as text records for ChromaDB ingestion."""
    try:
        from mongodb_connector import get_all_dataframes, ping
        if not ping():
            print("[ingest] MongoDB unreachable — skipping.")
            return []
        collections = get_all_dataframes(force_refresh=True)
        all_records = []
        for col_name, df in collections.items():
            print(f"[ingest] MongoDB '{col_name}': {len(df)} rows")
            for idx, row in df.iterrows():
                all_records.append({
                    "text":      row_to_text(row, col_name),
                    "source":    col_name,
                    "row_index": idx,
                })
        return all_records
    except Exception as e:
        print(f"[ingest] MongoDB load error: {e}")
        return []


def load_csv_files(directory: str = UPLOADS_DIR) -> list[dict]:
    """Load all CSV files from the uploads directory (fallback source)."""
    all_records = []
    if not os.path.isdir(directory):
        return []
    csv_files = [f for f in os.listdir(directory) if f.endswith(".csv")]
    if not csv_files:
        return []

    for filename in csv_files:
        filepath = os.path.join(directory, filename)
        try:
            df = pd.read_csv(filepath, encoding="utf-8")
            print(f"Loaded {filename}: {len(df)} rows, {len(df.columns)} columns")
            for idx, row in df.iterrows():
                all_records.append({
                    "text":      row_to_text(row, filename),
                    "source":    filename,
                    "row_index": idx,
                })
        except Exception as e:
            print(f"Error loading {filename}: {e}")

    print(f"Total CSV records loaded: {len(all_records)}")
    return all_records


def row_to_text(row: pd.Series, source: str) -> str:
    """Convert a DataFrame row into a readable text string with a clear project context."""
    SKIP_COLS = {"م", "Unnamed: 0", "_id", "__v"}

    # Natural-language template for the projects collection
    if source in ("projects", "projects.csv"):
        name      = row.get("name") or row.get("اسم المشروع") or "مشروع غير معروف"
        available = row.get("availableUnits")
        total     = row.get("totalUnits")
        price     = row.get("priceRange") or row.get("السعر") or ""
        status    = row.get("status") or ""
        location  = row.get("location") or row.get("الموقع") or ""

        parts = [f"المشروع: {name}"]

        if pd.notna(available) and pd.notna(total):
            available = int(available)
            total     = int(total)
            if available == 0:
                parts.append(f"الوحدات المتاحة: لا توجد وحدات متاحة — المشروع مكتمل الحجز (تم بيع {total} وحدة)")
            else:
                parts.append(f"الوحدات المتاحة: {available} وحدة من أصل {total} وحدة إجمالية")

        if pd.notna(price) and str(price).strip():
            parts.append(f"نطاق السعر: {price}")
        if pd.notna(status) and str(status).strip():
            parts.append(f"حالة المشروع: {status}")
        if pd.notna(location) and str(location).strip():
            parts.append(f"الموقع: {location}")

        # Append any remaining columns not already captured
        handled = {"name", "اسم المشروع", "availableUnits", "totalUnits", "priceRange", "السعر", "status", "حالة المشروع", "location", "الموقع"}
        for col, val in row.items():
            if col not in handled and col not in SKIP_COLS and pd.notna(val) and str(val).strip():
                parts.append(f"{col}: {val}")

        return " | ".join(parts)

    # Generic template for all other collections
    project_name = source.replace(".csv", "").replace("_", " ").title()
    parts = [f"المشروع: {project_name}"]

    for col, val in row.items():
        if col not in SKIP_COLS and pd.notna(val) and str(val).strip():
            parts.append(f"{col}: {val}")

    return " | ".join(parts)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split long text into overlapping chunks."""
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap

    return chunks


def load_text_files(directory: str = UPLOADS_DIR) -> list[dict]:
    """Load all .md and .txt files from the directory."""
    all_records = []
    text_files = [f for f in os.listdir(directory) if f.endswith(".md") or f.endswith(".txt")]
    
    # Also check the parent Data directory for requirements.md
    data_dir = os.path.join(directory, "..")
    if os.path.exists(os.path.join(data_dir, "requirements.md")):
        text_files.append("../requirements.md")

    for filename in text_files:
        filepath = os.path.abspath(os.path.join(directory, filename))
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            all_records.append({
                "text": content,
                "source": os.path.basename(filename),
                "row_index": 0
            })
            print(f"Loaded text file: {filename}")
        except Exception as e:
            print(f"Error loading {filename}: {e}")
    return all_records


def prepare_documents(directory: str = UPLOADS_DIR) -> list[dict]:
    """
    Full pipeline: MongoDB (primary) or CSV (fallback) + text files → chunk.
    Returns a list of document dicts ready for embedding.
    """
    mongo_records = load_from_mongodb()
    csv_records   = [] if mongo_records else load_csv_files(directory)
    text_records  = load_text_files(directory)

    all_records = (mongo_records or csv_records) + text_records
    documents = []

    for record in all_records:
        chunks = chunk_text(record["text"])
        for i, chunk in enumerate(chunks):
            documents.append({
                "text": chunk,
                "source": record["source"],
                "row_index": record.get("row_index", 0),
                "chunk_index": i
            })

    print(f"Total chunks prepared: {len(documents)}")
    return documents


if __name__ == "__main__":
    docs = prepare_documents()
    if docs:
        print("\nSample chunk:")
        print(docs[0]["text"])
