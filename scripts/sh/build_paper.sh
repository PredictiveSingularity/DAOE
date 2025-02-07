#!/bin/bash

# make sure we have pdflatex installed
if ! command -v pdflatex &> /dev/null; then
    echo "Error: pdflatex not found!"
    echo
    echo "Please install pdflatex before running this script."
    exit 1
fi

# Function to build the paper using pdflatex
build_paper() {
    local tex_file=$1

    if [ -z "$tex_file" ]; then
        echo "Error: No LaTeX file provided!"
        echo
        echo "Usage: $0 <file.tex>"
        echo
        echo "Builds the specified LaTeX file using pdflatex."
        exit 1
    fi

    if [ ! -f "$tex_file" ]; then
        echo "Error: File '$tex_file' not found!"
        exit 1
    fi

    pdflatex "$tex_file"
    bibtex "${tex_file%.tex}.aux"
    pdflatex "$tex_file"
    pdflatex "$tex_file"

    echo "Build complete: ${tex_file%.tex}.pdf"
}

# Call the function with the provided argument
build_paper "$1"