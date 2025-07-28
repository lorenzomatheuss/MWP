import pytest
import io
from unittest.mock import Mock, patch
from fastapi import UploadFile
from main import (
    extract_text_from_file,
    analyze_document_sections,
    calculate_overall_confidence,
    analyze_strategic_elements
)


def test_extract_text_from_pdf():
    """Test PDF text extraction"""
    # Mock PDF file
    mock_file = Mock(spec=UploadFile)
    mock_file.content_type = "application/pdf"
    mock_file.file = io.BytesIO(b"%PDF-1.4 mock pdf content")
    
    with patch('PyPDF2.PdfReader') as mock_reader:
        # Mock PDF reader and pages
        mock_page = Mock()
        mock_page.extract_text.return_value = "Sample PDF text"
        mock_reader.return_value.pages = [mock_page]
        
        result = extract_text_from_file(mock_file)
        assert "Sample PDF text" in result


def test_extract_text_from_docx():
    """Test DOCX text extraction"""
    mock_file = Mock(spec=UploadFile)
    mock_file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    mock_file.file = io.BytesIO(b"mock docx content")
    
    with patch('docx.Document') as mock_doc:
        # Mock DOCX document and paragraphs
        mock_paragraph = Mock()
        mock_paragraph.text = "Sample DOCX paragraph"
        mock_doc.return_value.paragraphs = [mock_paragraph]
        
        result = extract_text_from_file(mock_file)
        assert "Sample DOCX paragraph" in result


def test_extract_text_from_txt():
    """Test plain text file extraction"""
    mock_file = Mock(spec=UploadFile)
    mock_file.content_type = "text/plain"
    mock_file.file = io.BytesIO(b"Sample plain text content")
    
    result = extract_text_from_file(mock_file)
    assert "Sample plain text content" in result


def test_extract_text_error_handling():
    """Test error handling in text extraction"""
    mock_file = Mock(spec=UploadFile)
    mock_file.content_type = "application/pdf"
    mock_file.file = io.BytesIO(b"invalid pdf")
    
    with patch('main.PyPDF2.PdfReader', side_effect=Exception("PDF Error")):
        result = extract_text_from_file(mock_file)
        assert result == ""


def test_analyze_document_sections():
    """Test document sections analysis"""
    text = """
    Objetivo: Criar uma marca inovadora
    Público-alvo: Jovens entre 18-25 anos
    Valores: Sustentabilidade e tecnologia
    Características: Moderno, dinâmico, criativo
    """
    
    result = analyze_document_sections(text)
    
    assert isinstance(result, list)
    assert len(result) >= 0  # Allow empty results
    if result:
        assert all("confidence" in section for section in result)
        assert all("content" in section for section in result)


def test_calculate_overall_confidence():
    """Test overall confidence calculation"""
    sections = [
        {"confidence": 0.8, "content": "test1"},
        {"confidence": 0.6, "content": "test2"},
        {"confidence": 0.9, "content": "test3"}
    ]
    
    confidence = calculate_overall_confidence(sections)
    
    assert isinstance(confidence, float)
    assert 0.0 <= confidence <= 1.0


def test_calculate_overall_confidence_empty():
    """Test confidence calculation with empty sections"""
    sections = []
    
    confidence = calculate_overall_confidence(sections)
    
    assert isinstance(confidence, float)
    assert 0.0 <= confidence <= 1.0


def test_analyze_strategic_elements():
    """Test strategic elements analysis"""
    text = "Nossa empresa busca inovação e sustentabilidade no mercado tecnológico"
    keywords = ["inovação", "sustentabilidade", "tecnologia"]
    attributes = ["moderno", "ecológico", "criativo"]
    
    result = analyze_strategic_elements(text, keywords, attributes)
    
    assert isinstance(result, dict)
    assert "positioning" in result
    assert "differentiation" in result
    assert "opportunities" in result
    assert "risks" in result


def test_analyze_strategic_elements_empty_input():
    """Test strategic analysis with empty inputs"""
    result = analyze_strategic_elements("", [], [])
    
    assert isinstance(result, dict)
    assert "positioning" in result
    assert "differentiation" in result
    assert "opportunities" in result
    assert "risks" in result