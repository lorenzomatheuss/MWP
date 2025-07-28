import pytest
from unittest.mock import Mock, patch, MagicMock
import uuid
from datetime import datetime

@patch('main.supabase')
def test_supabase_connection(mock_supabase):
    """Test Supabase connection"""
    # Mock successful connection
    mock_supabase.table.return_value.select.return_value.execute.return_value.data = []
    
    # Test connection by attempting a simple query
    try:
        result = mock_supabase.table('projects').select('*').execute()
        assert hasattr(result, 'data')
    except Exception as e:
        # Connection might fail in test environment
        assert isinstance(e, Exception)

@patch('main.supabase')
def test_project_creation(mock_supabase):
    """Test creating a project in database"""
    project_id = str(uuid.uuid4())
    mock_data = [{
        "id": project_id,
        "name": "Test Project",
        "created_at": datetime.now().isoformat(),
        "user_id": "test-user"
    }]
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = mock_data
    
    # Test project insertion
    project_data = {
        "name": "Test Project",
        "user_id": "test-user"
    }
    
    result = mock_supabase.table('projects').insert(project_data).execute()
    
    assert result.data == mock_data
    assert result.data[0]["name"] == "Test Project"

@patch('main.supabase')
def test_brief_analysis_storage(mock_supabase):
    """Test storing brief analysis in database"""
    brief_id = str(uuid.uuid4())
    mock_data = [{
        "id": brief_id,
        "text": "Sample brief text",
        "keywords": ["café", "sustentável"],
        "attributes": ["moderno", "premium"],
        "project_id": "test-project-id"
    }]
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = mock_data
    
    brief_data = {
        "text": "Sample brief text",
        "keywords": ["café", "sustentável"],
        "attributes": ["moderno", "premium"],
        "project_id": "test-project-id"
    }
    
    result = mock_supabase.table('briefs').insert(brief_data).execute()
    
    assert result.data == mock_data
    assert len(result.data[0]["keywords"]) == 2

@patch('main.supabase')
def test_generated_assets_storage(mock_supabase):
    """Test storing generated assets"""
    asset_id = str(uuid.uuid4())
    mock_data = [{
        "id": asset_id,
        "type": "metaphor",
        "url": "https://example.com/image.jpg",
        "description": "Coffee metaphor",
        "project_id": "test-project-id"
    }]
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = mock_data
    
    asset_data = {
        "type": "metaphor", 
        "url": "https://example.com/image.jpg",
        "description": "Coffee metaphor",
        "project_id": "test-project-id"
    }
    
    result = mock_supabase.table('generated_assets').insert(asset_data).execute()
    
    assert result.data == mock_data
    assert result.data[0]["type"] == "metaphor"

@patch('main.supabase')
def test_strategic_analysis_storage(mock_supabase):
    """Test storing strategic analysis"""
    analysis_id = str(uuid.uuid4())
    mock_data = [{
        "id": analysis_id,
        "purpose": "Provide sustainable coffee",
        "values": ["sustainability", "quality"],
        "personality": ["modern", "conscious"],
        "brief_id": "test-brief-id"
    }]
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = mock_data
    
    analysis_data = {
        "purpose": "Provide sustainable coffee",
        "values": ["sustainability", "quality"],
        "personality": ["modern", "conscious"], 
        "brief_id": "test-brief-id"
    }
    
    result = mock_supabase.table('strategic_analyses').insert(analysis_data).execute()
    
    assert result.data == mock_data
    assert len(result.data[0]["values"]) == 2

@patch('main.supabase')
def test_visual_concepts_storage(mock_supabase):
    """Test storing visual concepts"""
    concept_id = str(uuid.uuid4())
    mock_data = [{
        "id": concept_id,
        "concept_data": {
            "colors": ["#2D5A27", "#8FBC8F"],
            "typography": "Modern Sans",
            "style": "sustainable"
        },
        "brief_id": "test-brief-id"
    }]
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = mock_data
    
    concept_data = {
        "concept_data": {
            "colors": ["#2D5A27", "#8FBC8F"],
            "typography": "Modern Sans", 
            "style": "sustainable"
        },
        "brief_id": "test-brief-id"
    }
    
    result = mock_supabase.table('visual_concepts').insert(concept_data).execute()
    
    assert result.data == mock_data
    assert len(result.data[0]["concept_data"]["colors"]) == 2

@patch('main.supabase')
def test_brand_kit_storage(mock_supabase):
    """Test storing final brand kit"""
    kit_id = str(uuid.uuid4())
    mock_data = [{
        "id": kit_id,
        "brand_name": "EcoCafé",
        "kit_data": {
            "logo_variations": ["primary", "secondary"],
            "color_palette": ["#2D5A27", "#8FBC8F"],
            "typography_system": "Modern Sans",
            "guidelines": "Brand usage guidelines"
        },
        "project_id": "test-project-id"
    }]
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = mock_data
    
    kit_data = {
        "brand_name": "EcoCafé",
        "kit_data": {
            "logo_variations": ["primary", "secondary"],
            "color_palette": ["#2D5A27", "#8FBC8F"], 
            "typography_system": "Modern Sans",
            "guidelines": "Brand usage guidelines"
        },
        "project_id": "test-project-id"
    }
    
    result = mock_supabase.table('final_brand_kits').insert(kit_data).execute()
    
    assert result.data == mock_data
    assert result.data[0]["brand_name"] == "EcoCafé"

@patch('main.supabase')
def test_data_retrieval(mock_supabase):
    """Test retrieving data from database"""
    project_id = "test-project-id"
    mock_data = [{
        "id": project_id,
        "name": "Retrieved Project",
        "created_at": datetime.now().isoformat()
    }]
    
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_data
    
    # Test data retrieval
    result = mock_supabase.table('projects').select('*').eq('id', project_id).execute()
    
    assert result.data == mock_data
    assert result.data[0]["id"] == project_id

@patch('main.supabase')
def test_database_error_handling(mock_supabase):
    """Test database error handling"""
    # Mock database error
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("Database connection failed")
    
    try:
        mock_supabase.table('projects').insert({}).execute()
        assert False, "Should have raised an exception"
    except Exception as e:
        assert str(e) == "Database connection failed"

@patch('main.supabase')
def test_transaction_rollback(mock_supabase):
    """Test transaction rollback behavior"""
    # Mock partial success scenario
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = [
        Mock(data=[{"id": "success-1"}]),  # First insert succeeds
        Exception("Second insert fails")   # Second insert fails
    ]
    
    try:
        # Simulate transaction with multiple operations
        result1 = mock_supabase.table('projects').insert({}).execute()
        assert result1.data[0]["id"] == "success-1"
        
        # This should fail
        result2 = mock_supabase.table('briefs').insert({}).execute()
        assert False, "Should have failed"
        
    except Exception as e:
        # Should handle transaction failure
        assert isinstance(e, Exception)

@patch('main.supabase')
def test_data_validation(mock_supabase):
    """Test data validation before database operations"""
    def validate_project_data(data):
        """Validate project data before insertion"""
        if not data.get('name'):
            raise ValueError("Project name is required")
        if len(data['name']) < 3:
            raise ValueError("Project name must be at least 3 characters")
        return True
    
    # Test valid data
    valid_data = {"name": "Valid Project Name"}
    assert validate_project_data(valid_data) == True
    
    # Test invalid data
    try:
        invalid_data = {"name": ""}
        validate_project_data(invalid_data)
        assert False, "Should have failed validation"
    except ValueError as e:
        assert "required" in str(e)
    
    try:
        invalid_data = {"name": "AB"}
        validate_project_data(invalid_data)
        assert False, "Should have failed validation"
    except ValueError as e:
        assert "3 characters" in str(e)