#!/usr/bin/env python3
"""
TTL to OWL/XML Converter for Protege

This script converts Turtle (.ttl) files to OWL/XML format for better
compatibility with Protege, especially when working with ontology features.

Usage:
    python ttl-to-owl.py input.ttl [output.owl]

If output file is not specified, it will be created with the same name
and .owl extension.

Requirements:
    pip install rdflib

Author: RDF Grapher Project
Date: 2026-01-27
"""

import sys
import os
from pathlib import Path

try:
    from rdflib import Graph
except ImportError:
    print("Error: rdflib is required. Install it with: pip install rdflib")
    sys.exit(1)


def convert_ttl_to_owl(input_file: str, output_file: str = None) -> str:
    """
    Convert a Turtle file to OWL/XML format.

    Args:
        input_file: Path to input .ttl file
        output_file: Path to output .owl file (optional)

    Returns:
        Path to the output file
    """
    # Validate input file
    input_path = Path(input_file)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    if not input_path.suffix.lower() == '.ttl':
        print(f"Warning: Input file doesn't have .ttl extension: {input_file}")

    # Determine output file path
    if output_file is None:
        output_file = str(input_path.with_suffix('.owl'))

    output_path = Path(output_file)

    print(f"Converting: {input_file}")
    print(f"Output: {output_file}")

    # Load the TTL file
    g = Graph()
    try:
        g.parse(input_file, format='turtle')
        print(f"Loaded {len(g)} triples from input file")
    except Exception as e:
        raise ValueError(f"Error parsing TTL file: {e}")

    # Serialize to OWL/XML format
    try:
        g.serialize(destination=output_file, format='xml')
        print(f"Successfully converted to OWL/XML format")
    except Exception as e:
        raise ValueError(f"Error writing OWL file: {e}")

    return output_file


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nExamples:")
        print("  python ttl-to-owl.py ../vad-basic-ontology.ttl")
        print("  python ttl-to-owl.py ../vad-basic-ontology_tech_Appendix.ttl output.owl")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        result = convert_ttl_to_owl(input_file, output_file)
        print(f"\nConversion complete!")
        print(f"Open '{result}' in Protege using File -> Open...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
