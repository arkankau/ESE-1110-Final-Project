import requests

def convert_dwg_to_png(input_dwg_file, output_png_file):
    api_key = "secret_Sugq03f2d1jpneWF"  # Replace with your ConvertAPI key
    url = "https://v2.convertapi.com/convert/dwg/to/png"
    payload = {"File": open(input_dwg_file, 'rb'), "apiKey": api_key}
    response = requests.post(url, files=payload)
    
    with open(output_png_file, 'wb') as f:
        f.write(response.content)

# Usage example
# convert_dwg_to_png("my_drawing.dwg", "converted_image.png")