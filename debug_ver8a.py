#!/usr/bin/env python3
"""
Debug script to test ver8a functionality programmatically
"""

import requests
import time
from urllib.parse import urljoin

def test_page_load():
    """Test if page loads correctly"""
    try:
        response = requests.get('http://localhost:8000/index.html')
        if response.status_code == 200:
            print("✓ Page loads successfully")
            return True
        else:
            print(f"✗ Page load failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error loading page: {e}")
        return False

def test_js_functions():
    """Test if JavaScript functions exist"""
    try:
        response = requests.get('http://localhost:8000/index.html')
        content = response.text
        
        functions_to_check = [
            'function visualize()',
            'function clearRdfInput()',
            'function saveAsFile()',
            'function testRdfValidation()',
            'function loadExampleTrigVADv4()',
            'function updateModeDescription()',
            'function toggleSparqlPanel()'
        ]
        
        for func in functions_to_check:
            if func in content:
                print(f"✓ {func} found")
            else:
                print(f"✗ {func} missing")
                
        return True
    except Exception as e:
        print(f"✗ Error checking functions: {e}")
        return False

def test_elements():
    """Test if HTML elements exist"""
    try:
        response = requests.get('http://localhost:8000/index.html')
        content = response.text
        
        elements_to_check = [
            'id="rdf-input"',
            'id="visualize-btn"',
            'id="visualization-mode"',
            'id="sparql-mode"',
            'id="max-vad-row-length-group"',
            'id="smart-design-container"',
            'id="result-sparql-query"'
        ]
        
        for element in elements_to_check:
            if element in content:
                print(f"✓ {element} found")
            else:
                print(f"✗ {element} missing")
                
        return True
    except Exception as e:
        print(f"✗ Error checking elements: {e}")
        return False

def main():
    print("=== Debug ver8a Functionality ===")
    print("Testing page at http://localhost:8000/index.html")
    print()
    
    # Wait a moment for server to be ready
    time.sleep(1)
    
    tests = [
        ("Page Load", test_page_load),
        ("JavaScript Functions", test_js_functions),
        ("HTML Elements", test_elements)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        result = test_func()
        results.append((test_name, result))
    
    print("\n=== Summary ===")
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")

if __name__ == "__main__":
    main()