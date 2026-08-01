file_path = r'c:\WorldNewz\worldnewz_UI\src\pages\AmazonProducts.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
in_component = False
for idx, line in enumerate(lines, start=1):
    if 'const AmazonProducts: React.FC' in line:
        in_component = True
        print(f"Component starts at line {idx}, depth before: {depth}")
    
    opens = line.count('{')
    closes = line.count('}')
    depth += opens - closes
    
    if in_component and depth == 0:
        print(f"Component ends at line {idx}")
        in_component = False
