from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import uvicorn

app = FastAPI()

print("Loading NLLB-200 model... This may take a few minutes...")
model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)
print(f"Model loaded on {device}")

LANG_CODES = {
    "ja": "jpn_Jpan",
    "en": "eng_Latn",
    "es": "spa_Latn",
    "de": "deu_Latn",
    "th": "tha_Thai",
    "pt": "por_Latn",
    "fil": "tgl_Latn"
}

class TranslationRequest(BaseModel):
    q: str
    source: str
    target: str
    format: str = "text"

@app.post("/translate")
async def translate(request: TranslationRequest):
    try:
        src_lang = LANG_CODES.get(request.source, request.source)
        tgt_lang = LANG_CODES.get(request.target, request.target)

        tokenizer.src_lang = src_lang
        inputs = tokenizer(request.q, return_tensors="pt").to(device)

        translated_tokens = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.lang_code_to_id[tgt_lang],
            max_length=512
        )

        translation = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]

        return {"translatedText": translation}

    except Exception as e:
        print(f"Translation error: {e}")
        return {"translatedText": request.q}

@app.get("/")
async def root():
    return {"status": "NLLB-200 Translation Server", "languages": list(LANG_CODES.keys())}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
