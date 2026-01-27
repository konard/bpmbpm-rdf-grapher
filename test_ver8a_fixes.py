#!/usr/bin/env python3
"""
Comprehensive test for ver8a fixes
"""

import requests
import time
import subprocess
import os

def start_server():
    """Start HTTP server if not already running"""
    try:
        response = requests.get('http://localhost:8000/index.html', timeout=2)
        return True
    except:
        # Server not running, start it
        os.chdir('/tmp/gh-issue-solver-1769497112024/ver8a')
        subprocess.Popen(['python3', '-m', 'http.server', '8000'], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        time.sleep(2)  # Wait for server to start
        return True

def test_page_loads():
    """Test that page loads without errors"""
    try:
        response = requests.get('http://localhost:8000/index.html')
        return response.status_code == 200
    except:
        return False

def test_elements_exist():
    """Test that key elements exist in HTML"""
    try:
        response = requests.get('http://localhost:8000/index.html')
        content = response.text
        
        elements = [
            'id="rdf-input"',
            'id="visualize-btn"', 
            'id="visualization-mode"',
            'id="sparql-mode"',
            'id="max-vad-row-length-group"',
            'id="smart-design-container"'
        ]
        
        missing = []
        for element in elements:
            if element not in content:
                missing.append(element)
        
        return len(missing) == 0, missing
    except Exception as e:
        return False, [str(e)]

def test_functions_exist():
    """Test that key JavaScript functions exist"""
    try:
        response = requests.get('http://localhost:8000/index.html')
        content = response.text
        
        functions = [
            'function visualize()',
            'function clearRdfInput()',
            'function saveAsFile()',
            'function testRdfValidation()',
            'function loadExampleTrigVADv4()',
            'function updateModeDescription()',
            'function toggleSparqlPanel()'
        ]
        
        missing = []
        for function in functions:
            if function not in content:
                missing.append(function)
        
        return len(missing) == 0, missing
    except Exception as e:
        return False, [str(e)]

def test_css_classes():
    """Test that required CSS classes exist"""
    try:
        response = requests.get('http://localhost:8000/styles.css')
        content = response.text
        
        classes = [
            '.smart-design-container',
            '.smart-design-container.visible',
            '.sparql-panel.visible'
        ]
        
        missing = []
        for css_class in classes:
            if css_class not in content:
                missing.append(css_class)
        
        return len(missing) == 0, missing
    except Exception as e:
        return False, [str(e)]

def test_initialization_improved():
    """Test that initialization code has been improved"""
    try:
        response = requests.get('http://localhost:8000/index.html')
        content = response.text
        
        # Look for enhanced initialization patterns
        patterns = [
            'console.log(\'DOMContentLoaded: Initializing ver8a...\')',
            'Force-showing max VAD length field',
            'Force-showing Smart Design container',
            'window.getComputedStyle'
        ]
        
        found = []
        for pattern in patterns:
            if pattern in content:
                found.append(pattern)
        
        return len(found) >= 2, found
    except Exception as e:
        return False, [str(e)]

def main():
    print("=== Testing ver8a Fixes ===")
    
    # Start server
    if not start_server():
        print("❌ Failed to start HTTP server")
        return
    
    # Run tests
    tests = [
        ("Page Loads", test_page_loads),
        ("HTML Elements Exist", test_elements_exist),
        ("JavaScript Functions Exist", test_functions_exist), 
        ("CSS Classes Exist", test_css_classes),
        ("Initialization Improved", test_initialization_improved)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        try:
            if test_name in ["HTML Elements Exist", "JavaScript Functions Exist", "CSS Classes Exist", "Initialization Improved"]:
                success, details = test_func()
                if success:
                    print(f"✅ {test_name}: PASS")
                else:
                    print(f"❌ {test_name}: FAIL")
                    if details:
                        print(f"   Missing: {details}")
                results.append((test_name, success))
            else:
                success = test_func()
                print(f"{'✅' if success else '❌'} {test_name}: {'PASS' if success else 'FAIL'}")
                results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n=== Summary ===")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Fixes appear to be working.")
    else:
        print("⚠️  Some tests failed. Please review the issues above.")

if __name__ == "__main__":
    main()