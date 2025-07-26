import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from transformers import pipeline
import yake
import re
import requests
import json
import colorsys
import random

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

# Funções para geração da galáxia de conceitos
def generate_visual_metaphors(keywords: List[str], attributes: List[str]) -> List[str]:
    """Gera metáforas visuais usando os keywords e atributos"""
    metaphors = []
    
    # Combinar keywords e attributes para criar metáforas criativas
    for keyword in keywords[:3]:  # Limitar para não sobrecarregar
        for attribute in attributes[:2]:
            if attribute in ["sustentável", "ecológico", "natural"]:
                metaphor = f"uma folha de {keyword} brotando de circuitos tecnológicos"
            elif attribute in ["moderno", "futurista", "tecnológico"]:
                metaphor = f"{keyword} em geometria minimalista com elementos holográficos"
            elif attribute in ["premium", "luxuoso"]:
                metaphor = f"{keyword} dourado em superfície de mármore negro"
            elif attribute in ["vibrante", "colorido"]:
                metaphor = f"{keyword} explodindo em caleidoscópio de cores"
            elif attribute in ["jovem", "familiar"]:
                metaphor = f"{keyword} em ilustração playful com formas orgânicas"
            else:
                metaphor = f"{keyword} {attribute} em composição artística abstrata"
            
            metaphors.append(metaphor)
    
    # Adicionar algumas metáforas genéricas criativas
    metaphors.extend([
        f"conceito de {keywords[0] if keywords else 'marca'} em splash de tinta aquarela",
        f"elementos de {', '.join(keywords[:2])} em mosaico geométrico",
        f"fusão orgânica de {keywords[0] if keywords else 'identidade'} com natureza"
    ])
    
    return metaphors[:6]  # Limitar a 6 metáforas

def generate_color_palettes(attributes: List[str]) -> List[Dict[str, Any]]:
    """Gera paletas de cores baseadas nos atributos"""
    palettes = []
    
    attribute_colors = {
        "moderno": ["#2D3748", "#4A5568", "#E2E8F0", "#F7FAFC"],
        "minimalista": ["#1A202C", "#FFFFFF", "#F7FAFC", "#E2E8F0"],
        "sustentável": ["#2F855A", "#68D391", "#C6F6D5", "#F0FFF4"],
        "premium": ["#1A1A1A", "#D4AF37", "#F7FAFC", "#E2E8F0"],
        "vibrante": ["#E53E3E", "#3182CE", "#38A169", "#D69E2E"],
        "jovem": ["#FF6B9D", "#45B7D1", "#96CEB4", "#FECA57"],
        "clássico": ["#2D3748", "#C53030", "#F7FAFC", "#E2E8F0"],
        "natural": ["#8B4513", "#228B22", "#F5F5DC", "#FFFAF0"]
    }
    
    # Gerar paletas baseadas nos atributos
    for attr in attributes[:3]:
        if attr.lower() in attribute_colors:
            palette = {
                "name": f"Paleta {attr.title()}",
                "colors": attribute_colors[attr.lower()],
                "attribute_basis": attr
            }
            palettes.append(palette)
    
    # Gerar paleta adicional aleatória harmonizada
    hue = random.randint(0, 360)
    harmonic_colors = []
    for i in range(4):
        h = (hue + i * 90) % 360
        s = random.uniform(0.4, 0.8)
        l = random.uniform(0.3, 0.8)
        rgb = colorsys.hls_to_rgb(h/360, l, s)
        hex_color = "#{:02x}{:02x}{:02x}".format(
            int(rgb[0] * 255), int(rgb[1] * 255), int(rgb[2] * 255)
        )
        harmonic_colors.append(hex_color)
    
    palettes.append({
        "name": "Paleta Harmônica",
        "colors": harmonic_colors,
        "attribute_basis": "gerada algoritmicamente"
    })
    
    return palettes

def generate_font_pairs(attributes: List[str]) -> List[Dict[str, Any]]:
    """Gera pares tipográficos baseados nos atributos"""
    font_suggestions = {
        "moderno": {
            "title": ["Roboto", "Montserrat", "Poppins"],
            "body": ["Open Sans", "Lato", "Source Sans Pro"]
        },
        "clássico": {
            "title": ["Playfair Display", "Crimson Text", "Libre Baskerville"],
            "body": ["Georgia", "Times New Roman", "Lora"]
        },
        "minimalista": {
            "title": ["Inter", "Helvetica", "Roboto"],
            "body": ["Inter", "System UI", "Roboto"]
        },
        "jovem": {
            "title": ["Fredoka One", "Comfortaa", "Nunito"],
            "body": ["Nunito", "Comfortaa", "Open Sans"]
        },
        "premium": {
            "title": ["Playfair Display", "Cormorant Garamond", "Libre Baskerville"],
            "body": ["Lato", "Source Sans Pro", "Open Sans"]
        }
    }
    
    pairs = []
    
    for attr in attributes[:3]:
        if attr.lower() in font_suggestions:
            fonts = font_suggestions[attr.lower()]
            pair = {
                "name": f"Par {attr.title()}",
                "title_font": random.choice(fonts["title"]),
                "body_font": random.choice(fonts["body"]),
                "attribute_basis": attr,
                "style_description": f"Tipografia {attr} com contraste hierárquico"
            }
            pairs.append(pair)
    
    # Par padrão versátil
    pairs.append({
        "name": "Par Versátil",
        "title_font": "Montserrat",
        "body_font": "Open Sans",
        "attribute_basis": "universal",
        "style_description": "Combinação testada e versátil para múltiplos contextos"
    })
    
    return pairs

async def save_generated_assets(project_id: str, brief_id: str, assets_data: Dict[str, Any]) -> bool:
    """Salva os assets gerados no Supabase"""
    try:
        # Salvar metáforas como assets
        for i, metaphor in enumerate(assets_data.get("metaphors", [])):
            asset_data = {
                "project_id": project_id,
                "brief_id": brief_id,
                "asset_type": "visual_metaphor",
                "asset_data": {"metaphor": metaphor, "index": i},
                "source_prompt": metaphor,
                "generation_params": {"type": "metaphor_generation"},
                "created_at": datetime.now().isoformat()
            }
            supabase.table("generated_assets").insert(asset_data).execute()
        
        # Salvar paletas de cores
        for i, palette in enumerate(assets_data.get("color_palettes", [])):
            asset_data = {
                "project_id": project_id,
                "brief_id": brief_id,
                "asset_type": "color_palette",
                "asset_data": palette,
                "source_prompt": f"palette based on {palette.get('attribute_basis', 'unknown')}",
                "generation_params": {"type": "color_generation"},
                "created_at": datetime.now().isoformat()
            }
            supabase.table("generated_assets").insert(asset_data).execute()
        
        # Salvar pares tipográficos
        for i, font_pair in enumerate(assets_data.get("font_pairs", [])):
            asset_data = {
                "project_id": project_id,
                "brief_id": brief_id,
                "asset_type": "typography_pair",
                "asset_data": font_pair,
                "source_prompt": f"typography for {font_pair.get('attribute_basis', 'unknown')}",
                "generation_params": {"type": "typography_generation"},
                "created_at": datetime.now().isoformat()
            }
            supabase.table("generated_assets").insert(asset_data).execute()
        
        return True
    except Exception as e:
        print(f"Erro ao salvar assets: {e}")
        return False

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

class GalaxyGenerationRequest(BaseModel):
    keywords: List[str]
    attributes: List[str]
    brief_id: Optional[str] = None
    project_id: Optional[str] = None

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

# Endpoint para Fase 2: Galáxia de Conceitos
@app.post("/generate-galaxy")
async def generate_galaxy(request: GalaxyGenerationRequest):
    """
    Fase 2: Gera a galáxia de conceitos visuais com base nas palavras-chave e atributos.
    Inclui metáforas visuais, paletas de cores e pares tipográficos.
    """
    try:
        if not request.keywords and not request.attributes:
            raise HTTPException(status_code=400, detail="Keywords ou attributes são necessários")
        
        # 1. Gerar metáforas visuais
        metaphors = generate_visual_metaphors(request.keywords, request.attributes)
        
        # 2. Gerar paletas de cores
        color_palettes = generate_color_palettes(request.attributes)
        
        # 3. Gerar pares tipográficos
        font_pairs = generate_font_pairs(request.attributes)
        
        # 4. Organizar dados dos assets
        galaxy_assets = {
            "metaphors": metaphors,
            "color_palettes": color_palettes,
            "font_pairs": font_pairs,
            "generation_metadata": {
                "keywords_used": request.keywords,
                "attributes_used": request.attributes,
                "generated_at": datetime.now().isoformat(),
                "total_assets": len(metaphors) + len(color_palettes) + len(font_pairs)
            }
        }
        
        # 5. Salvar no banco de dados se project_id e brief_id fornecidos
        saved_successfully = False
        if request.project_id and request.brief_id:
            saved_successfully = await save_generated_assets(
                request.project_id, 
                request.brief_id, 
                galaxy_assets
            )
        
        return {
            "success": True,
            "galaxy_data": galaxy_assets,
            "saved_to_database": saved_successfully,
            "message": "Galáxia de conceitos gerada com sucesso"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar galáxia: {str(e)}")

# Endpoint para obter assets gerados de um projeto
@app.get("/projects/{project_id}/assets")
async def get_project_assets(project_id: str, asset_type: Optional[str] = None):
    """Obter todos os assets gerados de um projeto, opcionalmente filtrados por tipo"""
    try:
        query = supabase.table("generated_assets").select("*").eq("project_id", project_id)
        
        if asset_type:
            query = query.eq("asset_type", asset_type)
        
        result = query.execute()
        return {"assets": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {
        "status": "Brand Co-Pilot API is running!",
        "version": "1.0.0",
        "features": [
            "Semantic Onboarding (Phase 1)",
            "Galaxy of Concepts (Phase 2)",
            "AI-powered keyword extraction", 
            "Brand attributes classification",
            "Visual metaphor generation",
            "Color palette generation",
            "Typography pairing",
            "Project management",
            "Editable tags system",
            "Asset persistence"
        ]
    }