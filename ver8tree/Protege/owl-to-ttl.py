#!/usr/bin/env python3
"""
OWL/XML to TTL Converter for Protege

This script converts OWL/XML files (edited in Protege) back to Turtle (.ttl)
format for use in the RDF Grapher project.

Usage:
    python owl-to-ttl.py input.owl [output.ttl]

If output file is not specified, it will be created with the same name
and .ttl extension.

Requirements:
    pip install rdflib

Author: RDF Grapher Project
Date: 2026-01-27
"""

import sys
import os
from pathlib import Path

try:
    from rdflib import Graph, Namespace
    from rdflib.namespace import RDF, RDFS, OWL, XSD, DCTERMS
except ImportError:
    print("Error: rdflib is required. Install it with: pip install rdflib")
    sys.exit(1)


# Project-specific namespaces
VAD = Namespace("http://example.org/vad#")


def convert_owl_to_ttl(input_file: str, output_file: str = None) -> str:
    """
    Convert an OWL/XML file to Turtle format.

    Args:
        input_file: Path to input .owl/.rdf file
        output_file: Path to output .ttl file (optional)

    Returns:
        Path to the output file
    """
    # Validate input file
    input_path = Path(input_file)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    # Determine output file path
    if output_file is None:
        output_file = str(input_path.with_suffix('.ttl'))

    output_path = Path(output_file)

    print(f"Converting: {input_file}")
    print(f"Output: {output_file}")

    # Load the OWL/XML file
    g = Graph()

    # Bind common prefixes for cleaner output
    g.bind("rdf", RDF)
    g.bind("rdfs", RDFS)
    g.bind("owl", OWL)
    g.bind("xsd", XSD)
    g.bind("dcterms", DCTERMS)
    g.bind("vad", VAD)

    try:
        g.parse(input_file, format='xml')
        print(f"Loaded {len(g)} triples from input file")
    except Exception as e:
        raise ValueError(f"Error parsing OWL file: {e}")

    # Serialize to Turtle format
    try:
        g.serialize(destination=output_file, format='turtle')
        print(f"Successfully converted to Turtle format")
    except Exception as e:
        raise ValueError(f"Error writing TTL file: {e}")

    return output_file


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nExamples:")
        print("  python owl-to-ttl.py ontology.owl")
        print("  python owl-to-ttl.py edited_ontology.owl ../vad-basic-ontology.ttl")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        result = convert_owl_to_ttl(input_file, output_file)
        print(f"\nConversion complete!")
        print(f"File saved to: '{result}'")
        print("\nNote: You may need to review the output and adjust formatting")
        print("to match the original file structure.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
