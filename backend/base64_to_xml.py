image_file = "/Users/daoming/Desktop/Screenshot.png"

import subprocess
from PIL import Image

# Step 1: Convert PNG to PBM (No ImageMagick needed)
image = Image.open(image_file).convert("L")
image = image.point(lambda x: 0 if x < 128 else 255, '1')
image.save("input.pbm")
print("PBM file saved as input.pbm")

# Step 2: Run Potrace to generate SVG
subprocess.run(["potrace", "-s", "-t 3", "-a 1",  "input.pbm", "-o", "output.svg"], check=True)

print("SVG file saved as output.svg")
