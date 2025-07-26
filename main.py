import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from transformers import pipeline
import yake
import re

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do FastAPI
app = FastAPI(title="Brand Co-Pilot API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração do Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Carregar modelos de IA aprimorados
try:
    # Usar YAKE para extração de palavras-chave (mais específico para keywords)
    keyword_extractor = yake.KeywordExtractor(
        lan="pt",  # português
        n=3,       # até 3 palavras por keyword
        dedupLim=0.7,
        top=10
    )
    
    # Modelo para classificação de atributos de marca
    brand_attributes_classifier = pipeline(
        "zero-shot-classification", 
        model="facebook/bart-large-mnli"
    )
    
    # Modelo para análise de sentimentos
    sentiment_analyzer = pipeline(
        "sentiment-analysis", 
        model="cardiffnlp/twitter-roberta-base-sentiment-latest"
    )
    
except Exception as e:
    print(f"Erro ao carregar modelos: {e}")
    keyword_extractor = None
    brand_attributes_classifier = None
    sentiment_analyzer = None

# Modelos de dados
class ProjectRequest(BaseModel):
    name: str
    user_id: Optional[str] = None

class BriefRequest(BaseModel):
    text: str
    project_id: Optional[str] = None

class BriefUpdateRequest(BaseModel):
    brief_id: str
    keywords: List[str]
    attributes: List[str]

# Endpoints para Projetos
@app.post("/projects")
async def create_project(request: ProjectRequest):
    """Criar um novo projeto"""
    try:
        project_data = {
            "name": request.name,
            "user_id": request.user_id or str(uuid.uuid4()),
            "created_at": datetime.now().isoformat()
        }
        
        result = supabase.table("projects").insert(project_data).execute()
        
        if result.data:
            return {"project_id": result.data[0]["id"], "message": "Projeto criado com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Erro ao criar projeto")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{user_id}")
async def get_user_projects(user_id: str):
    """Obter projetos de um usuário"""
    try:
        result = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        return {"projects": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint aprimorado para análise de briefing
@app.post("/analyze-brief")
async def analyze_brief(request: BriefRequest):
    """
    Analisa um briefing de texto e extrai palavras-chave e atributos de marca.
    Salva os resultados no banco de dados se project_id for fornecido.
    """
    try:
        # 1. Extração de Palavras-chave usando YAKE (mais específico)
        if keyword_extractor:
            keywords_raw = keyword_extractor.extract_keywords(request.text)
            keywords = [kw[1] for kw in keywords_raw[:8]]  # Top 8 keywords
        else:
            # Fallback simples se YAKE não estiver disponível
            words = re.findall(r'\b[A-Za-zÀ-ÿ]{3,}\b', request.text.lower())
            keywords = list(set(words))[:8]

        # 2. Classificação de Atributos de Marca (expandida)
        candidate_labels = [
            "moderno", "minimalista", "clássico", "vintage", "futurista",
            "premium", "acessível", "luxuoso", "econômico",
            "sustentável", "ecológico", "natural", "orgânico",
            "vibrante", "colorido", "neutro", "sóbrio",
            "jovem", "maduro", "familiar", "profissional",
            "inovador", "tradicional", "artesanal", "tecnológico"
        ]
        
        attributes = []
        if brand_attributes_classifier:
            attributes_result = brand_attributes_classifier(
                request.text, 
                candidate_labels, 
                multi_label=True
            )
            # Filtrar atributos com score alto
            attributes = [
                label for label, score in 
                zip(attributes_result['labels'], attributes_result['scores']) 
                if score > 0.4
            ][:6]  # Top 6 atributos

        # 3. Análise de sentimento para contexto adicional
        sentiment = "neutral"
        if sentiment_analyzer:
            try:
                sentiment_result = sentiment_analyzer(request.text[:512])  # Limitar tamanho
                sentiment = sentiment_result[0]['label'].lower()
            except:
                sentiment = "neutral"

        # 4. Salvar no banco de dados se project_id for fornecido
        brief_id = None
        if request.project_id:
            try:
                brief_data = {
                    "project_id": request.project_id,
                    "raw_text": request.text,
                    "analyzed_keywords": keywords,
                    "analyzed_attributes": attributes,
                    "sentiment": sentiment,
                    "created_at": datetime.now().isoformat()
                }
                
                result = supabase.table("briefs").insert(brief_data).execute()
                if result.data:
                    brief_id = result.data[0]["id"]
                    
            except Exception as db_error:
                print(f"Erro ao salvar no banco: {db_error}")

        return {
            "brief_id": brief_id,
            "keywords": keywords,
            "attributes": attributes,
            "sentiment": sentiment,
            "project_id": request.project_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint para atualizar análise (tags editáveis)
@app.put("/update-brief")
async def update_brief(request: BriefUpdateRequest):
    """Atualizar keywords e atributos editados pelo usuário"""
    try:
        update_data = {
            "analyzed_keywords": request.keywords,
            "analyzed_attributes": request.attributes,
            "updated_at": datetime.now().isoformat()
        }
        
        result = supabase.table("briefs").update(update_data).eq("id", request.brief_id).execute()
        
        if result.data:
            return {"message": "Briefing atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Briefing não encontrado")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint para obter briefings de um projeto
@app.get("/projects/{project_id}/briefs")
async def get_project_briefs(project_id: str):
    """Obter todos os briefings de um projeto"""
    try:
        result = supabase.table("briefs").select("*").eq("project_id", project_id).execute()
        return {"briefs": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {
        "status": "Brand Co-Pilot API is running!",
        "version": "1.0.0",
        "features": [
            "Semantic Onboarding (Phase 1)",
            "AI-powered keyword extraction", 
            "Brand attributes classification",
            "Project management",
            "Editable tags system"
        ]
    }