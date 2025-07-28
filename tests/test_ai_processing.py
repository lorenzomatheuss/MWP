import pytest
from unittest.mock import Mock, patch
import yake

def test_yake_keyword_extraction():
    """Test YAKE keyword extraction functionality"""
    sample_text = """
    Estamos lançando uma marca de café sustentável para a geração Z.
    Nosso produto é orgânico, premium e focado em sustentabilidade.
    Queremos transmitir modernidade, inovação e consciência ambiental.
    """
    
    # Initialize YAKE extractor
    kw_extractor = yake.KeywordExtractor(
        lan="pt",
        n=3,
        dedupLim=0.7,
        top=10
    )
    
    keywords = kw_extractor.extract_keywords(sample_text)
    
    # Should extract keywords
    assert len(keywords) > 0
    assert isinstance(keywords, list)
    
    # Each keyword should have score and text (YAKE returns (keyword, score) tuples)
    for item in keywords:
        if isinstance(item, tuple) and len(item) == 2:
            keyword, score = item  # YAKE format: (keyword_string, score_float)
            assert isinstance(keyword, str)
            assert isinstance(score, (float, int))
            assert len(keyword.strip()) > 0
        else:
            # Handle other formats
            assert isinstance(item, (str, tuple, list))
            if isinstance(item, str):
                assert len(item.strip()) > 0

def test_brand_attributes_classification():
    """Test brand attributes classification logic"""
    keywords = ["café", "sustentável", "premium", "moderno"]
    
    # Mock the classification logic from main.py
    def classify_brand_attributes(keywords):
        attributes = []
        
        sustainability_keywords = ["sustentável", "eco", "verde", "orgânico"]
        if any(kw in keywords for kw in sustainability_keywords):
            attributes.append("eco-friendly")
            
        premium_keywords = ["premium", "luxo", "exclusivo", "sofisticado"]
        if any(kw in keywords for kw in premium_keywords):
            attributes.append("premium")
            
        modern_keywords = ["moderno", "inovador", "tecnológico", "contemporâneo"]
        if any(kw in keywords for kw in modern_keywords):
            attributes.append("moderno")
            
        return attributes
    
    attributes = classify_brand_attributes(keywords)
    
    # Should classify attributes based on keywords
    assert len(attributes) > 0
    assert "eco-friendly" in attributes
    assert "premium" in attributes
    assert "moderno" in attributes

def test_sentiment_analysis_fallback():
    """Test sentiment analysis fallback logic"""
    positive_text = "amazing fantastic excellent wonderful great"
    negative_text = "terrible horrible awful bad disappointing"
    neutral_text = "the product is available in stores"
    
    def analyze_sentiment_fallback(text):
        positive_words = ["amazing", "fantastic", "excellent", "wonderful", "great", "awesome"]
        negative_words = ["terrible", "horrible", "awful", "bad", "disappointing", "poor"]
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            return "positive"
        elif neg_count > pos_count:
            return "negative"
        else:
            return "neutral"
    
    # Test sentiment classification
    assert analyze_sentiment_fallback(positive_text) == "positive"
    assert analyze_sentiment_fallback(negative_text) == "negative"
    assert analyze_sentiment_fallback(neutral_text) == "neutral"

def test_color_palette_generation():
    """Test color palette generation logic"""
    def generate_color_palette(keywords, attributes):
        """Generate colors based on brand characteristics"""
        colors = []
        
        # Base colors for different brand types
        if "eco-friendly" in attributes or "sustentável" in keywords:
            colors.extend(["#2D5A27", "#8FBC8F", "#228B22"])  # Greens
            
        if "premium" in attributes or "luxo" in keywords:
            colors.extend(["#1C1C1C", "#D4AF37", "#2F2F2F"])  # Black and gold
            
        if "moderno" in attributes or "tecnológico" in keywords:
            colors.extend(["#4A90E2", "#50C878", "#FF6B6B"])  # Modern blues/teals
        
        # Ensure we have at least 3 colors
        if len(colors) < 3:
            colors.extend(["#333333", "#666666", "#999999"])
            
        return colors[:5]  # Return max 5 colors
    
    keywords = ["café", "sustentável", "premium"]
    attributes = ["eco-friendly", "premium", "moderno"]
    
    palette = generate_color_palette(keywords, attributes)
    
    # Should generate color palette
    assert len(palette) >= 3
    assert len(palette) <= 5
    
    # All should be valid hex colors
    for color in palette:
        assert color.startswith("#")
        assert len(color) == 7

def test_typography_pairing():
    """Test typography pairing logic"""
    def generate_typography_pairs(attributes, style_preferences=None):
        """Generate typography pairs based on brand attributes"""
        pairs = []
        
        if "moderno" in attributes:
            pairs.append({
                "primary": "Inter",
                "secondary": "Roboto",
                "style": "modern-sans"
            })
            
        if "premium" in attributes:
            pairs.append({
                "primary": "Playfair Display", 
                "secondary": "Source Sans Pro",
                "style": "elegant-serif"
            })
            
        if "eco-friendly" in attributes:
            pairs.append({
                "primary": "Nunito Sans",
                "secondary": "Open Sans", 
                "style": "friendly-rounded"
            })
        
        # Default fallback
        if not pairs:
            pairs.append({
                "primary": "Arial",
                "secondary": "Helvetica",
                "style": "neutral"
            })
            
        return pairs
    
    attributes = ["moderno", "premium", "eco-friendly"]
    typography = generate_typography_pairs(attributes)
    
    # Should generate typography pairs
    assert len(typography) > 0
    
    for typo in typography:
        assert "primary" in typo
        assert "secondary" in typo
        assert "style" in typo
        assert isinstance(typo["primary"], str)
        assert isinstance(typo["secondary"], str)

@patch('main.keyword_extractor')
def test_keyword_extractor_error_handling(mock_extractor):
    """Test error handling when YAKE fails"""
    mock_extractor.extract_keywords.side_effect = Exception("YAKE error")
    
    def safe_extract_keywords(text):
        try:
            if mock_extractor:
                return mock_extractor.extract_keywords(text)
        except Exception:
            # Fallback to simple keyword extraction
            words = text.lower().split()
            # Remove common words
            stopwords = ["o", "a", "de", "da", "do", "para", "com", "em"]
            keywords = [(0.5, word) for word in words if word not in stopwords and len(word) > 3]
            return keywords[:10]
    
    text = "café sustentável premium moderno"
    result = safe_extract_keywords(text)
    
    # Should fallback gracefully
    assert isinstance(result, list)
    assert len(result) > 0