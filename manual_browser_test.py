#!/usr/bin/env python3
"""
Manual browser test script for ver8a
This script opens a browser to test the fixes manually
"""

import webbrowser
import time
import subprocess
import os

def main():
    print("=== Manual Browser Test for ver8a ===")
    print("Opening browser to test functionality...")
    print()
    print("Manual Test Checklist:")
    print("1. ☐ Page loads without errors")
    print("2. ☐ 'Макс. длина VAD:' field is visible (should be visible in VAD TriG mode)")
    print("3. ☐ Smart Design panel is visible (should be visible in VAD TriG + SPARQL Smart Design mode)")
    print("4. ☐ Result in SPARQL panel is visible")
    print("5. ☐ Click 'Показать' button - should work without errors")
    print("6. ☐ Click 'Очистить' button - should clear the input field")
    print("7. ☐ Click 'Тест' button - should validate input")
    print("8. ☐ Click 'Сохранить как' button - should save file")
    print("9. ☐ Click 'Trig VADv4' example link - should load example data")
    print("10. ☐ Check browser console for any JavaScript errors")
    print()
    print("Expected behavior:")
    print("- All buttons should be clickable and responsive")
    print("- 'Макс. длина VAD:' field should be visible by default")
    print("- Smart Design panel should be visible by default")
    print("- No JavaScript errors in console")
    print("- Example data loading should work")
    print()
    
    # Start server if needed
    try:
        response = subprocess.run(['curl', '-s', 'http://localhost:8000/index.html'], 
                                capture_output=True, text=True, timeout=2)
        if response.returncode != 0:
            raise Exception()
    except:
        print("Starting HTTP server...")
        os.chdir('/tmp/gh-issue-solver-1769497112024/ver8a')
        subprocess.Popen(['python3', '-m', 'http.server', '8000'], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        time.sleep(2)
    
    # Open browser
    url = 'http://localhost:8000/index.html'
    print(f"Opening {url} in browser...")
    webbrowser.open(url)
    
    print()
    print("Browser opened. Please run the manual tests above.")
    print("You can also paste the following in browser console for debugging:")
    print()
    print("fetch('/experiments/debug_ver8a_browser.js')")
    print("  .then(r => r.text())")
    print("  .then(code => eval(code))")
    print()

if __name__ == "__main__":
    main()