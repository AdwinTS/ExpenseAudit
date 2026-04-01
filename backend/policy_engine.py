import os

POLICY_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "policy.txt")


def load_policy() -> list[str]:
    """Load and chunk the policy document by section."""
    with open(POLICY_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    chunks = [c.strip() for c in text.split("\n\n") if c.strip()]
    return chunks


def retrieve_relevant_chunks(chunks: list[str], query: str, top_k: int = 4) -> list[str]:
    """Keyword-based retrieval — score each chunk by word overlap with query."""
    query_words = set(query.lower().split())
    scored = []
    for chunk in chunks:
        chunk_words = set(chunk.lower().split())
        score = len(query_words & chunk_words)
        scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:top_k]]


def get_policy_context(purpose: str, receipt_text: str) -> str:
    """Return top relevant policy sections joined as a string for the LLM."""
    chunks = load_policy()
    query = f"{purpose} {receipt_text}"
    relevant = retrieve_relevant_chunks(chunks, query, top_k=4)
    return "\n\n".join(relevant)


def get_policy_snippet(purpose: str, receipt_text: str) -> str:
    """Return the single most relevant policy chunk as the cited snippet."""
    chunks = load_policy()
    query = f"{purpose} {receipt_text}"
    relevant = retrieve_relevant_chunks(chunks, query, top_k=1)
    return relevant[0] if relevant else ""
