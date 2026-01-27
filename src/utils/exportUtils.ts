import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
};

export const exportToExcel = async (data: any[], filename: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    if (data.length > 0) {
        // Headers
        const columns = Object.keys(data[0]).map(key => ({
            header: key,
            key: key,
            width: 20
        }));
        worksheet.columns = columns;

        // Rows
        worksheet.addRows(data);

        // Styling headers
        worksheet.getRow(1).font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
};

export const exportToXML = (data: any[], filename: string) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
    data.forEach(item => {
        xml += '  <item>\n';
        Object.entries(item).forEach(([key, value]) => {
            xml += `    <${key}>${value}</${key}>\n`;
        });
        xml += '  </item>\n';
    });
    xml += '</root>';
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xml`;
    link.click();
};

export const exportToPDF = (data: any[], filename: string, title: string) => {
    const doc = new jsPDF() as any;
    doc.text(title, 14, 15);

    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => Object.values(item));

    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 20,
    });

    doc.save(`${filename}.pdf`);
};
