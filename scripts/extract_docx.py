import zipfile
import re
import sys
import os

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml').decode('utf-8')
            # Remove XML tags
            text = re.sub('<[^>]+>', '', xml_content)
            # Basic cleanup
            text = re.sub(r'(\n\s*)+\n', '\n', text)
            
            with open('extracted_doc_content.md', 'w', encoding='utf-8') as f:
                f.write(text)
            print("Extraction successful to extracted_doc_content.md")
    except Exception as e:
        print(f"Error extracting text: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_docx.py <path_to_docx>")
        sys.exit(1)
    
    docx_path = sys.argv[1]
    extract_text_from_docx(docx_path)
