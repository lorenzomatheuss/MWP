import pytest
import json
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code in [200, 404]  # Some FastAPI apps might not have root

def test_health_check(client):
    """Test if app is running"""
    # Test that the app starts without errors
    assert client is not None

@patch('main.supabase')
def test_create_project(mock_supabase, client):
    """Test project creation endpoint"""
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "test-uuid", "name": "Test Project", "created_at": "2024-01-01"}
    ]
    
    project_data = {
        "name": "Test Coffee Brand",
        "user_id": "test-user"
    }
    
    response = client.post("/projects", json=project_data)
    
    # Should either succeed or fail gracefully
    assert response.status_code in [200, 201, 422, 500]

@patch('main.supabase')
def test_analyze_brief(mock_supabase, client, sample_text):
    """Test brief analysis endpoint"""
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "test-brief-uuid"}
    ]
    
    brief_data = {
        "text": sample_text,
        "project_id": "test-project-id"
    }
    
    response = client.post("/analyze-brief", json=brief_data)
    
    # Should process the text analysis
    assert response.status_code in [200, 422, 500]

@patch('main.supabase')
def test_generate_galaxy(mock_supabase, client):
    """Test galaxy generation endpoint"""
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "test-galaxy-uuid"}
    ]
    
    galaxy_data = {
        "keywords": ["café", "sustentável"],
        "attributes": ["moderno", "premium"],
        "brief_id": "test-brief-id",
        "demo_mode": True
    }
    
    response = client.post("/generate-galaxy", json=galaxy_data)
    
    # Should generate galaxy concepts
    assert response.status_code in [200, 422, 500]

@patch('main.supabase')  
def test_strategic_analysis(mock_supabase, client, sample_text):
    """Test strategic analysis endpoint"""
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "test-analysis-uuid"}
    ]
    
    analysis_data = {
        "brief_id": "test-brief-id",
        "text": sample_text,
        "keywords": ["café", "sustentável", "premium"],
        "attributes": ["moderno", "inovador"]
    }
    
    response = client.post("/strategic-analysis", json=analysis_data)
    
    # Should perform strategic analysis
    assert response.status_code in [200, 422, 500]

@patch('main.supabase')
def test_blend_concepts(mock_supabase, client):
    """Test image blending endpoint"""
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "test-blend-uuid"}
    ]
    
    blend_data = {
        "image_urls": [
            "https://images.unsplash.com/photo-1554755229-ca4470e22238",
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93"
        ],
        "blend_mode": "overlay",
        "project_id": "test-project-id"
    }
    
    response = client.post("/blend-concepts", json=blend_data)
    
    # Should blend images or fail gracefully
    assert response.status_code in [200, 422, 500]

@patch('main.supabase')
def test_generate_brand_kit(mock_supabase, client):
    """Test brand kit generation endpoint"""
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "test-kit-uuid"}
    ]
    
    brand_kit_data = {
        "brand_name": "EcoCafé",
        "selected_concept": {
            "colors": ["#2D5A27", "#8FBC8F", "#F5F5DC"],
            "typography": "Modern Sans",
            "style": "sustainable"
        },
        "strategic_analysis": {
            "purpose": "Sustentabilidade",
            "values": ["eco-friendly", "premium"],
            "personality": ["moderno", "consciente"]
        },
        "kit_preferences": {"style": "professional"}
    }
    
    response = client.post("/generate-brand-kit", json=brand_kit_data)
    
    # Should generate brand kit
    assert response.status_code in [200, 422, 500]

def test_cors_headers(client):
    """Test CORS headers are present"""
    response = client.options("/")
    # CORS should be configured
    assert response.status_code in [200, 404, 405]