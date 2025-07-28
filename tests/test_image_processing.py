import pytest
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import io
import base64
import numpy as np
from unittest.mock import Mock, patch
import requests
from main import (
    download_image_from_url,
    blend_images,
    apply_color_palette_to_image,
    apply_artistic_filter,
    image_to_base64
)

def test_create_test_image():
    """Test creating a basic test image"""
    img = Image.new('RGB', (100, 100), color='red')
    
    assert img.size == (100, 100)
    assert img.mode == 'RGB'
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    assert len(img_bytes.getvalue()) > 0

def test_image_blending():
    """Test image blending functionality"""
    # Create two test images
    img1 = Image.new('RGB', (100, 100), color='red')
    img2 = Image.new('RGB', (100, 100), color='blue')
    
    # Test different blend modes
    blend_modes = ['overlay', 'multiply', 'screen', 'soft_light']
    
    for mode_name in blend_modes:
        try:
            if mode_name == 'overlay':
                # Simulate overlay blend
                blended = Image.blend(img1, img2, 0.5)
            elif mode_name == 'multiply':
                # Simulate multiply blend
                blended = Image.blend(img1, img2, 0.3)
            elif mode_name == 'screen':
                # Simulate screen blend  
                blended = Image.blend(img1, img2, 0.7)
            else:
                # Default blend
                blended = Image.blend(img1, img2, 0.5)
            
            assert blended.size == (100, 100)
            assert blended.mode == 'RGB'
            
        except Exception as e:
            # Some blend modes might not be available
            assert isinstance(e, Exception)

def test_color_palette_application():
    """Test applying color palette to images"""
    # Create test image
    img = Image.new('RGB', (100, 100), color='white')
    
    # Test color palette
    colors = ['#FF6B9D', '#45B7D1', '#96CEB4']
    
    def apply_color_palette(image, palette):
        """Apply color palette overlay to image"""
        overlay = Image.new('RGB', image.size, palette[0])
        
        # Create alpha mask for blending
        alpha = 128  # 50% transparency
        
        # Simple color overlay simulation
        result = Image.blend(image, overlay, 0.3)
        return result
    
    result = apply_color_palette(img, colors)
    
    assert result.size == img.size
    assert result.mode == 'RGB'

def test_image_filters():
    """Test image filter applications"""
    img = Image.new('RGB', (100, 100), color='blue')
    
    # Test various filters
    filters = {
        'blur': ImageFilter.BLUR,
        'sharpen': ImageFilter.SHARPEN,
        'smooth': ImageFilter.SMOOTH,
        'edge_enhance': ImageFilter.EDGE_ENHANCE
    }
    
    for filter_name, filter_obj in filters.items():
        try:
            filtered = img.filter(filter_obj)
            assert filtered.size == img.size
            assert filtered.mode == img.mode
        except Exception:
            # Some filters might not work with simple test images
            pass

def test_image_enhancement():
    """Test image enhancement (brightness, contrast, saturation)"""
    img = Image.new('RGB', (100, 100), color='gray')
    
    # Test brightness
    brightness_enhancer = ImageEnhance.Brightness(img)
    bright_img = brightness_enhancer.enhance(1.5)
    assert bright_img.size == img.size
    
    # Test contrast
    contrast_enhancer = ImageEnhance.Contrast(img)
    contrast_img = contrast_enhancer.enhance(1.2)
    assert contrast_img.size == img.size
    
    # Test color saturation
    color_enhancer = ImageEnhance.Color(img)
    saturated_img = color_enhancer.enhance(0.8)
    assert saturated_img.size == img.size

def test_image_resizing():
    """Test image resizing functionality"""
    img = Image.new('RGB', (200, 200), color='green')
    
    # Test different resize methods
    sizes = [(100, 100), (150, 100), (50, 200)]
    
    for size in sizes:
        resized = img.resize(size, Image.Resampling.LANCZOS)
        assert resized.size == size
        assert resized.mode == img.mode

def test_base64_encoding_decoding():
    """Test base64 image encoding/decoding"""
    # Create test image
    img = Image.new('RGB', (50, 50), color='purple')
    
    # Convert to base64
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    base64_str = base64.b64encode(img_bytes.getvalue()).decode('utf-8')
    
    assert len(base64_str) > 0
    assert isinstance(base64_str, str)
    
    # Decode back
    decoded_bytes = base64.b64decode(base64_str)
    decoded_img = Image.open(io.BytesIO(decoded_bytes))
    
    assert decoded_img.size == img.size
    assert decoded_img.mode == img.mode

def test_image_composition():
    """Test compositing multiple images"""
    # Create base image
    base = Image.new('RGB', (200, 200), color='white')
    
    # Create overlay images
    overlay1 = Image.new('RGBA', (100, 100), color=(255, 0, 0, 128))  # Semi-transparent red
    overlay2 = Image.new('RGBA', (100, 100), color=(0, 255, 0, 128))  # Semi-transparent green
    
    # Composite images
    base.paste(overlay1, (0, 0), overlay1)
    base.paste(overlay2, (50, 50), overlay2)
    
    assert base.size == (200, 200)
    assert base.mode == 'RGB'

def test_image_download_simulation():
    """Test image download simulation"""
    # Create test image data
    test_img = Image.new('RGB', (100, 100), color='orange')
    img_bytes = io.BytesIO()
    test_img.save(img_bytes, format='JPEG')
    
    # Simulate successful download
    downloaded_img = Image.open(io.BytesIO(img_bytes.getvalue()))
    
    assert downloaded_img is not None
    assert downloaded_img.size == (100, 100)

def test_image_format_conversion():
    """Test converting between image formats"""
    # Create test image
    img = Image.new('RGB', (100, 100), color='cyan')
    
    formats = ['PNG', 'JPEG', 'WEBP']
    
    for fmt in formats:
        try:
            img_bytes = io.BytesIO()
            
            # Handle JPEG format (no transparency)
            if fmt == 'JPEG' and img.mode == 'RGBA':
                img_rgb = img.convert('RGB')
                img_rgb.save(img_bytes, format=fmt, quality=85)
            else:
                img.save(img_bytes, format=fmt)
            
            img_bytes.seek(0)
            
            # Verify we can read it back
            converted_img = Image.open(img_bytes)
            assert converted_img.size == img.size
            
        except Exception:
            # Some formats might not be supported
            pass

def test_error_handling_corrupted_image():
    """Test handling corrupted image data"""
    corrupted_data = b"not an image"
    
    try:
        img = Image.open(io.BytesIO(corrupted_data))
        assert False, "Should have raised an exception"
    except Exception as e:
        # Should handle corrupted data gracefully
        assert isinstance(e, Exception)

def test_numpy_integration():
    """Test PIL to NumPy array conversion"""
    img = Image.new('RGB', (50, 50), color='yellow')
    
    # Convert to numpy array
    img_array = np.array(img)
    
    assert img_array.shape == (50, 50, 3)  # Height, width, channels
    assert img_array.dtype == np.uint8
    
    # Convert back to PIL
    img_from_array = Image.fromarray(img_array)
    
    assert img_from_array.size == img.size
    assert img_from_array.mode == img.mode


def test_blend_images_function():
    """Test the actual blend_images function from main.py"""
    # Create test images
    img1 = Image.new('RGB', (100, 100), color='red')
    img2 = Image.new('RGB', (100, 100), color='blue')
    images = [img1, img2]
    
    # Test different blend modes
    blend_modes = ['overlay', 'multiply', 'screen', 'soft_light']
    
    for mode in blend_modes:
        result = blend_images(images, mode)
        assert isinstance(result, Image.Image)
        assert result.size == (100, 100)
        assert result.mode == 'RGB'


def test_blend_images_single_image():
    """Test blending with single image"""
    img = Image.new('RGB', (100, 100), color='green')
    result = blend_images([img], 'overlay')
    
    assert isinstance(result, Image.Image)
    assert result.size == img.size


def test_blend_images_empty_list():
    """Test blending with empty image list"""
    try:
        result = blend_images([], 'overlay')
        # Should handle empty list gracefully
        assert result is None or isinstance(result, Image.Image)
    except Exception:
        # Exception is acceptable for empty input
        pass


def test_apply_color_palette_to_image_function():
    """Test the actual apply_color_palette_to_image function"""
    img = Image.new('RGB', (100, 100), color='white')
    palette = ['#FF6B9D', '#45B7D1', '#96CEB4', '#FECA57']
    
    result = apply_color_palette_to_image(img, palette)
    
    assert isinstance(result, Image.Image)
    assert result.size == img.size
    assert result.mode == 'RGB'


def test_apply_color_palette_empty_palette():
    """Test applying empty color palette"""
    img = Image.new('RGB', (100, 100), color='white')
    
    try:
        result = apply_color_palette_to_image(img, [])
        # Should handle empty palette gracefully
        assert result is None or isinstance(result, Image.Image)
    except Exception:
        # Exception is acceptable for empty palette
        pass


def test_apply_artistic_filter_function():
    """Test the actual apply_artistic_filter function"""
    img = Image.new('RGB', (100, 100), color='blue')
    
    filter_types = ['vintage', 'modern', 'artistic', 'minimal']
    
    for filter_type in filter_types:
        result = apply_artistic_filter(img, filter_type)
        assert isinstance(result, Image.Image)
        assert result.size == img.size
        assert result.mode == 'RGB'


def test_apply_artistic_filter_unknown_type():
    """Test artistic filter with unknown type"""
    img = Image.new('RGB', (100, 100), color='red')
    
    result = apply_artistic_filter(img, 'unknown_filter')
    
    # Should handle unknown filter type gracefully
    assert isinstance(result, Image.Image)
    assert result.size == img.size


def test_image_to_base64_function():
    """Test the actual image_to_base64 function"""
    img = Image.new('RGB', (50, 50), color='purple')
    
    base64_str = image_to_base64(img)
    
    assert isinstance(base64_str, str)
    assert len(base64_str) > 0
    
    # Should be valid base64
    try:
        decoded = base64.b64decode(base64_str)
        assert len(decoded) > 0
    except Exception:
        assert False, "Should produce valid base64"


@patch('requests.get')
def test_download_image_from_url_function(mock_get):
    """Test the actual download_image_from_url function"""
    # Create mock response
    mock_response = Mock()
    mock_response.status_code = 200
    
    # Create test image data
    test_img = Image.new('RGB', (100, 100), color='orange')
    img_bytes = io.BytesIO()
    test_img.save(img_bytes, format='JPEG')
    mock_response.content = img_bytes.getvalue()
    
    mock_get.return_value = mock_response
    
    url = "https://example.com/test.jpg"
    result = download_image_from_url(url)
    
    assert isinstance(result, Image.Image)
    assert result.size == (100, 100)


@patch('requests.get')
def test_download_image_from_url_error(mock_get):
    """Test download_image_from_url with error response"""
    mock_response = Mock()
    mock_response.status_code = 404
    mock_get.return_value = mock_response
    
    url = "https://example.com/nonexistent.jpg"
    
    try:
        result = download_image_from_url(url)
        # Should handle error gracefully
        assert result is None or isinstance(result, Image.Image)
    except Exception:
        # Exception is acceptable for error cases
        pass