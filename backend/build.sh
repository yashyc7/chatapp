#!/bin/bash

# Exit on any error
set -e  

echo "Setting up virtual environment..."
python -m venv /opt/venv
source /opt/venv/bin/activate

echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt
