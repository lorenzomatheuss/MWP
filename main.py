import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
import docx
import PyPDF2
import io

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

# Funções para parsing de documentos
def extract_text_from_file(file: UploadFile) -> str:
    """Extrai texto de diferentes tipos de arquivo"""
    try:
        if file.content_type == "application/pdf":
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.file.read()))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        
        elif file.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            doc = docx.Document(io.BytesIO(file.file.read()))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        
        elif file.content_type == "text/plain":
            content = file.file.read()
            return content.decode('utf-8')
        
        else:
            # Tentar como texto plano
            content = file.file.read()
            return content.decode('utf-8', errors='ignore')
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao extrair texto: {str(e)}")

def analyze_document_sections(text: str) -> List[Dict[str, Any]]:
    """Analisa o documento e identifica seções estratégicas"""
    sections = []
    
    # Padrões para identificar seções
    section_patterns = {
        'company_info': [
            r'(empresa|companhia|negócio|organização)',
            r'(sobre|história|fundação)',
            r'(missão|visão|valores)'
        ],
        'target_audience': [
            r'(público|audiência|target|cliente)',
            r'(persona|perfil|consumidor)',
            r'(demográfico|segmento)'
        ],
        'objectives': [
            r'(objetivo|meta|propósito)',
            r'(estratégia|plano|direção)',
            r'(resultado|alcançar)'
        ],
        'brand_personality': [
            r'(personalidade|tom|voz)',
            r'(estilo|identidade|caráter)',
            r'(atributo|característica)'
        ],
        'values': [
            r'(valor|princípio|crença)',
            r'(ética|cultura|filosofia)',
            r'(importância|prioridade)'
        ]
    }
    
    # Dividir texto em parágrafos
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    
    for paragraph in paragraphs:
        if len(paragraph) < 50:  # Pular parágrafos muito curtos
            continue
        
        best_match = {'type': 'other', 'confidence': 0.0}
        
        # Verificar cada tipo de seção
        for section_type, patterns in section_patterns.items():
            confidence = 0.0
            
            for pattern in patterns:
                matches = len(re.findall(pattern, paragraph.lower()))
                confidence += matches * 0.2
            
            # Bonus por palavras-chave específicas
            if section_type == 'company_info' and any(word in paragraph.lower() for word in ['empresa', 'fundada', 'criada']):
                confidence += 0.3
            elif section_type == 'target_audience' and any(word in paragraph.lower() for word in ['anos', 'jovens', 'adultos', 'profissionais']):
                confidence += 0.3
            elif section_type == 'objectives' and any(word in paragraph.lower() for word in ['queremos', 'objetivo', 'busca']):
                confidence += 0.3
            
            if confidence > best_match['confidence']:
                best_match = {'type': section_type, 'confidence': min(confidence, 1.0)}
        
        # Determinar título baseado no tipo
        title_map = {
            'company_info': 'Informações da Empresa',
            'target_audience': 'Público-Alvo',
            'objectives': 'Objetivos',
            'brand_personality': 'Personalidade da Marca',
            'values': 'Valores',
            'other': 'Informações Gerais'
        }
        
        sections.append({
            'title': title_map[best_match['type']],
            'content': paragraph,
            'confidence': best_match['confidence'],
            'type': best_match['type']
        })
    
    # Ordenar por confidence e pegar as melhores
    sections.sort(key=lambda x: x['confidence'], reverse=True)
    return sections[:8]  # Máximo de 8 seções

def calculate_overall_confidence(sections: List[Dict[str, Any]]) -> float:
    """Calcula confidence score geral do documento"""
    if not sections:
        return 0.0
    
    # Pesos por tipo de seção
    type_weights = {
        'company_info': 0.2,
        'target_audience': 0.25,
        'objectives': 0.25,
        'brand_personality': 0.15,
        'values': 0.15
    }
    
    total_weight = 0.0
    weighted_confidence = 0.0
    
    for section in sections:
        weight = type_weights.get(section['type'], 0.1)
        total_weight += weight
        weighted_confidence += section['confidence'] * weight
    
    if total_weight == 0:
        return sum(s['confidence'] for s in sections) / len(sections)
    
    return min(weighted_confidence / total_weight, 1.0)

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

def analyze_strategic_elements(text: str, keywords: List[str], attributes: List[str]) -> Dict[str, Any]:
    """Analisa elementos estratégicos do briefing"""
    
    # Extrair propósito usando padrões
    purpose_patterns = [
        r'(nosso objetivo é|queremos|buscamos|pretendemos|o objetivo|nossa missão)',
        r'(empresa.{0,50}(busca|quer|pretende|visa))',
        r'(marca.{0,50}(representa|significa|busca))'
    ]
    
    purpose = ""
    for pattern in purpose_patterns:
        matches = re.findall(pattern, text.lower())
        if matches:
            # Encontrar a frase completa
            start_idx = text.lower().find(matches[0][0] if isinstance(matches[0], tuple) else matches[0])
            if start_idx != -1:
                # Pegar até o final da frase
                end_idx = text.find('.', start_idx)
                if end_idx == -1:
                    end_idx = text.find('\n', start_idx)
                if end_idx == -1:
                    end_idx = start_idx + 200
                purpose = text[start_idx:end_idx].strip()
                break
    
    if not purpose:
        # Fallback: usar primeiras frases com keywords relevantes
        sentences = text.split('.')
        for sentence in sentences:
            if any(kw.lower() in sentence.lower() for kw in keywords[:3]):
                purpose = sentence.strip()
                break
    
    # Extrair valores baseado em keywords e padrões
    value_keywords = [
        'sustentabilidade', 'qualidade', 'inovação', 'excelência', 'transparência',
        'responsabilidade', 'confiança', 'autenticidade', 'criatividade', 'paixão',
        'compromisso', 'integridade', 'diversidade', 'inclusão', 'respeito'
    ]
    
    values = []
    for attr in attributes:
        if attr.lower() in value_keywords:
            values.append(attr.title())
    
    # Adicionar valores inferidos do texto
    for value_kw in value_keywords:
        if value_kw in text.lower() and value_kw.title() not in values:
            values.append(value_kw.title())
    
    # Extrair traços de personalidade
    personality_mapping = {
        'moderno': ['Inovador', 'Contemporâneo', 'Dinâmico'],
        'jovem': ['Energético', 'Descontraído', 'Vibrante'],
        'premium': ['Sofisticado', 'Elegante', 'Exclusivo'],
        'sustentável': ['Consciente', 'Responsável', 'Natural'],
        'tradicional': ['Confiável', 'Sólido', 'Estabelecido'],
        'criativo': ['Inspirador', 'Original', 'Artístico'],
        'tecnológico': ['Eficiente', 'Preciso', 'Avançado']
    }
    
    personality_traits = []
    for attr in attributes:
        if attr.lower() in personality_mapping:
            personality_traits.extend(personality_mapping[attr.lower()])
    
    # Mapear tensões criativas baseado nos atributos
    tensions = {
        'traditional_contemporary': 50,
        'corporate_creative': 50,
        'minimal_detailed': 50,
        'serious_playful': 50
    }
    
    # Ajustar baseado nos atributos
    traditional_score = 0
    contemporary_score = 0
    corporate_score = 0
    creative_score = 0
    minimal_score = 0
    detailed_score = 0
    serious_score = 0
    playful_score = 0
    
    for attr in attributes:
        attr_lower = attr.lower()
        
        # Tradicional vs Contemporâneo
        if attr_lower in ['tradicional', 'clássico', 'estabelecido']:
            traditional_score += 20
        elif attr_lower in ['moderno', 'contemporâneo', 'inovador', 'futurista']:
            contemporary_score += 20
        
        # Corporativo vs Criativo
        if attr_lower in ['profissional', 'corporativo', 'formal']:
            corporate_score += 20
        elif attr_lower in ['criativo', 'artístico', 'inovador']:
            creative_score += 20
        
        # Minimal vs Detalhado
        if attr_lower in ['minimalista', 'simples', 'limpo']:
            minimal_score += 20
        elif attr_lower in ['detalhado', 'elaborado', 'complexo']:
            detailed_score += 20
        
        # Sério vs Descontraído
        if attr_lower in ['sério', 'formal', 'profissional']:
            serious_score += 20
        elif attr_lower in ['jovem', 'descontraído', 'divertido', 'playful']:
            playful_score += 20
    
    tensions['traditional_contemporary'] = max(0, min(100, 50 + contemporary_score - traditional_score))
    tensions['corporate_creative'] = max(0, min(100, 50 + creative_score - corporate_score))
    tensions['minimal_detailed'] = max(0, min(100, 50 + detailed_score - minimal_score))
    tensions['serious_playful'] = max(0, min(100, 50 + playful_score - serious_score))
    
    return {
        'purpose': purpose or f"Desenvolver uma marca {', '.join(attributes[:2])} que conecte com {', '.join(keywords[:2])}",
        'values': values[:5],  # Máximo 5 valores
        'personality_traits': list(set(personality_traits))[:6],  # Máximo 6 traços únicos
        'creative_tensions': tensions
    }

def generate_visual_concept_data(
    strategic_analysis: Dict[str, Any], 
    keywords: List[str], 
    attributes: List[str],
    style_preferences: Dict[str, int]
) -> List[Dict[str, Any]]:
    """Gera dados dos conceitos visuais baseados na análise estratégica"""
    
    concepts = []
    
    # Base de fontes por estilo
    font_combinations = {
        'contemporary': [
            {'primary': 'Inter', 'secondary': 'Open Sans'},
            {'primary': 'Poppins', 'secondary': 'Roboto'},
            {'primary': 'Montserrat', 'secondary': 'Lato'}
        ],
        'traditional': [
            {'primary': 'Playfair Display', 'secondary': 'Georgia'},
            {'primary': 'Crimson Text', 'secondary': 'Times New Roman'},
            {'primary': 'Libre Baskerville', 'secondary': 'Lora'}
        ],
        'creative': [
            {'primary': 'Fredoka One', 'secondary': 'Nunito'},
            {'primary': 'Comfortaa', 'secondary': 'Open Sans'},
            {'primary': 'Pacifico', 'secondary': 'Roboto'}
        ]
    }
    
    # Gerar 3 conceitos distintos
    for i in range(3):
        concept_id = f"concept_{i+1}"
        
        # Determinar estilo base
        if style_preferences['traditional_contemporary'] > 70:
            style_base = 'contemporary'
        elif style_preferences['traditional_contemporary'] < 30:
            style_base = 'traditional'
        elif style_preferences['corporate_creative'] > 60:
            style_base = 'creative'
        else:
            style_base = 'contemporary'
        
        # Selecionar tipografia
        typography = font_combinations[style_base][i % len(font_combinations[style_base])]
        
        # Gerar paleta de cores baseada nos atributos
        if 'sustentável' in [attr.lower() for attr in attributes]:
            color_palettes = [
                ['#2F855A', '#68D391', '#F0FFF4', '#C6F6D5', '#276749'],
                ['#38A169', '#9AE6B4', '#F7FAFC', '#E6FFFA', '#22543D'],
                ['#319795', '#81E6D9', '#E6FFFA', '#B2F5EA', '#2C7A7B']
            ]
        elif 'moderno' in [attr.lower() for attr in attributes]:
            color_palettes = [
                ['#2D3748', '#4A5568', '#E2E8F0', '#F7FAFC', '#1A202C'],
                ['#3182CE', '#63B3ED', '#EBF8FF', '#BEE3F8', '#2B6CB0'],
                ['#805AD5', '#B794F6', '#FAF5FF', '#E9D8FD', '#6B46C1']
            ]
        elif 'premium' in [attr.lower() for attr in attributes]:
            color_palettes = [
                ['#1A1A1A', '#D4AF37', '#F7FAFC', '#E2E8F0', '#2D2D2D'],
                ['#2D3748', '#E53E3E', '#FFF5F5', '#FEB2B2', '#742A2A'],
                ['#4A5568', '#38B2AC', '#E6FFFA', '#81E6D9', '#285E61']
            ]
        else:
            color_palettes = [
                ['#2B6CB0', '#4299E1', '#EBF8FF', '#90CDF4', '#2C5282'],
                ['#38A169', '#68D391', '#F0FFF4', '#C6F6D5', '#276749'],
                ['#805AD5', '#B794F6', '#FAF5FF', '#E9D8FD', '#6B46C1']
            ]
        
        color_palette = color_palettes[i % len(color_palettes)]
        
        # Gerar URLs de logo fictícias (para demo)
        logo_variations = [
            f"https://via.placeholder.com/200x100/{''.join(color_palette[0].split('#'))}/FFFFFF?text=Logo+{i+1}+A",
            f"https://via.placeholder.com/200x100/{''.join(color_palette[1].split('#'))}/FFFFFF?text=Logo+{i+1}+B",
            f"https://via.placeholder.com/200x100/{''.join(color_palette[2].split('#'))}/000000?text=Logo+{i+1}+C",
            f"https://via.placeholder.com/200x100/FFFFFF/{''.join(color_palette[0].split('#'))}?text=Logo+{i+1}+D"
        ]
        
        # Gerar elementos gráficos (placeholders)
        graphic_elements = [
            f"https://via.placeholder.com/100x100/{''.join(color_palette[0].split('#'))}/FFFFFF?text=Element+1",
            f"https://via.placeholder.com/100x100/{''.join(color_palette[1].split('#'))}/FFFFFF?text=Element+2"
        ]
        
        # Gerar rationale estratégico
        personality_str = ', '.join(strategic_analysis.get('personality_traits', [])[:2])
        values_str = ', '.join(strategic_analysis.get('values', [])[:2])
        
        rationale = f"Conceito {i+1} combina {personality_str} com elementos visuais que refletem {values_str}. "
        if style_preferences['traditional_contemporary'] > 50:
            rationale += "Design contemporâneo com linhas limpas e tipografia moderna. "
        else:
            rationale += "Abordagem clássica com elementos tradicionais refinados. "
        
        if style_preferences['corporate_creative'] > 60:
            rationale += "Expressão criativa balanceada com profissionalismo."
        else:
            rationale += "Foco em credibilidade e confiança institucional."
        
        # Gerar prompt para Stable Diffusion (simulado)
        style_prompt = f"logo design, {style_base} style, {', '.join(keywords[:3])}, "
        style_prompt += f"color palette {' '.join(color_palette[:3])}, minimalist, professional, vector art"
        
        concept = {
            'id': concept_id,
            'logo_variations': logo_variations,
            'color_palette': color_palette,
            'typography': typography,
            'graphic_elements': graphic_elements,
            'rationale': rationale,
            'style_prompt': style_prompt
        }
        
        concepts.append(concept)
    
    return concepts

def generate_brand_kit_data(
    brand_name: str,
    selected_concept: Dict[str, Any],
    strategic_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Gera dados completos do kit de marca profissional"""
    
    # URLs simuladas para demonstração
    base_url = "https://example.com/assets"
    
    # Gerar assets package
    assets_package = {
        "logos": [
            {"format": "PNG", "url": f"{base_url}/{brand_name.lower()}_logo_main.png"},
            {"format": "SVG", "url": f"{base_url}/{brand_name.lower()}_logo_main.svg"},
            {"format": "PNG", "url": f"{base_url}/{brand_name.lower()}_logo_alt.png"},
            {"format": "SVG", "url": f"{base_url}/{brand_name.lower()}_logo_alt.svg"},
            {"format": "PDF", "url": f"{base_url}/{brand_name.lower()}_logo_vector.pdf"}
        ],
        "colors": [
            {"name": "Primary", "hex": selected_concept['color_palette'][0], "rgb": "RGB(45, 55, 72)"},
            {"name": "Secondary", "hex": selected_concept['color_palette'][1], "rgb": "RGB(66, 153, 225)"},
            {"name": "Accent", "hex": selected_concept['color_palette'][2], "rgb": "RGB(235, 248, 255)"},
            {"name": "Text", "hex": selected_concept['color_palette'][3], "rgb": "RGB(144, 205, 244)"},
            {"name": "Background", "hex": selected_concept['color_palette'][4], "rgb": "RGB(44, 82, 130)"}
        ],
        "fonts": [
            {"name": selected_concept['typography']['primary'], "weights": ["Regular", "Medium", "Bold"]},
            {"name": selected_concept['typography']['secondary'], "weights": ["Regular", "Italic", "Bold"]}
        ],
        "mockups": [
            {"type": "Business Card", "url": f"{base_url}/{brand_name.lower()}_business_card.png"},
            {"type": "Letterhead", "url": f"{base_url}/{brand_name.lower()}_letterhead.png"},
            {"type": "Social Media Profile", "url": f"{base_url}/{brand_name.lower()}_social.png"},
            {"type": "Website Header", "url": f"{base_url}/{brand_name.lower()}_website.png"}
        ]
    }
    
    # Gerar páginas das guidelines
    guidelines_pages = {
        "cover": f"{base_url}/{brand_name.lower()}_guidelines_cover.png",
        "logo_usage": f"{base_url}/{brand_name.lower()}_guidelines_logo.png",
        "color_palette": f"{base_url}/{brand_name.lower()}_guidelines_colors.png",
        "typography": f"{base_url}/{brand_name.lower()}_guidelines_typography.png",
        "applications": f"{base_url}/{brand_name.lower()}_guidelines_applications.png"
    }
    
    # URLs dos documentos principais
    guidelines_pdf = f"{base_url}/{brand_name.lower()}_brand_guidelines.pdf"
    presentation_deck = f"{base_url}/{brand_name.lower()}_presentation.pptx"
    
    brand_kit = {
        "brand_name": brand_name,
        "guidelines_pdf": guidelines_pdf,
        "assets_package": assets_package,
        "presentation_deck": presentation_deck,
        "guidelines_pages": guidelines_pages,
        "generation_metadata": {
            "generated_at": datetime.now().isoformat(),
            "concept_used": selected_concept['id'],
            "strategic_foundation": {
                "purpose": strategic_analysis.get('purpose', ''),
                "values": strategic_analysis.get('values', []),
                "personality": strategic_analysis.get('personality_traits', [])
            },
            "deliverables": {
                "guidelines_pages": 15,
                "logo_variations": len(assets_package['logos']),
                "color_palette_size": len(assets_package['colors']),
                "font_pairs": len(assets_package['fonts']),
                "mockup_applications": len(assets_package['mockups'])
            }
        }
    }
    
    return brand_kit

# Modelos de dados
class BrandKitRequest(BaseModel):
    brief_id: str
    project_id: Optional[str] = None
    brand_name: str
    selected_concept: Dict[str, Any]
    strategic_analysis: Dict[str, Any]
    kit_preferences: Dict[str, Any]

class VisualConceptRequest(BaseModel):
    brief_id: str
    project_id: Optional[str] = None
    strategic_analysis: Dict[str, Any]
    keywords: List[str]
    attributes: List[str]
    style_preferences: Dict[str, int]

class StrategicAnalysisRequest(BaseModel):
    brief_id: str
    text: str
    keywords: List[str]
    attributes: List[str]
    project_id: Optional[str] = None

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

# Endpoint para parsing de documentos
@app.post("/parse-document")
async def parse_document(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None)
):
    """
    Faz upload e parsing de documento estratégico, extraindo seções relevantes
    """
    try:
        # Validar tipo de arquivo
        allowed_types = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "application/msword"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Tipo de arquivo não suportado. Use PDF, DOCX ou TXT."
            )
        
        # Extrair texto do arquivo
        text_content = extract_text_from_file(file)
        
        if len(text_content.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail="Documento muito curto. Mínimo de 100 caracteres necessários."
            )
        
        # Analisar seções estratégicas
        sections = analyze_document_sections(text_content)
        
        # Calcular confidence geral
        overall_confidence = calculate_overall_confidence(sections)
        
        # Preparar resultado
        upload_result = {
            "filename": file.filename,
            "sections": sections,
            "overall_confidence": overall_confidence,
            "total_words": len(text_content.split()),
            "processed_at": datetime.now().isoformat()
        }
        
        # Salvar no banco se project_id fornecido
        if project_id:
            try:
                document_data = {
                    "project_id": project_id,
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "extracted_text": text_content,
                    "parsed_sections": sections,
                    "confidence_score": overall_confidence,
                    "word_count": len(text_content.split()),
                    "created_at": datetime.now().isoformat()
                }
                
                supabase.table("uploaded_documents").insert(document_data).execute()
                
            except Exception as db_error:
                print(f"Erro ao salvar documento no banco: {db_error}")
        
        return upload_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar documento: {str(e)}")

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

# Endpoint para geração do kit de marca final
@app.post("/generate-brand-kit")
async def generate_brand_kit(request: BrandKitRequest):
    """
    Gera o kit de marca completo incluindo brand guidelines, assets em múltiplos 
    formatos, deck de apresentação e mockups de aplicação
    """
    try:
        # Gerar kit de marca completo
        brand_kit = generate_brand_kit_data(
            request.brand_name,
            request.selected_concept,
            request.strategic_analysis
        )
        
        # Salvar no banco de dados se project_id fornecido
        if request.project_id:
            try:
                final_kit_data = {
                    "brief_id": request.brief_id,
                    "project_id": request.project_id,
                    "brand_name": request.brand_name,
                    "final_brand_kit": brand_kit,
                    "concept_used": request.selected_concept,
                    "strategic_analysis": request.strategic_analysis,
                    "kit_preferences": request.kit_preferences,
                    "created_at": datetime.now().isoformat()
                }
                
                supabase.table("final_brand_kits").insert(final_kit_data).execute()
                
            except Exception as db_error:
                print(f"Erro ao salvar kit de marca final: {db_error}")
        
        return brand_kit
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na geração do kit de marca: {str(e)}")

# Endpoint para geração de conceitos visuais
@app.post("/generate-visual-concepts")
async def generate_visual_concepts(request: VisualConceptRequest):
    """
    Gera 3 conceitos visuais distintos baseados na análise estratégica usando Stable Diffusion XL
    """
    try:
        # Gerar conceitos visuais
        concepts = generate_visual_concept_data(
            request.strategic_analysis,
            request.keywords,
            request.attributes,
            request.style_preferences
        )
        
        # Preparar resultado
        visual_data = {
            'concepts': concepts,
            'generation_metadata': {
                'model': 'Stable Diffusion XL (simulated)',
                'timestamp': datetime.now().isoformat(),
                'parameters': {
                    'style_preferences': request.style_preferences,
                    'keywords_used': request.keywords,
                    'attributes_used': request.attributes,
                    'concepts_generated': len(concepts)
                }
            }
        }
        
        # Salvar no banco de dados se project_id fornecido
        if request.project_id:
            try:
                visual_concepts_data = {
                    "brief_id": request.brief_id,
                    "project_id": request.project_id,
                    "generated_concepts": visual_data,
                    "strategic_analysis_used": request.strategic_analysis,
                    "style_preferences": request.style_preferences,
                    "created_at": datetime.now().isoformat()
                }
                
                supabase.table("visual_concepts").insert(visual_concepts_data).execute()
                
            except Exception as db_error:
                print(f"Erro ao salvar conceitos visuais: {db_error}")
        
        return visual_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na geração de conceitos visuais: {str(e)}")

# Endpoint para análise estratégica
@app.post("/strategic-analysis")
async def strategic_analysis(request: StrategicAnalysisRequest):
    """
    Realiza análise estratégica detalhada extraindo propósito, valores,
    personalidade e mapeando tensões criativas
    """
    try:
        # Realizar análise estratégica
        strategic_data = analyze_strategic_elements(
            request.text, 
            request.keywords, 
            request.attributes
        )
        
        # Salvar no banco de dados se project_id fornecido
        if request.project_id:
            try:
                analysis_data = {
                    "brief_id": request.brief_id,
                    "project_id": request.project_id,
                    "strategic_analysis": strategic_data,
                    "created_at": datetime.now().isoformat()
                }
                
                supabase.table("strategic_analyses").insert(analysis_data).execute()
                
            except Exception as db_error:
                print(f"Erro ao salvar análise estratégica: {db_error}")
        
        return strategic_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise estratégica: {str(e)}")

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