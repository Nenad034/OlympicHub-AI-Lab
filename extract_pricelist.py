import pdfplumber
import sys
import json
import pandas as pd
import os

def extract_pdf(path):
    data = []
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                tables = page.extract_tables()
                data.append({
                    "page": page.page_number,
                    "text": text,
                    "tables": tables
                })
        return data
    except Exception as e:
        return {"error": str(e)}

def extract_excel(path):
    try:
        # Read all sheets
        xlsx = pd.ExcelFile(path)
        result = {}
        for sheet_name in xlsx.sheet_names:
            df = pd.read_excel(path, sheet_name=sheet_name)
            # Convert to list of dicts for JSON
            result[sheet_name] = df.to_dict(orient='records')
        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = r"d:\PrimeToClick-Refaktorisano\Cenovnici excel primeri\Solvex primer cena.xlsx"
    
    ext = os.path.splitext(path)[1].lower()
    if ext == '.pdf':
        result = extract_pdf(path)
    elif ext in ['.xlsx', '.xls']:
        result = extract_excel(path)
    else:
        result = {"error": f"Unsupported extension: {ext}"}
        
    output_path = "pricelist_extracted.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"Extraction completed and saved to {output_path}")
