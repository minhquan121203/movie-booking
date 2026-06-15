import zipfile
import xml.etree.ElementTree as ET

def extract_text(docx_path):
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    text = []
    for paragraph in tree.iterfind('.//w:p', ns):
        texts = [node.text for node in paragraph.iterfind('.//w:t', ns) if node.text]
        if texts:
            text.append(''.join(texts))
    return '\n'.join(text)

text = extract_text('ĐỒ ÁN TỐT NGHIỆP- KIỀU MINH QUÂN.docx')
lines = text.split('\n')
for i, line in enumerate(lines):
    if '4.5.2' in line:
        print("\n--- MATCH ---")
        print("\n".join(lines[i-2:i+15]))
