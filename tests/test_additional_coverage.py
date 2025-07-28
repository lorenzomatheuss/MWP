import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
import io
from PIL import Image
import json

from main import (
    app,
    extract_text_from_file,
    analyze_document_sections,
    calculate_overall_confidence,
    generate_visual_metaphors,
    generate_color_palettes,
    generate_font_pairs,
    download_image_from_url,
    blend_images,
    apply_color_palette_to_image,
    apply_artistic_filter,
    image_to_base64,
    mock_logo_generation,
    analyze_strategic_elements,
    generate_brand_kit_components,
    save_generated_assets,
    save_curated_asset,
    generate_visual_concept_data,
    generate_brand_kit_data
)

# Test additional file processing
def test_extract_text_from_unsupported_file():
    """Test extraction from unsupported file type"""
    mock_file = Mock()
    mock_file.content_type = "application/unknown"
    mock_file.file = io.BytesIO(b"unknown content")
    
    result = extract_text_from_file(mock_file)
    assert result == ""


def test_extract_text_from_docx_error():
    """Test DOCX extraction with error"""
    mock_file = Mock()
    mock_file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    mock_file.file = io.BytesIO(b"invalid docx")
    
    with patch('main.docx.Document', side_effect=Exception("DOCX Error")):
        result = extract_text_from_file(mock_file)
        assert result == ""


def test_analyze_document_sections_with_content():
    """Test document analysis with real sections"""
    text = """
    OBJETIVO: Criar uma marca sustentável
    PÚBLICO-ALVO: Millennials conscientes
    VALORES: Sustentabilidade, inovação
    PERSONALIDADE: Amigável, confiável
    """
    
    result = analyze_document_sections(text)
    assert isinstance(result, list)


def test_calculate_overall_confidence_with_weights():
    """Test confidence calculation with different weights"""
    sections = [
        {"confidence": 0.9, "content": "very confident section"},
        {"confidence": 0.5, "content": "medium confidence"},
        {"confidence": 0.3, "content": "low confidence"}
    ]
    
    result = calculate_overall_confidence(sections)
    assert 0.0 <= result <= 1.0


# Test visual generation functions
def test_generate_visual_metaphors_demo_mode():
    """Test visual metaphors in demo mode"""
    result = generate_visual_metaphors(
        keywords=["tecnologia", "inovação"],
        attributes=["moderno", "futurista"],
        demo_mode=True
    )
    
    assert isinstance(result, list)


def test_generate_color_palettes_with_attributes():
    """Test color palette generation"""
    result = generate_color_palettes(["moderno", "elegante", "confiável"])
    
    assert isinstance(result, list)


def test_generate_font_pairs_with_attributes():
    """Test font pair generation"""
    result = generate_font_pairs(["criativo", "profissional"])
    
    assert isinstance(result, list)


# Test image processing functions
def test_download_image_success():
    """Test successful image download"""
    with patch('main.requests.get') as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b"fake_image_data"
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        with patch('main.Image.open') as mock_open:
            mock_image = Mock(spec=Image.Image)
            mock_image.convert.return_value = mock_image
            mock_open.return_value = mock_image
            
            result = download_image_from_url("https://example.com/image.jpg")
            assert result == mock_image


def test_download_image_http_error():
    """Test image download with HTTP error"""
    with patch('main.requests.get') as mock_get:
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = Exception("HTTP Error")
        mock_get.return_value = mock_response
        
        with pytest.raises(HTTPException):
            download_image_from_url("https://example.com/image.jpg")


def test_blend_images_with_multiple():
    """Test blending multiple images"""
    mock_images = []
    for i in range(3):
        mock_img = Mock(spec=Image.Image)
        mock_img.size = (100, 100)
        mock_img.mode = "RGBA"
        mock_img.convert.return_value = mock_img
        mock_img.resize.return_value = mock_img
        mock_images.append(mock_img)
    
    with patch('main.Image.blend') as mock_blend:
        mock_result = Mock(spec=Image.Image)
        mock_blend.return_value = mock_result
        
        result = blend_images(mock_images, "multiply")
        assert result is not None


def test_apply_color_palette_enhancement():
    """Test color palette application"""
    mock_image = Mock(spec=Image.Image)
    mock_image.size = (200, 200)
    
    with patch('main.ImageEnhance.Color') as mock_color:
        mock_enhancer = Mock()
        mock_enhanced = Mock(spec=Image.Image)
        mock_enhancer.enhance.return_value = mock_enhanced
        mock_color.return_value = mock_enhancer
        
        result = apply_color_palette_to_image(mock_image, ["#FF0000", "#00FF00"])
        assert result == mock_enhanced


def test_apply_artistic_filter_edge_enhance():
    """Test edge enhancement filter"""
    mock_image = Mock(spec=Image.Image)
    mock_filtered = Mock(spec=Image.Image)
    mock_image.filter.return_value = mock_filtered
    
    result = apply_artistic_filter(mock_image, "edge_enhance")
    assert result == mock_filtered


def test_image_to_base64_conversion():
    """Test image to base64 conversion"""
    mock_image = Mock(spec=Image.Image)
    
    # Simulate saving image data
    def mock_save(buffer, format):
        if hasattr(buffer, 'write'):
            buffer.write(b"test_image_data")
    
    mock_image.save = Mock(side_effect=mock_save)
    
    result = image_to_base64(mock_image)
    
    assert isinstance(result, str)
    assert len(result) > 0


def test_mock_logo_generation():
    """Test mock logo generation"""
    result = mock_logo_generation("TestBrand", ["#FF0000", "#0000FF"])
    
    assert isinstance(result, str)
    assert len(result) > 0


# Test strategic analysis
def test_analyze_strategic_elements_comprehensive():
    """Test comprehensive strategic analysis"""
    text = "Empresa focada em tecnologia sustentável para o futuro"
    keywords = ["tecnologia", "sustentável", "futuro"]
    attributes = ["inovador", "ecológico", "visionário"]
    
    result = analyze_strategic_elements(text, keywords, attributes)
    
    assert isinstance(result, dict)
    required_keys = ["positioning", "differentiation", "opportunities", "risks"]
    for key in required_keys:
        assert key in result


# Test brand kit components
def test_generate_brand_kit_with_assets():
    """Test brand kit generation with curated assets"""
    curated_assets = [
        {
            "type": "color_palette",
            "data": {
                "name": "Modern Tech",
                "colors": ["#3498DB", "#2ECC71", "#E74C3C"]
            }
        },
        {
            "type": "typography",
            "data": {
                "primary_font": "Roboto",
                "secondary_font": "Open Sans"
            }
        }
    ]
    
    result = generate_brand_kit_components(
        curated_assets, 
        "TechCorp", 
        {"style": "modern", "industry": "technology"}
    )
    
    assert isinstance(result, dict)
    assert "brand_name" in result
    assert result["brand_name"] == "TechCorp"


# Test async functions with proper mocking
@pytest.mark.asyncio
async def test_save_generated_assets():
    """Test saving generated assets"""
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock()
        
        result = await save_generated_assets(
            "project_123",
            "brief_456", 
            {"type": "visual_concepts", "data": {}}
        )
        
        assert isinstance(result, bool)


@pytest.mark.asyncio
async def test_save_curated_asset():
    """Test saving curated asset"""
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock()
        
        result = await save_curated_asset(
            "project_123",
            "brief_456",
            {"name": "Logo", "data": "base64_data"},
            "logo"
        )
        
        assert isinstance(result, str)  # Returns asset_id


# Test data generation functions
def test_generate_visual_concept_data():
    """Test visual concept data generation"""
    result = generate_visual_concept_data(
        keywords=["inovação", "sustentabilidade"],
        attributes=["moderno", "ecológico"],
        confidence=0.85
    )
    
    assert isinstance(result, dict)


def test_generate_brand_kit_data():
    """Test brand kit data generation"""
    result = generate_brand_kit_data(
        brand_name="EcoTech",
        preferences={"style": "modern", "colors": ["green", "blue"]},
        keywords=["sustentável", "tecnologia"],
        attributes=["inovador", "confiável"]
    )
    
    assert isinstance(result, dict)
    assert "kit_id" in result


# Test error handling in various scenarios
def test_function_error_handling():
    """Test error handling across functions"""
    # Test with invalid inputs
    assert calculate_overall_confidence([]) >= 0.0
    assert isinstance(generate_color_palettes([]), list)
    assert isinstance(generate_font_pairs([]), list)
    
    # Test with None inputs
    try:
        extract_text_from_file(None)
    except (AttributeError, TypeError):
        pass  # Expected behavior
    
    # Test empty string inputs
    result = analyze_strategic_elements("", [], [])
    assert isinstance(result, dict)


# Additional coverage for edge cases
def test_image_processing_edge_cases():
    """Test image processing edge cases"""
    # Test with None image
    result = apply_artistic_filter(None, "blur")
    assert result is None
    
    # Test with invalid filter
    mock_image = Mock(spec=Image.Image)
    result = apply_artistic_filter(mock_image, "nonexistent_filter")
    assert result == mock_image


def test_data_validation_scenarios():
    """Test various data validation scenarios"""
    # Test empty lists
    assert isinstance(generate_visual_metaphors([], []), list)
    
    # Test single item lists
    assert isinstance(generate_color_palettes(["modern"]), list)
    
    # Test duplicate items
    assert isinstance(generate_font_pairs(["modern", "modern"]), list)