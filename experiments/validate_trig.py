#!/usr/bin/env python3
"""Simple TriG syntax validator that checks for common errors."""

import re
import sys

def validate_trig_file(filepath):
    """Validate TriG file for common syntax errors."""
    errors = []
    warnings = []

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_graph = False
    graph_depth = 0

    for i, line in enumerate(lines, 1):
        # Skip comments and blank lines
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue

        # Check for opening braces
        if '{' in line:
            graph_depth += line.count('{')
            in_graph = True

        # Check for closing braces
        if '}' in line:
            graph_depth -= line.count('}')
            if graph_depth < 0:
                errors.append(f"Line {i}: Unmatched closing brace '}}'" )

        # Check for common syntax issues when in graph
        if in_graph and graph_depth > 0:
            # Check for period followed by predicate (should be semicolon)
            # Look for lines ending with . and next non-comment line starting with vad:
            if stripped.endswith('.') and not stripped.startswith('@'):
                # Check if this is the last statement before closing brace
                next_non_comment_idx = i
                while next_non_comment_idx < len(lines):
                    next_line = lines[next_non_comment_idx].strip()
                    if next_line and not next_line.startswith('#'):
                        # Check if it starts with a predicate (vad:something)
                        if re.match(r'^\s*vad:\w+\s+', next_line):
                            errors.append(f"Line {i}: Period before predicate on line {next_non_comment_idx + 1}. Should use semicolon (;) to continue the triple.")
                        break
                    next_non_comment_idx += 1

        # Check for unmatched quotes (basic check)
        quote_count = line.count('"') - line.count('\\"')
        if quote_count % 2 != 0:
            warnings.append(f"Line {i}: Potential unmatched quote")

    # Check final graph depth
    if graph_depth != 0:
        errors.append(f"Unmatched braces: graph_depth = {graph_depth}")

    return errors, warnings

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'ver8/Trig_VADv3.ttl'

    print(f"Validating {filepath}...")
    errors, warnings = validate_trig_file(filepath)

    if errors:
        print("\nERRORS:")
        for error in errors:
            print(f"  - {error}")

    if warnings:
        print("\nWARNINGS:")
        for warning in warnings:
            print(f"  - {warning}")

    if not errors and not warnings:
        print("\n✓ No obvious syntax errors found!")
        sys.exit(0)
    elif errors:
        print(f"\n✗ Found {len(errors)} error(s)")
        sys.exit(1)
    else:
        print(f"\n⚠ Found {len(warnings)} warning(s)")
        sys.exit(0)
