import pytest
from unittest.mock import Mock, patch, MagicMock
from main import (
    generate_visual_metaphors,
    generate_color_palettes,
    generate_font_pairs
)


def test_generate_visual_metaphors_demo_mode():
    """Test visual metaphors generation in demo mode"""
    keywords = ["coffee", "innovation", "technology"]
    attributes = ["modern", "premium", "sustainable"]
    
    with patch('main.PRE_GENERATED_METAPHOR_IMAGES', ["url1", "url2", "url3", "url4", "url5", "url6"]):
        result = generate_visual_metaphors(keywords, attributes, demo_mode=True)
        
        assert isinstance(result, list)
        assert len(result) <= 6
        for metaphor in result:
            assert "prompt" in metaphor
            assert "image_url" in metaphor
            assert isinstance(metaphor["prompt"], str)
            assert isinstance(metaphor["image_url"], str)


def test_generate_visual_metaphors_production_mode():
    """Test visual metaphors generation in production mode"""
    keywords = ["nature", "technology", "future"]
    attributes = ["sustainable", "modern", "vibrant"]
    
    result = generate_visual_metaphors(keywords, attributes, demo_mode=False)
    
    assert isinstance(result, list)
    assert len(result) <= 6
    for metaphor in result:
        assert "prompt" in metaphor
        assert "image_url" in metaphor
        assert isinstance(metaphor["prompt"], str)
        assert metaphor["image_url"] == ""  # Empty in production mode
        assert len(metaphor["prompt"]) > 0


def test_generate_visual_metaphors_empty_inputs():
    """Test visual metaphors with empty inputs"""
    result = generate_visual_metaphors([], [], demo_mode=False)
    
    assert isinstance(result, list)
    assert len(result) <= 6
    for metaphor in result:
        assert "prompt" in metaphor
        assert "image_url" in metaphor


def test_generate_color_palettes():
    """Test color palette generation"""
    attributes = ["modern", "sustainable", "premium"]
    
    result = generate_color_palettes(attributes)
    
    assert isinstance(result, list)
    assert len(result) >= 1
    for palette in result:
        assert "name" in palette
        assert "colors" in palette
        assert isinstance(palette["colors"], list)
        assert len(palette["colors"]) >= 3
        # Check hex color format
        for color in palette["colors"]:
            assert color.startswith("#")
            assert len(color) == 7


def test_generate_color_palettes_unknown_attributes():
    """Test color palette generation with unknown attributes"""
    attributes = ["unknown_attr", "random_style"]
    
    result = generate_color_palettes(attributes)
    
    assert isinstance(result, list)
    # Should still generate some palettes even with unknown attributes


def test_generate_color_palettes_empty_attributes():
    """Test color palette generation with empty attributes"""
    result = generate_color_palettes([])
    
    assert isinstance(result, list)
    # Should generate default palettes


def test_generate_font_pairs():
    """Test font pair generation"""
    attributes = ["modern", "elegant", "playful"]
    
    result = generate_font_pairs(attributes)
    
    assert isinstance(result, list)
    assert len(result) >= 1
    for font_pair in result:
        assert "name" in font_pair
        assert "primary" in font_pair
        assert "secondary" in font_pair
        assert isinstance(font_pair["primary"], dict)
        assert isinstance(font_pair["secondary"], dict)
        assert "family" in font_pair["primary"]
        assert "weight" in font_pair["primary"]
        assert "family" in font_pair["secondary"]
        assert "weight" in font_pair["secondary"]


def test_generate_font_pairs_specific_attributes():
    """Test font pairs for specific attributes"""
    # Test modern attribute
    result_modern = generate_font_pairs(["modern"])
    assert len(result_modern) >= 1
    
    # Test elegant attribute
    result_elegant = generate_font_pairs(["elegant"])
    assert len(result_elegant) >= 1
    
    # Test playful attribute
    result_playful = generate_font_pairs(["playful"])
    assert len(result_playful) >= 1


def test_generate_font_pairs_empty_attributes():
    """Test font pair generation with empty attributes"""
    result = generate_font_pairs([])
    
    assert isinstance(result, list)
    # Should generate default font pairs


def test_generate_font_pairs_unknown_attributes():
    """Test font pair generation with unknown attributes"""
    attributes = ["unknown_style", "random_attr"]
    
    result = generate_font_pairs(attributes)
    
    assert isinstance(result, list)
    # Should still generate some font pairs


def test_color_palette_hex_validation():
    """Test that generated color palettes have valid hex colors"""
    attributes = ["modern", "vibrant", "natural"]
    
    result = generate_color_palettes(attributes)
    
    for palette in result:
        for color in palette["colors"]:
            # Validate hex format
            assert color.startswith("#")
            assert len(color) == 7
            # Validate hex characters
            hex_part = color[1:]
            assert all(c in "0123456789ABCDEFabcdef" for c in hex_part)


def test_visual_metaphors_prompt_quality():
    """Test that generated prompts are meaningful"""
    keywords = ["innovation", "sustainability"]
    attributes = ["modern", "natural"]
    
    result = generate_visual_metaphors(keywords, attributes, demo_mode=False)
    
    for metaphor in result:
        prompt = metaphor["prompt"]
        assert len(prompt) > 10  # Should be descriptive
        assert any(keyword in prompt for keyword in keywords + attributes)


def test_font_pairs_structure():
    """Test font pair structure consistency"""
    attributes = ["corporate", "creative"]
    
    result = generate_font_pairs(attributes)
    
    for font_pair in result:
        # Check required fields
        assert "name" in font_pair
        assert "primary" in font_pair
        assert "secondary" in font_pair
        
        # Check primary font structure
        primary = font_pair["primary"]
        assert "family" in primary
        assert "weight" in primary
        assert "size" in primary
        
        # Check secondary font structure
        secondary = font_pair["secondary"]
        assert "family" in secondary
        assert "weight" in secondary
        assert "size" in secondary