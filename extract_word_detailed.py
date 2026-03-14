import win32com.client
import os
import json

def extract_doc_data(path):
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(path)
        
        # Get text
        full_text = doc.Content.Text
        
        # Get tables
        tables_data = []
        for table in doc.Tables:
            rows = []
            for row in table.Rows:
                cells = []
                for cell in row.Cells:
                    # Remove end of cell markers
                    text = cell.Range.Text.strip('\r\x07')
                    cells.append(text)
                rows.append(cells)
            tables_data.append(rows)
            
        doc.Close()
        word.Quit()
        
        return {
            "text": full_text,
            "tables": tables_data
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    path = os.path.abspath(r"d:\PrimeToClick-Refaktorisano\Cenovnik Hrvatska primer Meeting Point\DIONYSOS CENE 26 LIMASSOL - LCA-A NAPA - PROTARAS - PAPHOS.doc")
    result = extract_doc_data(path)
    
    with open("pricelist_extracted_dionysos.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
        
    print("Extraction successful. Saved to pricelist_extracted_dionysos.json")
