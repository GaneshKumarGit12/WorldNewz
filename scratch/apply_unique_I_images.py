import re

# Exact unique media image URLs extracted directly from Amazon India CDN for all 30 products
unique_images = {
    "B0DTXVM898": "https://m.media-amazon.com/images/I/61dKp+x6GHL._SL1500_.jpg",
    "B0CGPTBFYL": "https://m.media-amazon.com/images/I/615XCuiyUdL._SL1500_.jpg",
    "B0D14QYFJP": "https://m.media-amazon.com/images/I/51m5Aq6EV+L._SL1500_.jpg",
    "B0B69589JY": "https://m.media-amazon.com/images/I/51gdpm+AWtL._SL1500_.jpg",
    "B0FNMQ24NV": "https://m.media-amazon.com/images/I/414tl3eqzzL._SL1500_.jpg",
    "B0DGY2SH77": "https://m.media-amazon.com/images/I/419lHKIHnrL._SL1500_.jpg",
    "B0DJD8PJGG": "https://m.media-amazon.com/images/I/41e-+ZWnT1L._SL1500_.jpg",
    "B0DGD58SQV": "https://m.media-amazon.com/images/I/416gOfSzLRL._SL1500_.jpg",
    "B0DGTWXVZZ": "https://m.media-amazon.com/images/I/5160oX6raFL._SL1500_.jpg",
    "B09XJ8K726": "https://m.media-amazon.com/images/I/41sFzeJ9FrL._SL1500_.jpg",
    "B0GJDL274Z": "https://m.media-amazon.com/images/I/41tGNkgJAwL._SL1500_.jpg",
    "B0GGHLCK2S": "https://m.media-amazon.com/images/I/31mw7BdUo3L._SL1500_.jpg",
    "B0GK93PM58": "https://m.media-amazon.com/images/I/61cnBvpJeiL._SL1500_.jpg",
    "B09P446B53": "https://m.media-amazon.com/images/I/41-aBPZxRKL._SL1500_.jpg",
    "B0FXRD8TC2": "https://m.media-amazon.com/images/I/51tgBhT6PXL._SL1500_.jpg",
    "B0DRVSSYZC": "https://m.media-amazon.com/images/I/61IYOSWsZgL._SL1500_.jpg",
    "B0BZTY4FB5": "https://m.media-amazon.com/images/I/71ZKCml2utL._SL1500_.jpg",
    "B0DSJJL5RD": "https://m.media-amazon.com/images/I/416Mv8iZlZL._SL1500_.jpg",
    "B0DR2CXY7C": "https://m.media-amazon.com/images/I/31n7I0aOy-L._SL1500_.jpg",
    "B0D7MJJJD7": "https://m.media-amazon.com/images/I/51FW1QZtQdL._SL1500_.jpg",
    "B0DY57KYRH": "https://m.media-amazon.com/images/I/41UDFfQC29L._SL1500_.jpg",
    "B0CB3VNBT2": "https://m.media-amazon.com/images/I/7146knrdvtL._SL1500_.jpg",
    "B0GH2C7RMQ": "https://m.media-amazon.com/images/I/611WGFSTB3L._SL1500_.jpg",
    "B0G7GGYHKX": "https://m.media-amazon.com/images/I/81viAdQOhdL._SL1500_.jpg",
    "B0DGD9SP8S": "https://m.media-amazon.com/images/I/5160oX6raFL._SL1500_.jpg",
    "B0CMTLZ5N3": "https://m.media-amazon.com/images/I/51H3xINqrrL._SL1500_.jpg",
    "B08K391DL3": "https://m.media-amazon.com/images/I/61qYK+gHGoL._SL1500_.jpg",
    "B0BSS245SY": "https://m.media-amazon.com/images/I/71-DLYPltbL._SL1500_.jpg",
    "B0F2MVC3LW": "https://m.media-amazon.com/images/I/91vgYb-7tGL._SL1500_.jpg",
    "B0GY5J8YM5": "https://m.media-amazon.com/images/I/71kaUIAYZiL._SL1500_.jpg"
}

cs_file = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(cs_file, 'r', encoding='utf-8') as f:
    content = f.read()

count = 0
for asin, new_img in unique_images.items():
    # Match ImageUrl inside the block for this ASIN
    pattern = rf'(Asin\s*=\s*"{asin}".*?ImageUrl\s*=\s*")([^"]+)(")'
    def repl(m):
        return m.group(1) + new_img + m.group(3)
    new_content, n = re.subn(pattern, repl, content, flags=re.DOTALL)
    if n > 0:
        content = new_content
        count += n

with open(cs_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully updated {count} product image URLs in {cs_file}!")
