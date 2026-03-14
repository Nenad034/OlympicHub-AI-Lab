import pandas as pd
import json

def analyze_excel(path):
    try:
        xl = pd.ExcelFile(path)
        data = {}
        for sheet_name in xl.sheet_names:
            df = xl.parse(sheet_name)
            # Convert to dict, handling NaNs
            data[sheet_name] = df.head(50).to_dict(orient='records')
        return data
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    files = [
        r"d:\PrimeToClick-Refaktorisano\Cenovnici excel primeri\Allotment rates ANG 2026 .xlsx",
        r"d:\PrimeToClick-Refaktorisano\Cenovnici excel primeri\Solvex primer cena.xlsx",
        r"d:\PrimeToClick-Refaktorisano\Cenovnici excel primeri\TO RATES 2026..xlsx"
    ]
    
    results = {}
    for f in files:
        results[f] = analyze_excel(f)
        
    with open("excel_analysis.json", "w", encoding="utf-8") as out:
        json.dump(results, out, indent=2, ensure_ascii=False, default=str)
    print("Analysis finished. Saved to excel_analysis.json")
