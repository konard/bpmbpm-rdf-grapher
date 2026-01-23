#!/usr/bin/env python3
"""
Script to clean up EXAMPLE_DATA in index.html, keeping only 'trig-vad-v2' entry.
"""

import re

input_file = '/tmp/gh-issue-solver-1769204265441/ver8/index.html'
output_file = '/tmp/gh-issue-solver-1769204265441/ver8/index.html'

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of EXAMPLE_DATA
example_data_start = content.find("const EXAMPLE_DATA = {")
if example_data_start == -1:
    print("Error: Could not find EXAMPLE_DATA")
    exit(1)

# Find the trig-vad-v2 entry
trig_vad_v2_start = content.find("'trig-vad-v2': `", example_data_start)
if trig_vad_v2_start == -1:
    print("Error: Could not find trig-vad-v2 entry")
    exit(1)

# Find where turtle entry starts (first entry after opening brace)
turtle_start = content.find("turtle: `", example_data_start)
if turtle_start == -1:
    print("Error: Could not find turtle entry")
    exit(1)

# Get the content between "const EXAMPLE_DATA = {" and before turtle
prefix_end = content.find("\n", example_data_start) + 1

# Find where trig-vad-v2 entry ends (look for the closing `} after it followed by proper indentation for next section)
# Search for the pattern that ends the EXAMPLE_DATA object
example_data_end = content.find("        };\n\n        // ====", trig_vad_v2_start)
if example_data_end == -1:
    # Try alternate pattern
    example_data_end = content.find("}\n        };", trig_vad_v2_start)
    if example_data_end != -1:
        example_data_end = content.find("        };", example_data_end)

if example_data_end == -1:
    print("Error: Could not find end of EXAMPLE_DATA")
    exit(1)

# Extract the trig-vad-v2 content (from its key to the closing backtick+comma or backtick)
# Find where the content ends (look for the closing backtick followed by newline and closing brace)
trig_vad_v2_content_end = content.rfind("`\n        };", trig_vad_v2_start, example_data_end + 20)
if trig_vad_v2_content_end == -1:
    # Alternative: look for backtick followed by whitespace and closing brace
    print("Looking for alternative pattern...")
    trig_vad_v2_content_end = content.rfind("`", trig_vad_v2_start, example_data_end + 100)

if trig_vad_v2_content_end == -1:
    print("Error: Could not find end of trig-vad-v2 content")
    exit(1)

# Extract the trig-vad-v2 entry
trig_vad_v2_entry = content[trig_vad_v2_start:trig_vad_v2_content_end + 1]

# Construct new EXAMPLE_DATA
new_example_data = """const EXAMPLE_DATA = {
            // Только TriG VADv2 пример (остальные форматы удалены при минимизации)
            """ + trig_vad_v2_entry + """
        };"""

# Find the full EXAMPLE_DATA block to replace
full_example_data_end = content.find("        };", example_data_end)
if full_example_data_end == -1:
    full_example_data_end = example_data_end + 10
else:
    full_example_data_end += len("        };")

old_example_data = content[example_data_start:full_example_data_end]

print(f"Found EXAMPLE_DATA from position {example_data_start} to {full_example_data_end}")
print(f"Old length: {len(old_example_data)}")
print(f"New length: {len(new_example_data)}")

# Replace
new_content = content[:example_data_start] + new_example_data + content[full_example_data_end:]

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully cleaned up EXAMPLE_DATA!")
