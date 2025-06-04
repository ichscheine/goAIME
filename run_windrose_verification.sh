#!/bin/bash
# Run the wind rose chart verification script and serve the results

echo "Running Wind Rose Chart Fix Verification..."

# Activate conda environment if it exists
if command -v conda &> /dev/null && conda env list | grep -q "goAIME"; then
    echo "Activating goAIME conda environment..."
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate goAIME
fi

# Run the verification script
python verify_windrose_fix.py

# Check if the HTML file was generated
if [ -f "verify_windrose_fix.html" ]; then
    echo "Verification HTML file generated successfully."
    
    # Serve the HTML file using Python's built-in HTTP server
    echo "Starting HTTP server to view results..."
    echo "Open http://localhost:8000/verify_windrose_fix.html in your browser"
    
    # Use python3 if available, otherwise fall back to python
    if command -v python3 &> /dev/null; then
        python3 -m http.server
    else
        python -m SimpleHTTPServer
    fi
else
    echo "Error: Verification HTML file not generated."
    exit 1
fi
