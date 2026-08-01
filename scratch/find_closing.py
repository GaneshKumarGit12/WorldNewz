file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(844, len(lines)):
    line = lines[idx]
    if line.strip() == ');' or line.strip() == '};':
        print(f"Line {idx+1}: {line.strip()}")
