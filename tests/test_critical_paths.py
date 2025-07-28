import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
import json
import io

from conftest import client


# Focus on the most critical uncovered API endpoints (lines 841-954, 964-1033, 1116-1179)

@pytest.mark.asyncio
async def test_parse_document_endpoint_success(client):
    """Test successful document parsing endpoint"""
    # Create a mock text file with sufficient content (>100 chars)
    text_content = b"Mock document content for testing with strategic objectives and detailed analysis. This document contains comprehensive information about business goals, market analysis, target audience, and strategic initiatives that need to be processed."
    
    with patch('main.extract_text_from_file') as mock_extract:
        mock_extract.return_value = "Extracted text content with comprehensive strategic analysis and business objectives for thorough document processing."
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"type": "objective", "content": "Test objective", "confidence": 0.9}
            ]
            
            with patch('main.calculate_overall_confidence') as mock_confidence:
                mock_confidence.return_value = 0.85
                
                files = {"file": ("test.txt", io.BytesIO(text_content), "text/plain")}
                response = client.post("/parse-document", files=files)
                
                assert response.status_code == 200
                result = response.json()
                assert "sections" in result
                assert "overall_confidence" in result
                assert "total_words" in result
                assert "filename" in result


@pytest.mark.asyncio
async def test_generate_visual_concepts_endpoint(client):
    """Test visual concepts generation endpoint"""
    request_data = {
        "project_id": "proj123",
        "brief_id": "brief456",
        "strategic_analysis": {
            "target_audience": "Geração Z tech-savvy",
            "brand_positioning": "Inovação sustentável",
            "key_messages": ["Tecnologia verde", "Futuro responsável"]
        },
        "keywords": ["inovação", "tecnologia"],
        "attributes": ["moderno", "futurista"],
        "style_preferences": {"modern": 8, "minimalist": 7, "tech": 9}
    }
    
    with patch('main.generate_visual_concept_data') as mock_generate:
        mock_generate.return_value = {
            "concept_id": "concept123",
            "visual_concepts": [
                {"title": "Tech Innovation", "description": "Modern tech concept"}
            ]
        }
        
        with patch('main.save_generated_assets') as mock_save:
            mock_save.return_value = True
            
            response = client.post("/generate-visual-concepts", json=request_data)
            assert response.status_code == 200


@pytest.mark.asyncio
async def test_strategic_analysis_endpoint(client):
    """Test strategic analysis endpoint"""
    request_data = {
        "project_id": "proj123",
        "brief_id": "brief456", 
        "text": "Nossa empresa busca inovação no mercado tecnológico",
        "keywords": ["inovação", "tecnologia"],
        "attributes": ["moderno", "inovador"]
    }
    
    with patch('main.analyze_strategic_elements') as mock_analyze:
        mock_analyze.return_value = {
            "positioning": "Líder em inovação tecnológica",
            "differentiation": ["Tecnologia avançada", "Equipe especializada"],
            "opportunities": ["Mercado em crescimento", "Novas tecnologias"],
            "risks": ["Concorrência acirrada", "Mudanças regulatórias"]
        }
        
        with patch('main.supabase') as mock_supabase:
            mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock()
            
            response = client.post("/strategic-analysis", json=request_data)
            assert response.status_code == 200


@pytest.mark.asyncio
async def test_blend_concepts_endpoint(client):
    """Test blend concepts endpoint"""
    request_data = {
        "image_urls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
        "blend_mode": "overlay",
        "project_id": "proj123",
        "brief_id": "brief123"
    }
    
    with patch('main.supabase') as mock_supabase:
        # Mock concept retrieval
        mock_concepts = [
            {"id": "concept1", "data": {"image_url": "https://example.com/img1.jpg"}},
            {"id": "concept2", "data": {"image_url": "https://example.com/img2.jpg"}}
        ]
        mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value.data = mock_concepts
        
        with patch('main.download_image_from_url') as mock_download:
            from PIL import Image
            mock_image = Mock(spec=Image.Image)
            mock_download.return_value = mock_image
            
            with patch('main.blend_images') as mock_blend:
                mock_blend.return_value = mock_image
                
                with patch('main.image_to_base64') as mock_to_base64:
                    mock_to_base64.return_value = "data:image/png;base64,mockdata"
                    
                    # Mock save blended concept
                    mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock()
                    
                    response = client.post("/blend-concepts", json=request_data)
                    assert response.status_code == 200


@pytest.mark.asyncio
async def test_generate_galaxy_endpoint(client):
    """Test galaxy generation endpoint"""
    request_data = {
        "project_id": "proj123",
        "central_concept": "Inovação Tecnológica",
        "related_concepts": ["AI", "Sustentabilidade", "Design"],
        "visualization_params": {"size": "large", "style": "modern"}
    }
    
    with patch('main.supabase') as mock_supabase:
        # Mock save galaxy
        mock_response = Mock()
        mock_response.data = [{"id": "galaxy123"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        response = client.post("/generate-galaxy", json=request_data)
        assert response.status_code == 200
        result = response.json()
        assert "galaxy_data" in result
        assert "success" in result


@pytest.mark.asyncio
async def test_generate_brand_kit_endpoint_comprehensive(client):
    """Test comprehensive brand kit generation"""
    request_data = {
        "project_id": "proj123",
        "brand_name": "InnovaTech",
        "curated_assets": [
            {
                "type": "color_palette",
                "data": {"name": "Tech Modern", "colors": ["#0066CC", "#00CC66"]}
            },
            {
                "type": "typography", 
                "data": {"primary_font": "Roboto", "secondary_font": "Open Sans"}
            }
        ],
        "preferences": {
            "style": "modern",
            "industry": "technology",
            "target_audience": "professionals"
        },
        "keywords": ["inovação", "tecnologia", "futuro"],
        "attributes": ["moderno", "confiável", "inovador"]
    }
    
    with patch('main.generate_brand_kit_data') as mock_generate:
        mock_generate.return_value = {
            "kit_id": "kit123",
            "brand_name": "InnovaTech",
            "components": {
                "logo_variants": ["primary", "secondary"],
                "color_palette": {"colors": ["#0066CC", "#00CC66"]},
                "typography": {"primary": "Roboto", "secondary": "Open Sans"}
            }
        }
        
        with patch('main.supabase') as mock_supabase:
            mock_response = Mock()
            mock_response.data = [{"id": "kit123"}]
            mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
            
            response = client.post("/brand-kit", json=request_data)
            assert response.status_code == 200
            result = response.json()
            assert "kit_id" in result


# Test error scenarios for the endpoints
@pytest.mark.asyncio
async def test_parse_document_no_file(client):
    """Test document parsing without file"""
    response = client.post("/parse-document")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_endpoints_with_database_errors(client):
    """Test endpoints with database errors"""
    # Test visual concepts with DB error
    request_data = {
        "project_id": "proj123",
        "brief_id": "brief456",
        "keywords": ["test"],
        "attributes": ["modern"]
    }
    
    with patch('main.generate_visual_concept_data') as mock_generate:
        mock_generate.return_value = {"concept_id": "test"}
        
        with patch('main.save_generated_assets', side_effect=Exception("DB Error")):
            response = client.post("/generate-visual-concepts", json=request_data)
            assert response.status_code == 500


@pytest.mark.asyncio
async def test_strategic_analysis_with_db_error(client):
    """Test strategic analysis with database error"""
    request_data = {
        "project_id": "proj123",
        "brief_id": "brief456",
        "text": "test text",
        "keywords": ["test"],
        "attributes": ["modern"]
    }
    
    with patch('main.analyze_strategic_elements') as mock_analyze:
        mock_analyze.return_value = {"positioning": "test"}
        
        with patch('main.supabase') as mock_supabase:
            mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("DB Error")
            
            response = client.post("/strategic-analysis", json=request_data)
            assert response.status_code == 500


@pytest.mark.asyncio 
async def test_blend_concepts_not_found(client):
    """Test blend concepts with concepts not found"""
    request_data = {
        "concept_ids": ["nonexistent1", "nonexistent2"],
        "blend_mode": "overlay",
        "project_id": "proj123"
    }
    
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value.data = []
        
        response = client.post("/blend-concepts", json=request_data)
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_brand_kit_generation_error(client):
    """Test brand kit generation with error"""
    request_data = {
        "project_id": "proj123",
        "brand_name": "TestBrand",
        "curated_assets": [],
        "preferences": {},
        "keywords": [],
        "attributes": []
    }
    
    with patch('main.generate_brand_kit_data', side_effect=Exception("Generation failed")):
        response = client.post("/brand-kit", json=request_data)
        assert response.status_code == 500


# Test additional endpoint functionality
@pytest.mark.asyncio
async def test_visual_concepts_comprehensive(client):
    """Test visual concepts with comprehensive data"""
    request_data = {
        "project_id": "proj123",
        "brief_id": "brief456",
        "keywords": ["inovação", "sustentabilidade", "tecnologia"],
        "attributes": ["moderno", "ecológico", "confiável", "inovador"],
        "preferences": {
            "style": "modern_eco",
            "colors": ["green", "blue", "silver"],
            "mood": "professional_friendly",
            "target_audience": "millennials_professionals"
        }
    }
    
    with patch('main.generate_visual_concept_data') as mock_generate:
        mock_generate.return_value = {
            "concept_id": "concept456",
            "visual_concepts": [
                {
                    "title": "Eco Innovation Hub",
                    "description": "Sustainable technology workspace",
                    "image_url": "https://example.com/concept1.jpg",
                    "color_palette": ["#2ECC71", "#3498DB", "#95A5A6"],
                    "mood": "professional_inspiring"
                },
                {
                    "title": "Green Tech Future",
                    "description": "Environmentally conscious technology",
                    "image_url": "https://example.com/concept2.jpg", 
                    "color_palette": ["#27AE60", "#2980B9", "#BDC3C7"],
                    "mood": "innovative_trustworthy"
                }
            ],
            "metadata": {
                "confidence": 0.89,
                "generation_time": "2.3s",
                "style_analysis": {
                    "primary_style": "modern_eco",
                    "secondary_influences": ["minimalist", "tech_forward"]
                }
            }
        }
        
        with patch('main.save_generated_assets') as mock_save:
            mock_save.return_value = True
            
            response = client.post("/generate-visual-concepts", json=request_data)
            assert response.status_code == 200
            result = response.json()
            assert "concept_id" in result
            assert "visual_concepts" in result
            assert len(result["visual_concepts"]) == 2


@pytest.mark.asyncio
async def test_galaxy_generation_comprehensive(client):
    """Test comprehensive galaxy generation"""
    request_data = {
        "keywords": ["inovação sustentável", "energia renovável", "economia circular", "tecnologia verde"],
        "attributes": ["moderno", "ecológico", "responsável", "inovador", "futurista"],
        "brief_id": "brief123",
        "project_id": "proj123",
        "demo_mode": True
    }
    
    with patch('main.supabase') as mock_supabase:
        mock_response = Mock()
        mock_response.data = [{"id": "galaxy789"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        response = client.post("/generate-galaxy", json=request_data)
        assert response.status_code == 200
        result = response.json()
        assert "galaxy_data" in result
        assert "success" in result
        assert result["success"] == True