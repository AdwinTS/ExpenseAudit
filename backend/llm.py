import os
import re
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# Load from .env.local at project root
load_dotenv(Path(__file__).parent.parent / ".env.local")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PROMPT_TEMPLATE = """You are a strict corporate finance auditor at Acme Corporation. Your job is to evaluate employee expense claims against the company policy.

Company Policy (relevant sections):
{policy_chunk}

Receipt Text (OCR extracted):
{receipt_text}

Employee Business Purpose: {purpose}

Instructions:
- Check if the expense type, amount, and purpose comply with the policy.
- Look for specific limit violations (e.g. dinner limit exceeded), prohibited items (alcohol, personal expenses), or missing justification.
- Cite the specific policy rule in your reason (e.g. "Policy Section 2: Dinner limit is $75; claim was $95").
- Be strict but fair.

Return ONLY in this exact format (no extra text):
Decision: Approved
Reason: One sentence citing the specific policy rule
Risk: Low"""


def audit_expense(policy_chunk: str, receipt_text: str, purpose: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        policy_chunk=policy_chunk,
        receipt_text=receipt_text,
        purpose=purpose,
    )
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=200,
        )
        return parse_llm_response(response.choices[0].message.content)
    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower() or "rate" in err.lower():
            raise RuntimeError("LLM quota exceeded. Please wait a moment and try again.")
        raise RuntimeError(f"LLM error: {err}")


def parse_llm_response(text: str) -> dict:
    decision = "Flagged"
    reason = "Could not parse LLM response."
    risk = "Medium"

    d_match = re.search(r"Decision:\s*(Approved|Flagged|Rejected)", text, re.IGNORECASE)
    r_match = re.search(r"Reason:\s*(.+)", text)
    risk_match = re.search(r"Risk:\s*(Low|Medium|High)", text, re.IGNORECASE)

    if d_match:
        decision = d_match.group(1).capitalize()
    if r_match:
        reason = r_match.group(1).strip()
    if risk_match:
        risk = risk_match.group(1).capitalize()

    return {"decision": decision, "reason": reason, "risk": risk}
