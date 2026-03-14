import win32com.client
import os
import sys

def read_doc_via_com(path):
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(path)
        text = doc.Content.Text
        doc.Close()
        word.Quit()
        return text
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    path = os.path.abspath(r"d:\PrimeToClick-Refaktorisano\Cenovnik Hrvatska primer Meeting Point\DIONYSOS CENE 26 LIMASSOL - LCA-A NAPA - PROTARAS - PAPHOS.doc")
    print(read_doc_via_com(path))
