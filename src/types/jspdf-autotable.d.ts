declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable?: {
            finalY: number;
        };
        internal: {
            getNumberOfPages(): number;
            pages: any[];
            scaleFactor: number;
            pageSize: {
                width: number;
                height: number;
                getWidth(): number;
                getHeight(): number;
            };
        };
        setPage(pageNumber: number): this;
    }
}

export { };
