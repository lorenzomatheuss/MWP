import pytest
import os
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import tempfile

# Set test environment variables
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-key"

@pytest.fixture
def client():
    """Test client for FastAPI app"""
    with patch('supabase.create_client') as mock_supabase:
        # Mock Supabase client
        mock_client = Mock()
        mock_supabase.return_value = mock_client
        
        from main import app
        with TestClient(app) as test_client:
            yield test_client

@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    with patch('main.supabase') as mock:
        yield mock

@pytest.fixture
def sample_text():
    """Sample text for testing"""
    return """
    Estamos lançando uma marca de café sustentável para a geração Z.
    Nosso produto é orgânico, premium e focado em sustentabilidade.
    Queremos transmitir modernidade, inovação e consciência ambiental.
    """

@pytest.fixture
def temp_image():
    """Create temporary test image"""
    from PIL import Image
    import io
    
    # Create a test image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes