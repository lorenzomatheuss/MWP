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
import base64
from io import BytesIO
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

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

# URLs pré-geradas para demonstração (estratégia anti-falha de API)
PRE_GENERATED_METAPHOR_IMAGES = [
    "https://images.unsplash.com/photo-1554755229-ca4470e22238?q=80&w=1974&auto=format&fit=crop", # café e tecnologia
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop", # café e natureza
    "https://images.unsplash.com/photo-1621358351138-294cb503f3a6?q=80&w=1974&auto=format&fit=crop", # café e minimalismo
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop", # escritório moderno
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=2025&auto=format&fit=crop", # geometria abstrata
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop", # tecnologia futurista
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop", # natureza minimalista
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop", # arte abstrata
    "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?q=80&w=1935&auto=format&fit=crop", # conceito premium
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop"  # design criativo
]

# Funções para geração da galáxia de conceitos
def generate_visual_metaphors(keywords: List[str], attributes: List[str], demo_mode: bool = True) -> List[Dict[str, str]]:
    """Gera metáforas visuais usando os keywords e atributos"""
    metaphors = []
    
    if demo_mode and PRE_GENERATED_METAPHOR_IMAGES:
        # Modo demonstração: usa URLs pré-geradas para velocidade máxima
        pre_generated_metaphors = [
            {"prompt": f"uma folha de {keywords[0] if keywords else 'café'} brotando de circuitos tecnológicos", "image_url": PRE_GENERATED_METAPHOR_IMAGES[0]},
            {"prompt": f"{keywords[0] if keywords else 'natureza'} em geometria minimalista com elementos holográficos", "image_url": PRE_GENERATED_METAPHOR_IMAGES[1]},
            {"prompt": f"{keywords[1] if len(keywords) > 1 else 'conceito'} dourado em superfície de mármore negro", "image_url": PRE_GENERATED_METAPHOR_IMAGES[2]},
            {"prompt": f"elementos de {', '.join(keywords[:2])} explodindo em caleidoscópio de cores", "image_url": PRE_GENERATED_METAPHOR_IMAGES[3]},
            {"prompt": f"fusão orgânica de {keywords[0] if keywords else 'identidade'} com natureza", "image_url": PRE_GENERATED_METAPHOR_IMAGES[4]},
            {"prompt": f"conceito de {keywords[0] if keywords else 'marca'} em splash de tinta aquarela", "image_url": PRE_GENERATED_METAPHOR_IMAGES[5]}
        ]
        return pre_generated_metaphors[:6]
    
    # Modo produção: gera metáforas textuais (para APIs de imagem reais)
    for keyword in keywords[:3]:  # Limitar para não sobrecarregar
        for attribute in attributes[:2]:
            if attribute in ["sustentável", "ecológico", "natural"]:
                prompt = f"uma folha de {keyword} brotando de circuitos tecnológicos"
            elif attribute in ["moderno", "futurista", "tecnológico"]:
                prompt = f"{keyword} em geometria minimalista com elementos holográficos"
            elif attribute in ["premium", "luxuoso"]:
                prompt = f"{keyword} dourado em superfície de mármore negro"
            elif attribute in ["vibrante", "colorido"]:
                prompt = f"{keyword} explodindo em caleidoscópio de cores"
            elif attribute in ["jovem", "familiar"]:
                prompt = f"{keyword} em ilustração playful com formas orgânicas"
            else:
                prompt = f"{keyword} {attribute} em composição artística abstrata"
            
            metaphors.append({"prompt": prompt, "image_url": ""})
    
    # Adicionar algumas metáforas genéricas criativas
    metaphors.extend([
        {"prompt": f"conceito de {keywords[0] if keywords else 'marca'} em splash de tinta aquarela", "image_url": ""},
        {"prompt": f"elementos de {', '.join(keywords[:2])} em mosaico geométrico", "image_url": ""},
        {"prompt": f"fusão orgânica de {keywords[0] if keywords else 'identidade'} com natureza", "image_url": ""}
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

# Funções para processamento de imagens (Fase 3)
def download_image_from_url(url: str) -> Image.Image:
    """Baixa uma imagem de uma URL"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert('RGBA')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao baixar imagem: {str(e)}")

def blend_images(images: List[Image.Image], blend_mode: str = "overlay") -> Image.Image:
    """Combina múltiplas imagens usando diferentes modos de blend"""
    if not images:
        raise ValueError("Lista de imagens vazia")
    
    # Redimensionar todas as imagens para o mesmo tamanho
    base_size = (512, 512)
    resized_images = [img.resize(base_size, Image.Resampling.LANCZOS) for img in images]
    
    # Começar com a primeira imagem
    result = resized_images[0].copy()
    
    for img in resized_images[1:]:
        if blend_mode == "overlay":
            # Blend overlay simples com transparência
            result = Image.blend(result, img, 0.5)
        elif blend_mode == "multiply":
            # Multiplicação para efeito mais escuro
            result = Image.blend(result, img, 0.3)
        elif blend_mode == "screen":
            # Screen para efeito mais claro
            result = Image.blend(result, img, 0.7)
        else:
            # Default: overlay
            result = Image.blend(result, img, 0.5)
    
    return result

def apply_color_palette_to_image(image: Image.Image, palette: List[str]) -> Image.Image:
    """Aplica uma paleta de cores a uma imagem"""
    try:
        # Converter para RGB se necessário
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Aplicar um filtro de cor baseado na paleta
        # Pegar a cor dominante da paleta
        main_color = palette[0] if palette else "#000000"
        
        # Converter hex para RGB
        hex_color = main_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
        # Aplicar um overlay de cor
        overlay = Image.new('RGB', image.size, rgb)
        overlay_with_alpha = Image.new('RGBA', image.size, rgb + (128,))
        
        # Combinar imagem original com overlay
        image_rgba = image.convert('RGBA')
        result = Image.alpha_composite(image_rgba, overlay_with_alpha)
        
        return result.convert('RGB')
    except Exception as e:
        print(f"Erro ao aplicar paleta: {e}")
        return image

def apply_artistic_filter(image: Image.Image, filter_type: str) -> Image.Image:
    """Aplica filtros artísticos à imagem"""
    try:
        if filter_type == "blur":
            return image.filter(ImageFilter.GaussianBlur(radius=2))
        elif filter_type == "sharpen":
            return image.filter(ImageFilter.SHARPEN)
        elif filter_type == "vintage":
            # Efeito vintage com ajuste de cor
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(0.7)  # Reduzir saturação
            enhancer = ImageEnhance.Contrast(image)
            return enhancer.enhance(1.2)  # Aumentar contraste
        elif filter_type == "modern":
            # Efeito moderno com mais saturação
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(1.3)
            enhancer = ImageEnhance.Sharpness(image)
            return enhancer.enhance(1.1)
        else:
            return image
    except Exception as e:
        print(f"Erro ao aplicar filtro: {e}")
        return image

def image_to_base64(image: Image.Image) -> str:
    """Converte uma imagem PIL para base64"""
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode()

async def save_curated_asset(project_id: str, brief_id: str, asset_data: Dict[str, Any], asset_type: str) -> str:
    """Salva um asset curado no banco de dados"""
    try:
        curated_asset = {
            "project_id": project_id,
            "brief_id": brief_id,
            "asset_type": f"curated_{asset_type}",
            "asset_data": asset_data,
            "source_prompt": asset_data.get("description", ""),
            "generation_params": {"phase": "curation", "type": asset_type},
            "created_at": datetime.now().isoformat()
        }
        
        result = supabase.table("generated_assets").insert(curated_asset).execute()
        if result.data:
            return result.data[0]["id"]
        return ""
    except Exception as e:
        print(f"Erro ao salvar asset curado: {e}")
        return ""

# Funções para geração do kit de marca (Fase 4)
def generate_brand_kit_components(curated_assets: List[Dict[str, Any]], brand_name: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
    """Gera componentes do kit de marca baseado nos assets curados"""
    kit_components = {
        "brand_name": brand_name,
        "primary_logo": None,
        "logo_variations": [],
        "color_palette": None,
        "typography": None,
        "visual_elements": [],
        "brand_guidelines": {
            "logo_usage": [],
            "color_usage": [],
            "typography_usage": [],
            "visual_style": []
        },
        "applications": {
            "business_card": None,
            "letterhead": None,
            "social_media": [],
            "website_mockup": None
        }
    }
    
    # Extrair componentes dos assets curados
    for asset in curated_assets:
        asset_type = asset.get("asset_type", "")
        asset_data = asset.get("asset_data", {})
        
        if "color_palette" in asset_type:
            kit_components["color_palette"] = asset_data
        elif "typography" in asset_type:
            kit_components["typography"] = asset_data
        elif "blended_image" in asset_type or "curated_image" in asset_type:
            kit_components["visual_elements"].append(asset_data)
    
    # Gerar diretrizes baseadas nos componentes
    if kit_components["color_palette"]:
        kit_components["brand_guidelines"]["color_usage"] = [
            "Use a cor primária para elementos principais e CTAs",
            "Cores secundárias para detalhes e backgrounds",
            "Mantenha contraste adequado para legibilidade"
        ]
    
    if kit_components["typography"]:
        kit_components["brand_guidelines"]["typography_usage"] = [
            f"Use {kit_components['typography'].get('title_font', 'fonte principal')} para títulos",
            f"Use {kit_components['typography'].get('body_font', 'fonte secundária')} para textos corridos",
            "Mantenha hierarquia tipográfica consistente"
        ]
    
    kit_components["brand_guidelines"]["visual_style"] = [
        "Mantenha consistência visual em todas as aplicações",
        "Use elementos visuais de forma equilibrada",
        "Respeite o espaçamento e respiração da marca"
    ]
    
    return kit_components

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
    demo_mode: Optional[bool] = True

class BlendConceptsRequest(BaseModel):
    image_urls: List[str]
    blend_mode: Optional[str] = "overlay"
    project_id: Optional[str] = None
    brief_id: Optional[str] = None

class ApplyStyleRequest(BaseModel):
    image_url: str
    style_data: Dict[str, Any]  # Pode conter cores, fontes, ou outros estilos
    style_type: str  # "color_palette", "typography", "filter"
    project_id: Optional[str] = None
    brief_id: Optional[str] = None

class CurationItemRequest(BaseModel):
    item_id: str
    item_type: str  # "metaphor", "color_palette", "typography", "blended_image"
    position: Dict[str, float]  # x, y coordinates
    properties: Dict[str, Any]
    project_id: str
    brief_id: str

class FinalizeBrandKitRequest(BaseModel):
    project_id: str
    brief_id: str
    curated_assets: List[Dict[str, Any]]
    brand_name: str
    kit_preferences: Dict[str, Any]

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
        
        # 1. Gerar metáforas visuais (com modo demo para hackathon)
        metaphors = generate_visual_metaphors(request.keywords, request.attributes, request.demo_mode)
        
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

# Endpoints para Fase 3: Curadoria
@app.post("/blend-concepts")
async def blend_concepts(request: BlendConceptsRequest):
    """
    Fase 3: Combina múltiplas imagens para criar conceitos híbridos
    """
    try:
        if len(request.image_urls) < 2:
            raise HTTPException(status_code=400, detail="Pelo menos 2 imagens são necessárias para blend")
        
        # Baixar imagens das URLs
        images = []
        for url in request.image_urls:
            try:
                img = download_image_from_url(url)
                images.append(img)
            except Exception as e:
                # Para esta implementação, vamos criar uma imagem placeholder se o download falhar
                placeholder = Image.new('RGBA', (512, 512), (200, 200, 200, 255))
                images.append(placeholder)
        
        # Fazer blend das imagens
        blended_image = blend_images(images, request.blend_mode)
        
        # Converter para base64
        blended_base64 = image_to_base64(blended_image)
        
        # Preparar dados do asset
        asset_data = {
            "blended_image": f"data:image/png;base64,{blended_base64}",
            "source_urls": request.image_urls,
            "blend_mode": request.blend_mode,
            "description": f"Blend de {len(request.image_urls)} imagens usando modo {request.blend_mode}",
            "created_at": datetime.now().isoformat()
        }
        
        # Salvar se project_id e brief_id fornecidos
        asset_id = ""
        if request.project_id and request.brief_id:
            asset_id = await save_curated_asset(
                request.project_id,
                request.brief_id,
                asset_data,
                "blended_image"
            )
        
        return {
            "success": True,
            "asset_id": asset_id,
            "blended_image": asset_data["blended_image"],
            "metadata": {
                "source_count": len(request.image_urls),
                "blend_mode": request.blend_mode,
                "resolution": "512x512"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer blend: {str(e)}")

@app.post("/apply-style")
async def apply_style(request: ApplyStyleRequest):
    """
    Fase 3: Aplica estilos (cores, filtros) a uma imagem
    """
    try:
        # Baixar imagem
        try:
            image = download_image_from_url(request.image_url)
        except:
            # Criar placeholder se download falhar
            image = Image.new('RGB', (512, 512), (200, 200, 200))
        
        processed_image = image.copy()
        style_description = ""
        
        # Aplicar estilo baseado no tipo
        if request.style_type == "color_palette":
            colors = request.style_data.get("colors", [])
            if colors:
                processed_image = apply_color_palette_to_image(processed_image, colors)
                style_description = f"Paleta de cores aplicada: {', '.join(colors[:3])}"
        
        elif request.style_type == "filter":
            filter_type = request.style_data.get("filter", "modern")
            processed_image = apply_artistic_filter(processed_image, filter_type)
            style_description = f"Filtro {filter_type} aplicado"
        
        elif request.style_type == "typography":
            # Para tipografia, vamos aplicar um filtro que simula o estilo
            font_style = request.style_data.get("attribute_basis", "modern")
            if "vintage" in font_style.lower() or "clássico" in font_style.lower():
                processed_image = apply_artistic_filter(processed_image, "vintage")
            else:
                processed_image = apply_artistic_filter(processed_image, "modern")
            style_description = f"Estilo tipográfico {font_style} aplicado"
        
        # Converter para base64
        styled_base64 = image_to_base64(processed_image)
        
        # Preparar dados do asset
        asset_data = {
            "styled_image": f"data:image/png;base64,{styled_base64}",
            "source_url": request.image_url,
            "applied_style": request.style_data,
            "style_type": request.style_type,
            "description": style_description,
            "created_at": datetime.now().isoformat()
        }
        
        # Salvar se project_id e brief_id fornecidos
        asset_id = ""
        if request.project_id and request.brief_id:
            asset_id = await save_curated_asset(
                request.project_id,
                request.brief_id,
                asset_data,
                "styled_image"
            )
        
        return {
            "success": True,
            "asset_id": asset_id,
            "styled_image": asset_data["styled_image"],
            "metadata": {
                "style_applied": style_description,
                "style_type": request.style_type
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao aplicar estilo: {str(e)}")

# Endpoint para Fase 4: Finalização do Kit de Marca
@app.post("/finalize-brand-kit")
async def finalize_brand_kit(request: FinalizeBrandKitRequest):
    """
    Fase 4: Gera o kit de marca final baseado nos assets curados
    """
    try:
        # Obter assets curados do projeto
        assets_result = supabase.table("generated_assets").select("*").eq(
            "project_id", request.project_id
        ).eq("brief_id", request.brief_id).execute()
        
        project_assets = assets_result.data or []
        
        # Combinar com assets fornecidos na requisição
        all_assets = project_assets + request.curated_assets
        
        # Gerar componentes do kit de marca
        brand_kit = generate_brand_kit_components(
            all_assets, 
            request.brand_name, 
            request.kit_preferences
        )
        
        # Adicionar metadados
        brand_kit["generation_metadata"] = {
            "project_id": request.project_id,
            "brief_id": request.brief_id,
            "total_assets_used": len(all_assets),
            "generated_at": datetime.now().isoformat(),
            "preferences": request.kit_preferences
        }
        
        # Salvar kit final no banco
        final_kit_data = {
            "project_id": request.project_id,
            "brief_id": request.brief_id,
            "asset_type": "final_brand_kit",
            "asset_data": brand_kit,
            "source_prompt": f"Kit de marca final para {request.brand_name}",
            "generation_params": {"phase": "finalization", "type": "brand_kit"},
            "created_at": datetime.now().isoformat()
        }
        
        kit_result = supabase.table("generated_assets").insert(final_kit_data).execute()
        kit_id = kit_result.data[0]["id"] if kit_result.data else None
        
        return {
            "success": True,
            "kit_id": kit_id,
            "brand_kit": brand_kit,
            "download_ready": True,
            "message": f"Kit de marca para '{request.brand_name}' gerado com sucesso"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao finalizar kit: {str(e)}")

# Endpoint para obter kit de marca finalizado
@app.get("/brand-kit/{kit_id}")
async def get_brand_kit(kit_id: str):
    """Obter um kit de marca específico"""
    try:
        result = supabase.table("generated_assets").select("*").eq("id", kit_id).eq("asset_type", "final_brand_kit").execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Kit de marca não encontrado")
        
        return {"brand_kit": result.data[0]}
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
            "Curation Canvas (Phase 3)",
            "Brand Kit Builder (Phase 4)",
            "AI-powered keyword extraction", 
            "Brand attributes classification",
            "Visual metaphor generation",
            "Color palette generation",
            "Typography pairing",
            "Image blending and fusion",
            "Style application",
            "Project management",
            "Editable tags system",
            "Asset persistence",
            "Final brand kit generation"
        ]
    }