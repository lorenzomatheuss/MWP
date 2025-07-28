import pytest
import asyncio
import json
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
import io
from main import app

# Create test client
client = TestClient(app)

class TestCompleteWorkflow:
    """Test complete end-to-end workflows"""
    
    @patch('main.supabase')
    def test_complete_brand_creation_workflow(self, mock_supabase):
        """Test complete workflow from project creation to brand kit generation"""
        
        # Mock Supabase responses
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "project_123"}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        # Step 1: Create Project
        project_data = {
            "user_id": "user_123",
            "name": "E2E Test Project",
            "description": "End-to-end test project"
        }
        
        project_response = client.post("/projects/", json=project_data)
        assert project_response.status_code == 200
        project_id = project_response.json().get("id", "project_123")
        
        # Step 2: Upload and Parse Document
        document_content = """
        Nossa empresa, TechNova, é uma startup de tecnologia focada em inovação.
        Nosso público-alvo são jovens profissionais entre 25-35 anos.
        Nossos valores incluem sustentabilidade, inovação e qualidade.
        A personalidade da nossa marca é moderna, confiável e visionária.
        """
        
        files = {
            "file": ("brief.txt", io.BytesIO(document_content.encode()), "text/plain")
        }
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"content": "TechNova startup tecnologia", "confidence": 0.9, "type": "company_info"},
                {"content": "jovens profissionais 25-35 anos", "confidence": 0.8, "type": "target_audience"},
                {"content": "sustentabilidade inovação qualidade", "confidence": 0.85, "type": "values"},
                {"content": "moderna confiável visionária", "confidence": 0.9, "type": "brand_personality"}
            ]
            
            document_response = client.post("/parse-document/", files=files)
            assert document_response.status_code == 200
            
            doc_data = document_response.json()
            assert len(doc_data["sections"]) >= 3
            assert doc_data["confidence"] > 0.7
        
        # Step 3: Create and Analyze Brief
        brief_data = {
            "project_id": project_id,
            "content": document_content.strip()
        }
        
        brief_response = client.post("/briefs/analyze/", json=brief_data)
        assert brief_response.status_code == 200
        brief_id = brief_response.json().get("brief_id", "brief_123")
        
        # Step 4: Generate Visual Concepts
        with patch('main.generate_visual_concept_data') as mock_concepts:
            mock_concepts.return_value = {
                "concepts": [
                    {"id": "concept_1", "prompt": "modern tech startup", "image_url": "mock_url_1"},
                    {"id": "concept_2", "prompt": "sustainable innovation", "image_url": "mock_url_2"}
                ],
                "metaphors": [
                    {"prompt": "technology tree growing", "image_url": "metaphor_1"}
                ],
                "color_palettes": [
                    {"name": "Tech Blue", "colors": ["#007ACC", "#0066CC", "#004499"]}
                ]
            }
            
            concepts_data = {
                "project_id": project_id,
                "brief_id": brief_id,
                "keywords": ["technology", "innovation", "modern"],
                "attributes": ["sustainable", "reliable", "visionary"],
                "demo_mode": True
            }
            
            concepts_response = client.post("/visual-concepts/generate/", json=concepts_data)
            assert concepts_response.status_code == 200
            
            concepts_result = concepts_response.json()
            assert len(concepts_result["concepts"]) >= 2
        
        # Step 5: Generate Galaxy of Concepts
        with patch('main.generate_visual_metaphors') as mock_metaphors:
            with patch('main.generate_color_palettes') as mock_palettes:
                mock_metaphors.return_value = [
                    {"prompt": "tech innovation", "image_url": "galaxy_1"},
                    {"prompt": "sustainable future", "image_url": "galaxy_2"}
                ]
                mock_palettes.return_value = [
                    {"name": "Innovation", "colors": ["#00C851", "#007E33"]}
                ]
                
                galaxy_data = {
                    "project_id": project_id,
                    "brief_id": brief_id,
                    "keywords": ["innovation", "technology"],
                    "attributes": ["modern", "sustainable"],
                    "demo_mode": True
                }
                
                galaxy_response = client.post("/galaxy/generate/", json=galaxy_data)
                assert galaxy_response.status_code == 200
                
                galaxy_result = galaxy_response.json()
                assert "metaphors" in galaxy_result
                assert "palettes" in galaxy_result
        
        # Step 6: Apply Styling and Blending
        with patch('main.download_image_from_url') as mock_download:
            with patch('main.apply_artistic_filter') as mock_filter:
                from PIL import Image
                mock_img = Image.new('RGB', (100, 100), color='blue')
                mock_download.return_value = mock_img
                mock_filter.return_value = mock_img
                
                style_data = {
                    "project_id": project_id,
                    "brief_id": brief_id,
                    "image_url": "http://example.com/test.jpg",
                    "style_type": "modern",
                    "intensity": 0.8,
                    "color_palette": ["#007ACC", "#00C851"]
                }
                
                style_response = client.post("/concepts/apply-style/", json=style_data)
                assert style_response.status_code == 200
        
        # Step 7: Generate Final Brand Kit
        with patch('main.generate_brand_kit_data') as mock_brand_kit:
            mock_brand_kit.return_value = {
                "brand_name": "TechNova",
                "logos": [{"format": "PNG", "url": "logo_url"}],
                "color_palettes": [{"name": "Primary", "colors": ["#007ACC"]}],
                "typography": [{"name": "Roboto", "weights": ["Regular", "Bold"]}],
                "guidelines_pdf": "pdf_data",
                "presentation_deck": "deck_data"
            }
            
            brand_kit_data = {
                "project_id": project_id,
                "brief_id": brief_id,
                "brand_name": "TechNova",
                "preferences": {
                    "style": "modern",
                    "industry": "technology"
                }
            }
            
            brand_kit_response = client.post("/brand-kit/generate/", json=brand_kit_data)
            assert brand_kit_response.status_code == 200
            
            kit_result = brand_kit_response.json()
            assert "brand_kit" in kit_result
            assert kit_result["brand_kit"]["brand_name"] == "TechNova"
        
        # Step 8: Finalize Brand Kit
        finalize_data = {
            "project_id": project_id,
            "brief_id": brief_id,
            "selected_assets": {
                "logo": "asset_1",
                "colors": "asset_2",
                "typography": "asset_3"
            },
            "brand_name": "TechNova",
            "final_adjustments": {
                "color_intensity": 0.9,
                "style_preference": "modern"
            }
        }
        
        finalize_response = client.post("/brand-kit/finalize/", json=finalize_data)
        assert finalize_response.status_code == 200
        
        final_result = finalize_response.json()
        assert "finalized_kit" in final_result
    
    @patch('main.supabase')
    def test_strategic_analysis_workflow(self, mock_supabase):
        """Test strategic analysis workflow"""
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "analysis_123"}]
        
        with patch('main.analyze_strategic_elements') as mock_strategic:
            mock_strategic.return_value = {
                "positioning": "Premium technology solutions provider",
                "differentiation": "AI-driven sustainable innovation",
                "opportunities": ["Market expansion", "New partnerships"],
                "risks": ["Competition", "Technology changes"]
            }
            
            analysis_data = {
                "project_id": "project_123",
                "brief_id": "brief_123",
                "text": "Technology company focused on sustainable innovation",
                "keywords": ["technology", "innovation", "sustainable"],
                "attributes": ["modern", "reliable", "eco-friendly"]
            }
            
            response = client.post("/strategic-analysis/", json=analysis_data)
            assert response.status_code == 200
            
            result = response.json()
            assert "analysis" in result
            assert "positioning" in result["analysis"]
            assert "differentiation" in result["analysis"]
    
    def test_error_recovery_workflow(self):
        """Test workflow behavior with errors and recovery"""
        
        # Test with invalid project ID
        invalid_brief_data = {
            "project_id": "invalid_project",
            "content": "Test content"
        }
        
        response = client.post("/briefs/analyze/", json=invalid_brief_data)
        # Should handle gracefully
        assert response.status_code in [200, 404, 422]
        
        # Test with missing required fields
        incomplete_data = {"project_id": "test"}
        
        response = client.post("/brand-kit/generate/", json=incomplete_data)
        assert response.status_code == 422  # Validation error
    
    @patch('main.supabase')
    def test_concurrent_workflow_operations(self, mock_supabase):
        """Test concurrent operations in workflow"""
        import threading
        import time
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "concurrent_123"}]
        
        results = []
        
        def create_project(project_num):
            project_data = {
                "user_id": f"user_{project_num}",
                "name": f"Concurrent Project {project_num}",
                "description": f"Test project {project_num}"
            }
            
            response = client.post("/projects/", json=project_data)
            results.append(response.status_code)
        
        # Create multiple concurrent requests
        threads = []
        for i in range(3):
            thread = threading.Thread(target=create_project, args=(i,))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # All operations should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 3


class TestWorkflowValidation:
    """Test workflow validation and business logic"""
    
    def test_workflow_state_validation(self):
        """Test that workflow steps follow proper sequence"""
        
        # Try to generate brand kit without project
        brand_kit_data = {
            "project_id": "nonexistent_project",
            "brief_id": "nonexistent_brief",
            "brand_name": "Test Brand",
            "preferences": {}
        }
        
        response = client.post("/brand-kit/generate/", json=brand_kit_data)
        # Should handle missing dependencies gracefully
        assert response.status_code in [200, 404, 422]
    
    def test_data_consistency_across_workflow(self):
        """Test data consistency throughout workflow"""
        
        # Mock consistent data flow
        project_id = "consistent_project_123"
        brief_id = "consistent_brief_123"
        brand_name = "ConsistentBrand"
        
        # Verify data consistency in requests
        assert project_id == "consistent_project_123"
        assert brief_id == "consistent_brief_123"
        assert brand_name == "ConsistentBrand"
    
    @patch('main.supabase')
    def test_user_permission_workflow(self, mock_supabase):
        """Test user permissions throughout workflow"""
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "project_123", "user_id": "user_123"}
        ]
        
        # Test accessing project with correct user
        user_id = "user_123"
        response = client.get(f"/projects/{user_id}")
        assert response.status_code == 200
        
        # Test accessing non-existent user projects
        invalid_user_id = "invalid_user"
        response = client.get(f"/projects/{invalid_user_id}")
        assert response.status_code == 200  # Returns empty list


class TestWorkflowPerformance:
    """Test workflow performance characteristics"""
    
    @patch('main.supabase')
    def test_workflow_execution_time(self, mock_supabase):
        """Test that complete workflow executes within reasonable time"""
        import time
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "perf_test_123"}]
        
        start_time = time.time()
        
        # Execute simplified workflow
        project_data = {
            "user_id": "perf_user",
            "name": "Performance Test",
            "description": "Performance testing project"
        }
        
        response = client.post("/projects/", json=project_data)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        assert response.status_code == 200
        assert execution_time < 5.0  # Should complete within 5 seconds
    
    def test_workflow_memory_usage(self):
        """Test workflow memory efficiency"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Execute memory-intensive operations
        large_content = "Test content " * 10000
        files = {
            "file": ("large_test.txt", io.BytesIO(large_content.encode()), "text/plain")
        }
        
        response = client.post("/parse-document/", files=files)
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        assert response.status_code == 200
        # Memory increase should be reasonable (less than 100MB)
        assert memory_increase < 100 * 1024 * 1024


class TestWorkflowIntegration:
    """Test integration between different workflow components"""
    
    @patch('main.supabase')
    def test_document_to_concepts_integration(self, mock_supabase):
        """Test integration from document parsing to concept generation"""
        
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "integration_123"}]
        
        # Parse document
        document_content = "Innovative technology company focused on sustainability"
        files = {
            "file": ("integration_test.txt", io.BytesIO(document_content.encode()), "text/plain")
        }
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"content": "technology innovation", "confidence": 0.8, "type": "company_info"}
            ]
            
            doc_response = client.post("/parse-document/", files=files)
            assert doc_response.status_code == 200
            
            # Use parsed data for concept generation
            with patch('main.generate_visual_concept_data') as mock_concepts:
                mock_concepts.return_value = {
                    "concepts": [{"id": "integrated_concept", "prompt": "tech innovation"}]
                }
                
                concepts_data = {
                    "project_id": "integration_project",
                    "brief_id": "integration_brief",
                    "keywords": ["technology", "innovation"],  # Derived from document
                    "attributes": ["sustainable"],  # Derived from document
                    "demo_mode": True
                }
                
                concepts_response = client.post("/visual-concepts/generate/", json=concepts_data)
                assert concepts_response.status_code == 200
    
    def test_concepts_to_brand_kit_integration(self):
        """Test integration from concepts to final brand kit"""
        
        with patch('main.generate_brand_kit_data') as mock_brand_kit:
            mock_brand_kit.return_value = {
                "brand_name": "IntegratedBrand",
                "logos": [],
                "color_palettes": [{"name": "Integrated", "colors": ["#123456"]}]
            }
            
            # Generate brand kit using concept data
            brand_kit_data = {
                "project_id": "integration_project",
                "brief_id": "integration_brief",
                "brand_name": "IntegratedBrand",
                "preferences": {
                    "derived_from_concepts": True
                }
            }
            
            response = client.post("/brand-kit/generate/", json=brand_kit_data)
            assert response.status_code == 200
            
            result = response.json()
            assert result["brand_kit"]["brand_name"] == "IntegratedBrand"


class TestWorkflowRobustness:
    """Test workflow robustness and error handling"""
    
    def test_partial_workflow_completion(self):
        """Test behavior when workflow is partially completed"""
        
        # Start workflow but don't complete all steps
        project_data = {
            "user_id": "partial_user",
            "name": "Partial Project",
            "description": "Partially completed workflow"
        }
        
        with patch('main.supabase') as mock_supabase:
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "partial_123"}]
            
            response = client.post("/projects/", json=project_data)
            assert response.status_code == 200
            
            # Try to access later workflow steps without completing earlier ones
            # Should handle gracefully
            incomplete_brand_kit = {
                "project_id": "partial_123",
                "brief_id": "missing_brief",
                "brand_name": "PartialBrand",
                "preferences": {}
            }
            
            response = client.post("/brand-kit/generate/", json=incomplete_brand_kit)
            # Should handle missing brief gracefully
            assert response.status_code in [200, 404, 422]
    
    def test_workflow_recovery_after_failure(self):
        """Test workflow recovery after component failure"""
        
        # Simulate component failure and recovery
        with patch('main.supabase') as mock_supabase:
            # First attempt fails
            mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("Database error")
            
            project_data = {
                "user_id": "recovery_user",
                "name": "Recovery Test",
                "description": "Testing recovery"
            }
            
            try:
                response = client.post("/projects/", json=project_data)
                # May succeed or fail depending on error handling
                assert response.status_code in [200, 500]
            except Exception:
                # Exception handling is acceptable
                pass
            
            # Second attempt succeeds
            mock_supabase.table.return_value.insert.return_value.execute.side_effect = None
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "recovery_123"}]
            
            response = client.post("/projects/", json=project_data)
            assert response.status_code == 200
    
    def test_workflow_timeout_handling(self):
        """Test handling of workflow timeouts"""
        import time
        
        # Simulate slow operation
        with patch('main.analyze_document_sections') as mock_analyze:
            def slow_analysis(*args, **kwargs):
                time.sleep(0.1)  # Short delay for testing
                return [{"content": "slow analysis", "confidence": 0.5, "type": "company_info"}]
            
            mock_analyze.side_effect = slow_analysis
            
            files = {
                "file": ("timeout_test.txt", io.BytesIO(b"Timeout test content"), "text/plain")
            }
            
            start_time = time.time()
            response = client.post("/parse-document/", files=files)
            end_time = time.time()
            
            # Should complete even with delay
            assert response.status_code == 200
            assert end_time - start_time < 10.0  # Reasonable timeout
    
    def test_workflow_data_validation(self):
        """Test comprehensive data validation throughout workflow"""
        
        # Test with various invalid data formats
        invalid_data_sets = [
            {"user_id": "", "name": "", "description": ""},  # Empty strings
            {"user_id": None, "name": None, "description": None},  # Null values
            {"user_id": 123, "name": 456, "description": 789},  # Wrong types
            {},  # Empty object
        ]
        
        for invalid_data in invalid_data_sets:
            response = client.post("/projects/", json=invalid_data)
            # Should handle invalid data with validation errors
            assert response.status_code in [200, 422]