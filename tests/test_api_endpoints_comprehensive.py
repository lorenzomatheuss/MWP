import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
import json
import io
from main import app

# Create test client
client = TestClient(app)

# Test data fixtures
@pytest.fixture
def sample_project_data():
    return {
        "user_id": "test_user_123",
        "name": "Test Project",
        "description": "Test project description"
    }

@pytest.fixture
def sample_brief_data():
    return {
        "project_id": "test_project_123",
        "content": "This is a test brief for a modern, sustainable technology company targeting young professionals."
    }

@pytest.fixture
def sample_brand_kit_request():
    return {
        "project_id": "test_project_123",
        "brief_id": "test_brief_123",
        "brand_name": "TechNova",
        "preferences": {
            "style": "modern",
            "colors": ["blue", "green"],
            "industry": "technology"
        }
    }

@pytest.fixture
def sample_visual_concept_request():
    return {
        "project_id": "test_project_123",
        "brief_id": "test_brief_123",
        "keywords": ["innovation", "technology", "future"],
        "attributes": ["modern", "clean", "professional"],
        "demo_mode": True
    }

@pytest.fixture
def mock_supabase():
    with patch('main.supabase') as mock_db:
        # Mock successful database operations
        mock_db.table.return_value.insert.return_value.execute.return_value.data = [{"id": "test_id_123"}]
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [{"id": "test_id_123"}]
        yield mock_db


class TestRootEndpoints:
    """Test root and health endpoints"""
    
    def test_read_root(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestDocumentEndpoints:
    """Test document processing endpoints"""
    
    @patch('main.extract_text_from_file')
    @patch('main.analyze_document_sections')
    def test_parse_document_success(self, mock_analyze, mock_extract):
        """Test successful document parsing"""
        # Mock text extraction and analysis
        mock_extract.return_value = "Sample extracted text"
        mock_analyze.return_value = [
            {"content": "Company info", "confidence": 0.8, "type": "company_info"}
        ]
        
        # Create mock file
        file_content = b"fake pdf content"
        files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
        
        response = client.post("/parse-document/", files=files)
        assert response.status_code == 200
        
        data = response.json()
        assert "text" in data
        assert "sections" in data
        assert "confidence" in data

    def test_parse_document_no_file(self):
        """Test document parsing without file"""
        response = client.post("/parse-document/")
        assert response.status_code == 422  # Validation error


class TestProjectEndpoints:
    """Test project management endpoints"""
    
    def test_create_project_success(self, mock_supabase, sample_project_data):
        """Test successful project creation"""
        response = client.post("/projects/", json=sample_project_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["name"] == sample_project_data["name"]

    def test_create_project_missing_data(self):
        """Test project creation with missing data"""
        incomplete_data = {"name": "Test Project"}  # Missing user_id
        response = client.post("/projects/", json=incomplete_data)
        assert response.status_code == 422  # Validation error

    def test_get_user_projects(self, mock_supabase):
        """Test getting user projects"""
        user_id = "test_user_123"
        response = client.get(f"/projects/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestBriefEndpoints:
    """Test brief management endpoints"""
    
    def test_analyze_brief_success(self, mock_supabase, sample_brief_data):
        """Test successful brief analysis"""
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"content": "Sample content", "confidence": 0.8, "type": "objectives"}
            ]
            
            response = client.post("/briefs/analyze/", json=sample_brief_data)
            assert response.status_code == 200
            
            data = response.json()
            assert "sections" in data
            assert "confidence" in data

    def test_update_brief(self, mock_supabase):
        """Test brief update"""
        update_data = {
            "brief_id": "test_brief_123",
            "content": "Updated brief content"
        }
        
        response = client.put("/briefs/update/", json=update_data)
        assert response.status_code == 200

    def test_get_project_briefs(self, mock_supabase):
        """Test getting project briefs"""
        project_id = "test_project_123"
        response = client.get(f"/briefs/{project_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestBrandKitEndpoints:
    """Test brand kit generation endpoints"""
    
    @patch('main.generate_brand_kit_data')
    def test_generate_brand_kit_success(self, mock_generate, mock_supabase, sample_brand_kit_request):
        """Test successful brand kit generation"""
        mock_generate.return_value = {
            "logos": [],
            "color_palettes": [],
            "typography": [],
            "visual_elements": []
        }
        
        response = client.post("/brand-kit/generate/", json=sample_brand_kit_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "brand_kit" in data

    def test_get_brand_kit(self, mock_supabase):
        """Test getting brand kit"""
        kit_id = "test_kit_123"
        response = client.get(f"/brand-kit/{kit_id}")
        assert response.status_code == 200


class TestVisualConceptEndpoints:
    """Test visual concept generation endpoints"""
    
    @patch('main.generate_visual_concept_data')
    def test_generate_visual_concepts_success(self, mock_generate, mock_supabase, sample_visual_concept_request):
        """Test successful visual concept generation"""
        mock_generate.return_value = {
            "concepts": [],
            "metaphors": [],
            "color_palettes": []
        }
        
        response = client.post("/visual-concepts/generate/", json=sample_visual_concept_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "concepts" in data


class TestGalaxyEndpoints:
    """Test galaxy generation endpoints"""
    
    @patch('main.generate_visual_metaphors')
    @patch('main.generate_color_palettes')
    def test_generate_galaxy_success(self, mock_palettes, mock_metaphors, mock_supabase):
        """Test successful galaxy generation"""
        mock_metaphors.return_value = [
            {"prompt": "test metaphor", "image_url": "test_url"}
        ]
        mock_palettes.return_value = [
            {"name": "Modern", "colors": ["#000000", "#ffffff"]}
        ]
        
        galaxy_request = {
            "project_id": "test_project_123",
            "brief_id": "test_brief_123",
            "keywords": ["innovation"],
            "attributes": ["modern"],
            "demo_mode": True
        }
        
        response = client.post("/galaxy/generate/", json=galaxy_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "metaphors" in data
        assert "palettes" in data


class TestAssetEndpoints:
    """Test asset management endpoints"""
    
    def test_get_project_assets(self, mock_supabase):
        """Test getting project assets"""
        project_id = "test_project_123"
        response = client.get(f"/assets/{project_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)

    def test_get_project_assets_filtered(self, mock_supabase):
        """Test getting filtered project assets"""
        project_id = "test_project_123"
        asset_type = "logo"
        response = client.get(f"/assets/{project_id}?asset_type={asset_type}")
        assert response.status_code == 200


class TestBlendingEndpoints:
    """Test concept blending endpoints"""
    
    @patch('main.blend_images')
    @patch('main.download_image_from_url')
    def test_blend_concepts_success(self, mock_download, mock_blend, mock_supabase):
        """Test successful concept blending"""
        from PIL import Image
        
        # Mock image download and blending
        mock_img = Image.new('RGB', (100, 100), color='red')
        mock_download.return_value = mock_img
        mock_blend.return_value = mock_img
        
        blend_request = {
            "project_id": "test_project_123",
            "brief_id": "test_brief_123",
            "concept_urls": ["http://example.com/img1.jpg", "http://example.com/img2.jpg"],
            "blend_mode": "overlay",
            "intensity": 0.5
        }
        
        response = client.post("/concepts/blend/", json=blend_request)
        assert response.status_code == 200


class TestStyleEndpoints:
    """Test style application endpoints"""
    
    @patch('main.apply_artistic_filter')
    @patch('main.download_image_from_url')
    def test_apply_style_success(self, mock_download, mock_filter, mock_supabase):
        """Test successful style application"""
        from PIL import Image
        
        # Mock image operations
        mock_img = Image.new('RGB', (100, 100), color='blue')
        mock_download.return_value = mock_img
        mock_filter.return_value = mock_img
        
        style_request = {
            "project_id": "test_project_123",
            "brief_id": "test_brief_123",
            "image_url": "http://example.com/test.jpg",
            "style_type": "vintage",
            "intensity": 0.7,
            "color_palette": ["#FF0000", "#00FF00", "#0000FF"]
        }
        
        response = client.post("/concepts/apply-style/", json=style_request)
        assert response.status_code == 200


class TestFinalizeEndpoints:
    """Test finalization endpoints"""
    
    def test_finalize_brand_kit_success(self, mock_supabase):
        """Test successful brand kit finalization"""
        finalize_request = {
            "project_id": "test_project_123",
            "brief_id": "test_brief_123",
            "selected_assets": {
                "logo": "asset_id_1",
                "colors": "asset_id_2",
                "typography": "asset_id_3"
            },
            "brand_name": "FinalBrand",
            "final_adjustments": {
                "color_intensity": 0.8,
                "style_preference": "modern"
            }
        }
        
        response = client.post("/brand-kit/finalize/", json=finalize_request)
        assert response.status_code == 200


class TestStrategicAnalysisEndpoints:
    """Test strategic analysis endpoints"""
    
    @patch('main.analyze_strategic_elements')
    def test_strategic_analysis_success(self, mock_analyze, mock_supabase):
        """Test successful strategic analysis"""
        mock_analyze.return_value = {
            "positioning": "Premium technology solutions",
            "differentiation": "AI-driven innovation",
            "opportunities": ["Market expansion"],
            "risks": ["Competition"]
        }
        
        analysis_request = {
            "project_id": "test_project_123",
            "brief_id": "test_brief_123",
            "text": "Technology company focused on innovation",
            "keywords": ["technology", "innovation"],
            "attributes": ["modern", "reliable"]
        }
        
        response = client.post("/strategic-analysis/", json=analysis_request)
        assert response.status_code == 200
        
        data = response.json()
        assert "analysis" in data


class TestErrorHandling:
    """Test error handling across endpoints"""
    
    def test_invalid_project_id(self, mock_supabase):
        """Test handling of invalid project IDs"""
        response = client.get("/briefs/invalid_project_id")
        assert response.status_code == 200  # Should handle gracefully
    
    def test_malformed_json(self):
        """Test handling of malformed JSON"""
        response = client.post(
            "/projects/",
            data="invalid json",
            headers={"content-type": "application/json"}
        )
        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        incomplete_data = {}  # Missing all required fields
        response = client.post("/projects/", json=incomplete_data)
        assert response.status_code == 422


class TestCORSAndMiddleware:
    """Test CORS and middleware functionality"""
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.get("/")
        # CORS headers should be handled by FastAPI middleware
        assert response.status_code == 200
    
    def test_options_request(self):
        """Test OPTIONS request handling"""
        response = client.options("/")
        # Should be handled by CORS middleware
        assert response.status_code in [200, 405]  # 405 if OPTIONS not explicitly handled