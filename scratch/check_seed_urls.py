import re

cs_file = r'c:\WorldNewz\WorldNewzWebAPI\Services\AmazonProductService.cs'
with open(cs_file, 'r', encoding='utf-8') as f:
    text = f.read()

image_urls = re.findall(r'ImageUrl\s*=\s*"([^"]+)"', text)
print("Total ImageUrls in C#:", len(image_urls))

media_i = [u for u in image_urls if '/images/I/' in u]
images_p = [u for u in image_urls if '/images/P/' in u]
others = [u for u in image_urls if '/images/I/' not in u and '/images/P/' not in u]

print(f"Media /images/I/ (Valid Real Images): {len(media_i)}")
print(f"Legacy /images/P/ (Needs Fix): {len(images_p)}")
print(f"Others (Unsplash/Local): {len(others)}")

print("\nSample Media /images/I/ URLs:")
for u in media_i[:5]:
    print(" ", u)

print("\nSample Legacy /images/P/ URLs:")
for u in images_p[:5]:
    print(" ", u)
