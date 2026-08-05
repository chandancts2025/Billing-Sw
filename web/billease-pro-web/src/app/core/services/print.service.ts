import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrintService {
  printHtml(html: string, title = 'BillEase Pro'): void {
    const popup = window.open('', '_blank', 'width=1000,height=800');
    popup?.document.write(`<html><head><title>${title}</title></head><body>${html}</body></html>`);
    popup?.document.close();
    popup?.print();
  }

  download(filename: string, type: string, content: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
