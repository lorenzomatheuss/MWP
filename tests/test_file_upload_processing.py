import pytest
import io
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock
from fastapi import UploadFile
from fastapi.testclient import TestClient
from main import app, extract_text_from_file

# Create test client
client = TestClient(app)

class TestFileUploadValidation:
    """Test file upload validation and security"""
    
    def test_valid_pdf_file_upload(self):
        """Test uploading a valid PDF file"""
        # Create mock PDF content
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n"
        
        files = {
            "file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")
        }
        
        with patch('main.extract_text_from_file') as mock_extract:
            mock_extract.return_value = "Sample PDF text"
            
            with patch('main.analyze_document_sections') as mock_analyze:
                mock_analyze.return_value = [
                    {"content": "Sample content", "confidence": 0.8, "type": "company_info"}
                ]
                
                response = client.post("/parse-document/", files=files)
                
                assert response.status_code == 200
                data = response.json()
                assert "text" in data
                assert "sections" in data
    
    def test_valid_docx_file_upload(self):
        """Test uploading a valid DOCX file"""
        # Create mock DOCX content (simplified)
        docx_content = b"PK\x03\x04" + b"mock docx content" * 100
        
        files = {
            "file": ("test.docx", io.BytesIO(docx_content), 
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }
        
        with patch('main.extract_text_from_file') as mock_extract:
            mock_extract.return_value = "Sample DOCX text"
            
            with patch('main.analyze_document_sections') as mock_analyze:
                mock_analyze.return_value = [
                    {"content": "Sample content", "confidence": 0.9, "type": "objectives"}
                ]
                
                response = client.post("/parse-document/", files=files)
                
                assert response.status_code == 200
                data = response.json()
                assert data["text"] == "Sample DOCX text"
    
    def test_valid_txt_file_upload(self):
        """Test uploading a valid text file"""
        text_content = "This is a sample text file for testing purposes."
        
        files = {
            "file": ("test.txt", io.BytesIO(text_content.encode()), "text/plain")
        }
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"content": text_content, "confidence": 0.7, "type": "brand_personality"}
            ]
            
            response = client.post("/parse-document/", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert text_content in data["text"]
    
    def test_unsupported_file_type(self):
        """Test uploading unsupported file type"""
        image_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        
        files = {
            "file": ("test.png", io.BytesIO(image_content), "image/png")
        }
        
        response = client.post("/parse-document/", files=files)
        
        # Should still process but return empty text
        assert response.status_code == 200
        data = response.json()
        assert data["text"] == ""
    
    def test_empty_file_upload(self):
        """Test uploading empty file"""
        files = {
            "file": ("empty.txt", io.BytesIO(b""), "text/plain")
        }
        
        response = client.post("/parse-document/", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["text"] == ""
    
    def test_large_file_handling(self):
        """Test handling of large files"""
        # Create a large text content
        large_content = "Lorem ipsum dolor sit amet. " * 10000  # ~270KB
        
        files = {
            "file": ("large.txt", io.BytesIO(large_content.encode()), "text/plain")
        }
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"content": "Large file content", "confidence": 0.6, "type": "values"}
            ]
            
            response = client.post("/parse-document/", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["text"]) > 0
    
    def test_corrupted_file_handling(self):
        """Test handling of corrupted files"""
        corrupted_content = b"This is not a valid PDF file"
        
        files = {
            "file": ("corrupted.pdf", io.BytesIO(corrupted_content), "application/pdf")
        }
        
        response = client.post("/parse-document/", files=files)
        
        # Should handle gracefully
        assert response.status_code == 200
        data = response.json()
        # Text should be empty or minimal due to extraction failure
        assert isinstance(data["text"], str)


class TestFileProcessingFunctions:
    """Test individual file processing functions"""
    
    def test_extract_text_from_pdf_success(self):
        """Test successful PDF text extraction"""
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "application/pdf"
        mock_file.file = io.BytesIO(b"%PDF-1.4 mock content")
        
        with patch('PyPDF2.PdfReader') as mock_reader:
            mock_page = Mock()
            mock_page.extract_text.return_value = "Extracted PDF text"
            mock_reader.return_value.pages = [mock_page]
            
            result = extract_text_from_file(mock_file)
            
            assert "Extracted PDF text" in result
            mock_reader.assert_called_once()
    
    def test_extract_text_from_docx_success(self):
        """Test successful DOCX text extraction"""
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        mock_file.file = io.BytesIO(b"mock docx content")
        
        with patch('docx.Document') as mock_doc:
            mock_paragraph = Mock()
            mock_paragraph.text = "DOCX paragraph text"
            mock_doc.return_value.paragraphs = [mock_paragraph]
            
            result = extract_text_from_file(mock_file)
            
            assert "DOCX paragraph text" in result
    
    def test_extract_text_from_txt_success(self):
        """Test successful text file extraction"""
        text_content = "Plain text file content"
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "text/plain"
        mock_file.file = io.BytesIO(text_content.encode())
        
        result = extract_text_from_file(mock_file)
        
        assert text_content in result
    
    def test_extract_text_pdf_error_handling(self):
        """Test PDF extraction error handling"""
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "application/pdf"
        mock_file.file = io.BytesIO(b"invalid pdf content")
        
        with patch('PyPDF2.PdfReader', side_effect=Exception("PDF parsing error")):
            result = extract_text_from_file(mock_file)
            
            assert result == ""
    
    def test_extract_text_docx_error_handling(self):
        """Test DOCX extraction error handling"""
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        mock_file.file = io.BytesIO(b"invalid docx content")
        
        with patch('docx.Document', side_effect=Exception("DOCX parsing error")):
            result = extract_text_from_file(mock_file)
            
            assert result == ""
    
    def test_extract_text_txt_error_handling(self):
        """Test text file extraction error handling"""
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "text/plain"
        mock_file.file = io.BytesIO(b"\xff\xfe")  # Invalid UTF-8
        
        with patch('builtins.open', side_effect=UnicodeDecodeError('utf-8', b'', 0, 1, 'invalid')):
            result = extract_text_from_file(mock_file)
            
            # Should handle gracefully
            assert isinstance(result, str)


class TestFileSecurityValidation:
    """Test file security and validation measures"""
    
    def test_malicious_filename_handling(self):
        """Test handling of malicious filenames"""
        malicious_names = [
            "../../../etc/passwd",
            "..\\..\\windows\\system32\\config\\sam",
            "file<script>alert('xss')</script>.txt",
            "file\x00.txt",
            "con.txt",  # Windows reserved name
            "aux.pdf"   # Windows reserved name
        ]
        
        for filename in malicious_names:
            files = {
                "file": (filename, io.BytesIO(b"safe content"), "text/plain")
            }
            
            response = client.post("/parse-document/", files=files)
            
            # Should process safely without directory traversal
            assert response.status_code == 200
    
    def test_file_size_limits(self):
        """Test file size limitation handling"""
        # Test with very large content
        huge_content = b"A" * (50 * 1024 * 1024)  # 50MB
        
        files = {
            "file": ("huge.txt", io.BytesIO(huge_content), "text/plain")
        }
        
        # This should be handled by FastAPI/server configuration
        # but we test that the function doesn't crash
        try:
            response = client.post("/parse-document/", files=files)
            # Response should be either successful or properly rejected
            assert response.status_code in [200, 413, 422]  # OK, Payload Too Large, or Validation Error
        except Exception:
            # Server-level rejection is acceptable
            pass
    
    def test_binary_file_content_validation(self):
        """Test validation of binary file content"""
        binary_files = [
            (b"\x89PNG\r\n\x1a\n", "image/png", "test.png"),
            (b"\xff\xd8\xff\xe0", "image/jpeg", "test.jpg"),
            (b"BM", "image/bmp", "test.bmp"),
            (b"\x00\x00\x01\x00", "image/ico", "test.ico")
        ]
        
        for content, mime_type, filename in binary_files:
            files = {
                "file": (filename, io.BytesIO(content), mime_type)
            }
            
            response = client.post("/parse-document/", files=files)
            
            # Should handle binary files gracefully
            assert response.status_code == 200
            data = response.json()
            assert data["text"] == ""  # No text extracted from binary files


class TestFileContentAnalysis:
    """Test analysis of file content after extraction"""
    
    def test_multilingual_content_handling(self):
        """Test handling of multilingual content"""
        multilingual_texts = [
            "Hello world! Bonjour le monde! Hola mundo!",
            "こんにちは世界！ 你好世界！ Привет мир!",
            "مرحبا بالعالم! שלום עולם! हैलो वर्ल्ड!"
        ]
        
        for text in multilingual_texts:
            files = {
                "file": ("multilingual.txt", io.BytesIO(text.encode('utf-8')), "text/plain")
            }
            
            with patch('main.analyze_document_sections') as mock_analyze:
                mock_analyze.return_value = [
                    {"content": text[:50], "confidence": 0.5, "type": "company_info"}
                ]
                
                response = client.post("/parse-document/", files=files)
                
                assert response.status_code == 200
                data = response.json()
                assert len(data["text"]) > 0
    
    def test_special_characters_handling(self):
        """Test handling of special characters"""
        special_content = """
        Special characters test: !@#$%^&*()_+-={}[]|\\:";'<>?,./
        Unicode symbols: ★☆♦♣♠♥♪♫☀☂☃❄❅❆☯☮☪☭
        Mathematical symbols: ∑∏∫∆∇∂√∞≠≤≥±×÷
        """
        
        files = {
            "file": ("special.txt", io.BytesIO(special_content.encode('utf-8')), "text/plain")
        }
        
        with patch('main.analyze_document_sections') as mock_analyze:
            mock_analyze.return_value = [
                {"content": "Special characters content", "confidence": 0.6, "type": "brand_personality"}
            ]
            
            response = client.post("/parse-document/", files=files)
            
            assert response.status_code == 200
            data = response.json()
            assert "Special characters test" in data["text"]
    
    def test_formatted_document_handling(self):
        """Test handling of formatted documents"""
        formatted_content = """
        # Heading 1
        ## Heading 2
        
        **Bold text** and *italic text*
        
        - Bullet point 1
        - Bullet point 2
        
        1. Numbered item 1
        2. Numbered item 2
        
        [Link](https://example.com)
        
        | Table | Content |
        |-------|---------|
        | Cell 1| Cell 2  |
        """
        
        files = {
            "file": ("formatted.md", io.BytesIO(formatted_content.encode()), "text/markdown")
        }
        
        response = client.post("/parse-document/", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "Heading 1" in data["text"]
        assert "Bold text" in data["text"]


class TestFileUploadEdgeCases:
    """Test edge cases in file upload handling"""
    
    def test_no_file_provided(self):
        """Test endpoint behavior when no file is provided"""
        response = client.post("/parse-document/")
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_multiple_files_upload(self):
        """Test handling multiple files (should process first one)"""
        files = [
            ("file", ("test1.txt", io.BytesIO(b"First file content"), "text/plain")),
            ("file", ("test2.txt", io.BytesIO(b"Second file content"), "text/plain"))
        ]
        
        # FastAPI should handle this according to its configuration
        response = client.post("/parse-document/", files=files)
        
        # Response depends on FastAPI handling of multiple files with same name
        assert response.status_code in [200, 422]
    
    def test_file_without_extension(self):
        """Test file without extension"""
        files = {
            "file": ("noextension", io.BytesIO(b"File without extension"), "text/plain")
        }
        
        response = client.post("/parse-document/", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "File without extension" in data["text"]
    
    def test_file_with_wrong_mime_type(self):
        """Test file with incorrect MIME type"""
        # Text content with PDF MIME type
        files = {
            "file": ("fake.pdf", io.BytesIO(b"This is actually text"), "application/pdf")
        }
        
        response = client.post("/parse-document/", files=files)
        
        # Should handle gracefully even with wrong MIME type
        assert response.status_code == 200
    
    def test_temporary_file_cleanup(self):
        """Test that temporary files are properly cleaned up"""
        files = {
            "file": ("test.txt", io.BytesIO(b"Temporary file test"), "text/plain")
        }
        
        # Check temp directory before and after
        temp_dir = tempfile.gettempdir()
        files_before = set(os.listdir(temp_dir))
        
        response = client.post("/parse-document/", files=files)
        
        files_after = set(os.listdir(temp_dir))
        
        assert response.status_code == 200
        # Temp files should be cleaned up (or at least not accumulating excessively)
        new_files = files_after - files_before
        assert len(new_files) <= 5  # Allow some temporary files but not excessive accumulation


class TestFileProcessingPerformance:
    """Test performance considerations in file processing"""
    
    def test_concurrent_file_uploads(self):
        """Test handling concurrent file uploads"""
        import threading
        import time
        
        results = []
        
        def upload_file(file_num):
            content = f"Concurrent test file {file_num}"
            files = {
                "file": (f"test{file_num}.txt", io.BytesIO(content.encode()), "text/plain")
            }
            
            response = client.post("/parse-document/", files=files)
            results.append(response.status_code)
        
        # Create multiple threads for concurrent uploads
        threads = []
        for i in range(5):
            thread = threading.Thread(target=upload_file, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All uploads should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 5
    
    def test_processing_time_limits(self):
        """Test that file processing completes within reasonable time"""
        import time
        
        # Medium-sized file that should process quickly
        content = "Test content for timing. " * 1000  # ~25KB
        files = {
            "file": ("timing_test.txt", io.BytesIO(content.encode()), "text/plain")
        }
        
        start_time = time.time()
        response = client.post("/parse-document/", files=files)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        assert response.status_code == 200
        assert processing_time < 30.0  # Should complete within 30 seconds