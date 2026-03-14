from docx import Document
import sys

def read_doc(path):
    try:
        doc = Document(path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    path = r"d:\PrimeToClick-Refaktorisano\Cenovnik Hrvatska primer Meeting Point\DIONYSOS CENE 26 LIMASSOL - LCA-A NAPA - PROTARAS - PAPHOS.doc"
    print(read_doc(path))
