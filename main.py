import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from transformers import pipeline

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do FastAPI
app = FastAPI()

# Configuração do Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Carregar modelos de IA da Hugging Face 
# Usando um modelo para extração de palavras-chave 
keyword_extractor = pipeline("token-classification", model="ml6team/bert-base-uncased-ner-wnut2017")

# Para classificação multi-rótulo, usamos um modelo zero-shot como proxy para o hackathon
brand_attributes_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Modelo de dados para o request
class BriefRequest(BaseModel):
    text: str

@app.post("/analyze-brief")
async def analyze_brief(request: BriefRequest):
    """
    Recebe o texto do briefing, analisa-o para extrair palavras-chave e atributos de marca,
    e retorna os resultados.
    """
    try:
        # 1. Extração de Palavras-chave
        keywords_raw = keyword_extractor(request.text)
        # Simples processamento para agrupar e limpar as palavras-chave
        keywords = list(set([item['word'].strip() for item in keywords_raw if item['entity_group'] == 'prod']))

        # 2. Classificação de Atributos de Marca
        candidate_labels = ["moderno", "minimalista", "terreno", "acessível", "premium", "sustentável", "vibrante"]
        attributes_result = brand_attributes_classifier(request.text, candidate_labels, multi_label=True)

        # Filtra os atributos com score acima de um limiar
        attributes = [label for label, score in zip(attributes_result['labels'], attributes_result['scores']) if score > 0.6]

        # Aqui você poderia salvar no Supabase se necessário, mas para o MVP, retornamos direto.

        return {"keywords": keywords, "attributes": attributes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"Status": "Brand Co-Pilot API is running!"}