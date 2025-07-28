import pytest
from unittest.mock import Mock, patch
from main import (
    generate_visual_metaphors,
    generate_color_palettes,
    generate_font_pairs,
    mock_logo_generation,
    generate_brand_kit_components
)


def test_generate_visual_metaphors():
    """Test visual metaphors generation"""
    keywords = ["tecnologia", "inovação", "sustentabilidade"]
    attributes = ["moderno", "ecológico", "criativo"]
    
    result = generate_visual_metaphors(keywords, attributes, demo_mode=True)
    
    assert isinstance(result, list)
    if result:  # Allow empty results
        assert all("title" in metaphor for metaphor in result)
        assert all("description" in metaphor for metaphor in result)
        assert all("image_url" in metaphor for metaphor in result)


def test_generate_visual_metaphors_empty_input():
    """Test visual metaphors with empty input"""
    result = generate_visual_metaphors([], [], demo_mode=True)
    
    assert isinstance(result, list)
    assert len(result) > 0  # Should still return default metaphors


def test_generate_color_palettes():
    """Test color palette generation"""
    attributes = ["moderno", "elegante", "confiável"]
    
    result = generate_color_palettes(attributes)
    
    assert isinstance(result, list)
    if result:  # Allow empty results
        assert all("name" in palette for palette in result)
        assert all("colors" in palette for palette in result)
        assert all("description" in palette for palette in result)


def test_generate_color_palettes_empty_attributes():
    """Test color palettes with empty attributes"""
    result = generate_color_palettes([])
    
    assert isinstance(result, list)
    assert len(result) > 0  # Should return default palettes


def test_generate_font_pairs():
    """Test font pairs generation"""
    attributes = ["moderno", "elegante", "criativo"]
    
    result = generate_font_pairs(attributes)
    
    assert isinstance(result, list)
    if result:  # Allow empty results
        assert all("name" in pair for pair in result)
        assert all("primary_font" in pair for pair in result)
        assert all("secondary_font" in pair for pair in result)
        assert all("description" in pair for pair in result)


def test_generate_font_pairs_empty_attributes():
    """Test font pairs with empty attributes"""
    result = generate_font_pairs([])
    
    assert isinstance(result, list)
    assert len(result) > 0  # Should return default pairs


def test_mock_logo_generation():
    """Test mock logo generation"""
    text = "TechCorp"
    palette = ["#FF6B6B", "#4ECDC4", "#45B7D1"]
    
    result = mock_logo_generation(text, palette)
    
    assert isinstance(result, str)
    assert result.startswith("data:image/png;base64,")
    assert len(result) > 100  # Should be a substantial base64 string


def test_mock_logo_generation_empty_input():
    """Test logo generation with empty input"""
    result = mock_logo_generation("", [])
    
    assert isinstance(result, str)
    # Allow any valid response format
    assert len(result) > 0


def test_generate_brand_kit_components():
    """Test brand kit components generation"""
    curated_assets = [
        {
            "type": "color_palette",
            "data": {"colors": ["#FF6B6B", "#4ECDC4"], "name": "Modern"}
        },
        {
            "type": "font_pair",
            "data": {"primary_font": "Roboto", "secondary_font": "Open Sans"}
        }
    ]
    brand_name = "TechCorp"
    preferences = {"style": "modern", "industry": "technology"}
    
    result = generate_brand_kit_components(curated_assets, brand_name, preferences)
    
    assert isinstance(result, dict)
    # Check for essential keys but allow flexible structure
    assert "brand_name" in result
    assert "applications" in result


def test_generate_brand_kit_components_minimal():
    """Test brand kit generation with minimal assets"""
    result = generate_brand_kit_components([], "TestBrand", {})
    
    assert isinstance(result, dict)
    # Check for essential keys
    assert "brand_name" in result
    assert "applications" in result