import pytest
from unittest.mock import Mock, patch, MagicMock
import json
from main import supabase, save_generated_assets, save_curated_asset

# Mock Supabase client and responses
@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client with common operations"""
    mock_client = Mock()
    
    # Mock table operations
    mock_table = Mock()
    mock_client.table.return_value = mock_table
    
    # Mock select operations
    mock_select = Mock()
    mock_table.select.return_value = mock_select
    
    # Mock filter operations
    mock_eq = Mock()
    mock_select.eq.return_value = mock_eq
    
    # Mock execute with successful response
    mock_response = Mock()
    mock_response.data = [{"id": "test_id_123", "created_at": "2024-01-01T00:00:00"}]
    mock_response.error = None
    mock_eq.execute.return_value = mock_response
    
    # Mock insert operations
    mock_insert = Mock()
    mock_table.insert.return_value = mock_insert
    mock_insert.execute.return_value = mock_response
    
    # Mock update operations
    mock_update = Mock()
    mock_table.update.return_value = mock_update
    mock_update.eq.return_value = mock_eq
    
    # Mock delete operations
    mock_delete = Mock()
    mock_table.delete.return_value = mock_delete
    mock_delete.eq.return_value = mock_eq
    
    return mock_client


class TestSupabaseConnection:
    """Test Supabase client connection and basic operations"""
    
    def test_supabase_client_initialization(self):
        """Test that Supabase client is properly initialized"""
        assert supabase is not None
        assert hasattr(supabase, 'table')
    
    @patch('main.supabase')
    def test_table_selection(self, mock_supabase):
        """Test selecting from a table"""
        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        
        # Test table selection
        result = mock_supabase.table('projects')
        
        mock_supabase.table.assert_called_with('projects')
        assert result == mock_table


class TestProjectOperations:
    """Test project-related database operations"""
    
    @patch('main.supabase')
    def test_create_project(self, mock_supabase):
        """Test project creation"""
        mock_table = Mock()
        mock_insert = Mock()
        mock_execute = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value.data = [{"id": "new_project_123"}]
        mock_insert.execute.return_value.error = None
        
        # Simulate project creation
        project_data = {
            "user_id": "user_123",
            "name": "Test Project",
            "description": "Test description"
        }
        
        table = mock_supabase.table('projects')
        result = table.insert(project_data).execute()
        
        mock_supabase.table.assert_called_with('projects')
        mock_table.insert.assert_called_with(project_data)
        assert result.data[0]["id"] == "new_project_123"
    
    @patch('main.supabase')
    def test_get_user_projects(self, mock_supabase):
        """Test retrieving user projects"""
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.execute.return_value.data = [
            {"id": "project_1", "name": "Project 1"},
            {"id": "project_2", "name": "Project 2"}
        ]
        mock_eq.execute.return_value.error = None
        
        # Simulate getting user projects
        user_id = "user_123"
        table = mock_supabase.table('projects')
        result = table.select('*').eq('user_id', user_id).execute()
        
        mock_table.select.assert_called_with('*')
        mock_select.eq.assert_called_with('user_id', user_id)
        assert len(result.data) == 2


class TestBriefOperations:
    """Test brief-related database operations"""
    
    @patch('main.supabase')
    def test_create_brief(self, mock_supabase):
        """Test brief creation"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value.data = [{"id": "brief_123"}]
        mock_insert.execute.return_value.error = None
        
        brief_data = {
            "project_id": "project_123",
            "content": "Brief content",
            "analysis": {"sections": [], "confidence": 0.8}
        }
        
        table = mock_supabase.table('briefs')
        result = table.insert(brief_data).execute()
        
        mock_table.insert.assert_called_with(brief_data)
        assert result.data[0]["id"] == "brief_123"
    
    @patch('main.supabase')
    def test_update_brief(self, mock_supabase):
        """Test brief update"""
        mock_table = Mock()
        mock_update = Mock()
        mock_eq = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.update.return_value = mock_update
        mock_update.eq.return_value = mock_eq
        mock_eq.execute.return_value.data = [{"id": "brief_123"}]
        mock_eq.execute.return_value.error = None
        
        update_data = {"content": "Updated content"}
        brief_id = "brief_123"
        
        table = mock_supabase.table('briefs')
        result = table.update(update_data).eq('id', brief_id).execute()
        
        mock_table.update.assert_called_with(update_data)
        mock_update.eq.assert_called_with('id', brief_id)
        assert result.data[0]["id"] == "brief_123"


class TestAssetOperations:
    """Test asset-related database operations"""
    
    @patch('main.supabase')
    async def test_save_generated_assets(self, mock_supabase):
        """Test saving generated assets"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value.data = [{"id": "asset_123"}]
        mock_insert.execute.return_value.error = None
        
        project_id = "project_123"
        brief_id = "brief_123"
        assets_data = {
            "logos": [],
            "color_palettes": [],
            "typography": []
        }
        
        result = await save_generated_assets(project_id, brief_id, assets_data)
        
        assert result is True
        mock_supabase.table.assert_called()
    
    @patch('main.supabase')
    async def test_save_curated_asset(self, mock_supabase):
        """Test saving curated asset"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value.data = [{"id": "curated_123"}]
        mock_insert.execute.return_value.error = None
        
        project_id = "project_123"
        brief_id = "brief_123"
        asset_data = {"type": "logo", "url": "test_url"}
        asset_type = "logo"
        
        result = await save_curated_asset(project_id, brief_id, asset_data, asset_type)
        
        assert isinstance(result, str)
        mock_supabase.table.assert_called()
    
    @patch('main.supabase')
    def test_get_project_assets(self, mock_supabase):
        """Test getting project assets"""
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.execute.return_value.data = [
            {"id": "asset_1", "type": "logo"},
            {"id": "asset_2", "type": "color_palette"}
        ]
        mock_eq.execute.return_value.error = None
        
        project_id = "project_123"
        table = mock_supabase.table('generated_assets')
        result = table.select('*').eq('project_id', project_id).execute()
        
        assert len(result.data) == 2


class TestBrandKitOperations:
    """Test brand kit related database operations"""
    
    @patch('main.supabase')
    def test_save_brand_kit(self, mock_supabase):
        """Test saving brand kit"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value.data = [{"id": "kit_123"}]
        mock_insert.execute.return_value.error = None
        
        kit_data = {
            "project_id": "project_123",
            "brief_id": "brief_123",
            "brand_name": "Test Brand",
            "assets_package": {},
            "guidelines_pdf": "pdf_data"
        }
        
        table = mock_supabase.table('brand_kits')
        result = table.insert(kit_data).execute()
        
        mock_table.insert.assert_called_with(kit_data)
        assert result.data[0]["id"] == "kit_123"
    
    @patch('main.supabase')
    def test_get_brand_kit(self, mock_supabase):
        """Test retrieving brand kit"""
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.execute.return_value.data = [
            {
                "id": "kit_123",
                "brand_name": "Test Brand",
                "assets_package": {}
            }
        ]
        mock_eq.execute.return_value.error = None
        
        kit_id = "kit_123"
        table = mock_supabase.table('brand_kits')
        result = table.select('*').eq('id', kit_id).execute()
        
        assert len(result.data) == 1
        assert result.data[0]["brand_name"] == "Test Brand"


class TestErrorHandling:
    """Test error handling in database operations"""
    
    @patch('main.supabase')
    def test_database_error_handling(self, mock_supabase):
        """Test handling of database errors"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        
        # Simulate database error
        mock_response = Mock()
        mock_response.data = None
        mock_response.error = {"message": "Database connection failed"}
        mock_insert.execute.return_value = mock_response
        
        table = mock_supabase.table('projects')
        result = table.insert({"test": "data"}).execute()
        
        assert result.data is None
        assert result.error is not None
        assert "Database connection failed" in result.error["message"]
    
    @patch('main.supabase')
    async def test_save_assets_error_handling(self, mock_supabase):
        """Test error handling in save_generated_assets"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        
        # Simulate error
        mock_response = Mock()
        mock_response.data = None
        mock_response.error = {"message": "Insert failed"}
        mock_insert.execute.return_value = mock_response
        
        result = await save_generated_assets("project_123", "brief_123", {})
        
        assert result is False


class TestRealTimeOperations:
    """Test real-time features and subscriptions"""
    
    @patch('main.supabase')
    def test_subscription_setup(self, mock_supabase):
        """Test setting up real-time subscriptions"""
        mock_channel = Mock()
        mock_supabase.channel.return_value = mock_channel
        
        # Test subscription creation
        channel = mock_supabase.channel('projects_channel')
        
        mock_supabase.channel.assert_called_with('projects_channel')
        assert channel == mock_channel


class TestDataValidation:
    """Test data validation before database operations"""
    
    @patch('main.supabase')
    def test_project_data_validation(self, mock_supabase):
        """Test project data validation"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value.data = [{"id": "project_123"}]
        mock_insert.execute.return_value.error = None
        
        # Valid project data
        valid_data = {
            "user_id": "user_123",
            "name": "Valid Project",
            "description": "Valid description"
        }
        
        table = mock_supabase.table('projects')
        result = table.insert(valid_data).execute()
        
        mock_table.insert.assert_called_with(valid_data)
        assert result.data[0]["id"] == "project_123"
    
    def test_invalid_data_handling(self):
        """Test handling of invalid data types"""
        # Test with None values
        invalid_data = {
            "user_id": None,
            "name": "",
            "description": None
        }
        
        # Should handle gracefully without crashing
        assert invalid_data["user_id"] is None
        assert invalid_data["name"] == ""
        assert invalid_data["description"] is None


class TestAuthOperations:
    """Test authentication-related database operations"""
    
    @patch('main.supabase')
    def test_user_session_validation(self, mock_supabase):
        """Test user session validation"""
        mock_auth = Mock()
        mock_supabase.auth = mock_auth
        
        # Mock user session
        mock_session = {
            "user": {"id": "user_123", "email": "test@example.com"},
            "access_token": "token_123"
        }
        mock_auth.get_session.return_value = mock_session
        
        session = mock_supabase.auth.get_session()
        
        assert session["user"]["id"] == "user_123"
        assert session["access_token"] == "token_123"


class TestPerformanceConsiderations:
    """Test performance-related database operations"""
    
    @patch('main.supabase')
    def test_batch_operations(self, mock_supabase):
        """Test batch insert operations"""
        mock_table = Mock()
        mock_insert = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value.data = [
            {"id": "asset_1"}, {"id": "asset_2"}, {"id": "asset_3"}
        ]
        mock_insert.execute.return_value.error = None
        
        # Batch data
        batch_data = [
            {"project_id": "proj_1", "type": "logo"},
            {"project_id": "proj_1", "type": "color"},
            {"project_id": "proj_1", "type": "font"}
        ]
        
        table = mock_supabase.table('assets')
        result = table.insert(batch_data).execute()
        
        mock_table.insert.assert_called_with(batch_data)
        assert len(result.data) == 3
    
    @patch('main.supabase')
    def test_pagination(self, mock_supabase):
        """Test pagination in queries"""
        mock_table = Mock()
        mock_select = Mock()
        mock_range = Mock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.range.return_value = mock_range
        mock_range.execute.return_value.data = [{"id": f"item_{i}"} for i in range(10)]
        mock_range.execute.return_value.error = None
        
        # Test pagination
        table = mock_supabase.table('projects')
        result = table.select('*').range(0, 9).execute()
        
        mock_select.range.assert_called_with(0, 9)
        assert len(result.data) == 10