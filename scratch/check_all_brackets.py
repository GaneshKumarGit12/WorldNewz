file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for idx, line in enumerate(lines, start=1):
    opens = line.count('{')
    closes = line.count('}')
    depth += opens - closes
    if depth < 0:
        print(f"Negative depth at line {idx}: {line.strip()}")

print(f"Final depth (should be 0): {depth}")
