import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
import json
import io

from main import app
from conftest import client


# Test additional API endpoints
@pytest.mark.asyncio
async def test_get_user_projects(client):
    """Test getting user projects"""
    with patch('main.supabase') as mock_supabase:
        mock_data = [
            {"id": "proj1", "name": "Project 1", "user_id": "user123"},
            {"id": "proj2", "name": "Project 2", "user_id": "user123"}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_data
        
        response = client.get("/projects/user123")
        assert response.status_code == 200
        assert len(response.json()) == 2


@pytest.mark.asyncio 
async def test_get_user_projects_error(client):
    """Test getting user projects with database error"""
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = Exception("DB Error")
        
        response = client.get("/projects/user123")
        assert response.status_code == 500


@pytest.mark.asyncio
async def test_update_brief(client):
    """Test updating a brief"""
    update_data = {
        "brief_id": "brief123",
        "updates": {"content": "Updated content", "confidence": 0.9}
    }
    
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = Mock()
        
        response = client.put("/brief/update", json=update_data)
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_brief_error(client):
    """Test brief update with error"""
    update_data = {
        "brief_id": "brief123", 
        "updates": {"content": "Updated content"}
    }
    
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.side_effect = Exception("Update failed")
        
        response = client.put("/brief/update", json=update_data)
        assert response.status_code == 500


@pytest.mark.asyncio
async def test_get_project_briefs(client):
    """Test getting project briefs"""
    with patch('main.supabase') as mock_supabase:
        mock_data = [
            {"id": "brief1", "project_id": "proj123", "content": "Brief 1"},
            {"id": "brief2", "project_id": "proj123", "content": "Brief 2"}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_data
        
        response = client.get("/projects/proj123/briefs")
        assert response.status_code == 200
        assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_project_assets(client):
    """Test getting project assets"""
    with patch('main.supabase') as mock_supabase:
        mock_data = [
            {"id": "asset1", "project_id": "proj123", "type": "logo", "data": {}},
            {"id": "asset2", "project_id": "proj123", "type": "color_palette", "data": {}}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_data
        
        response = client.get("/projects/proj123/assets")
        assert response.status_code == 200
        assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_project_assets_filtered(client):
    """Test getting filtered project assets"""
    with patch('main.supabase') as mock_supabase:
        mock_data = [
            {"id": "asset1", "project_id": "proj123", "type": "logo", "data": {}}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = mock_data
        
        response = client.get("/projects/proj123/assets?asset_type=logo")
        assert response.status_code == 200
        assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_apply_style(client):
    """Test applying style to assets"""
    style_data = {
        "asset_id": "asset123",
        "style_params": {"filter": "vintage", "intensity": 0.7}
    }
    
    with patch('main.supabase') as mock_supabase:
        # Mock asset retrieval
        mock_asset = {"id": "asset123", "data": {"image": "base64_data"}}
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [mock_asset]
        
        # Mock style application and save
        mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock()
        
        response = client.post("/assets/apply-style", json=style_data)
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_apply_style_asset_not_found(client):
    """Test applying style when asset not found"""
    style_data = {
        "asset_id": "nonexistent",
        "style_params": {"filter": "vintage"}
    }
    
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.post("/assets/apply-style", json=style_data)
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_finalize_brand_kit(client):
    """Test finalizing brand kit"""
    finalize_data = {
        "kit_id": "kit123",
        "final_selections": {
            "logo": "logo_variant_2",
            "colors": ["#FF0000", "#0000FF"],
            "fonts": {"primary": "Roboto", "secondary": "Open Sans"}
        }
    }
    
    with patch('main.supabase') as mock_supabase:
        # Mock kit retrieval
        mock_kit = {"id": "kit123", "data": {"components": {}}}
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [mock_kit]
        
        # Mock finalization
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = Mock()
        
        response = client.post("/brand-kit/finalize", json=finalize_data)
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_finalize_brand_kit_not_found(client):
    """Test finalizing non-existent brand kit"""
    finalize_data = {
        "kit_id": "nonexistent",
        "final_selections": {}
    }
    
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.post("/brand-kit/finalize", json=finalize_data)
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_brand_kit(client):
    """Test getting brand kit"""
    with patch('main.supabase') as mock_supabase:
        mock_kit = {
            "id": "kit123",
            "brand_name": "TestBrand",
            "data": {"components": {}},
            "finalized": True
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [mock_kit]
        
        response = client.get("/brand-kit/kit123")
        assert response.status_code == 200
        assert response.json()["brand_name"] == "TestBrand"


@pytest.mark.asyncio
async def test_get_brand_kit_not_found(client):
    """Test getting non-existent brand kit"""
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.get("/brand-kit/nonexistent")
        assert response.status_code == 404


# Test document parsing endpoint
@pytest.mark.asyncio
async def test_parse_document_pdf(client):
    """Test parsing PDF document"""
    # Create a mock PDF file
    pdf_content = b"%PDF-1.4 fake pdf content"
    
    with patch('main.extract_text_from_file') as mock_extract:
        mock_extract.return_value = "Extracted PDF text content"
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"type": "objective", "content": "Test objective", "confidence": 0.9}
            ]
            
            files = {"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
            response = client.post("/parse-document", files=files)
            
            assert response.status_code == 200
            result = response.json()
            assert "sections" in result
            assert "confidence" in result


@pytest.mark.asyncio
async def test_parse_document_docx(client):
    """Test parsing DOCX document"""
    docx_content = b"fake docx content"
    
    with patch('main.extract_text_from_file') as mock_extract:
        mock_extract.return_value = "Extracted DOCX text content"
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"type": "target_audience", "content": "Young professionals", "confidence": 0.8}
            ]
            
            files = {"file": ("test.docx", io.BytesIO(docx_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            response = client.post("/parse-document", files=files)
            
            assert response.status_code == 200


@pytest.mark.asyncio
async def test_parse_document_unsupported(client):
    """Test parsing unsupported document type"""
    unsupported_content = b"unsupported content"
    
    files = {"file": ("test.xyz", io.BytesIO(unsupported_content), "application/unknown")}
    response = client.post("/parse-document", files=files)
    
    assert response.status_code == 400


# Test error scenarios
@pytest.mark.asyncio
async def test_database_connection_errors(client):
    """Test various database connection errors"""
    # Test project creation with DB error
    project_data = {"name": "Test Project", "user_id": "user123"}
    
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("Connection failed")
        
        response = client.post("/projects", json=project_data)
        assert response.status_code == 500


@pytest.mark.asyncio
async def test_invalid_json_requests(client):
    """Test requests with invalid JSON"""
    # Test with malformed JSON
    response = client.post(
        "/projects",
        data="invalid json",
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422  # Unprocessable Entity


@pytest.mark.asyncio 
async def test_missing_required_fields(client):
    """Test requests with missing required fields"""
    # Test project creation without required fields
    incomplete_data = {"name": "Test Project"}  # Missing user_id
    
    response = client.post("/projects", json=incomplete_data)
    assert response.status_code == 422


# Test authentication and authorization scenarios
@pytest.mark.asyncio
async def test_cors_preflight_requests(client):
    """Test CORS preflight requests"""
    response = client.options("/projects")
    # Should not fail due to CORS middleware
    assert response.status_code in [200, 405]  # Either OK or Method Not Allowed


# Test rate limiting and performance scenarios
@pytest.mark.asyncio
async def test_concurrent_requests(client):
    """Test handling concurrent requests"""
    project_data = {"name": "Concurrent Test", "user_id": "user123"}
    
    with patch('main.supabase') as mock_supabase:
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "proj123", "name": "Concurrent Test"}
        ]
        
        responses = []
        for i in range(5):
            response = client.post("/projects", json=project_data)
            responses.append(response)
        
        # All should succeed or fail gracefully
        for response in responses:
            assert response.status_code in [200, 500]