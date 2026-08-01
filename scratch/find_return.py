file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines, start=1):
    if 'return' in line:
        print(f"Line {idx}: {line.strip()}")
