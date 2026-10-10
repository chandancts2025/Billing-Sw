import { Injectable } from '@angular/core';

export type ReceiptPaperSize = '80' | 'a4' | '58';

@Injectable({ providedIn: 'root' })
export class PrintService {
  printHtml(html: string, title = 'BillEase Pro'): void {
    this.printInvoiceHtml(html, title, '80');
  }

  printInvoiceHtml(html: string, title = 'BillEase Pro', mode: ReceiptPaperSize = '80'): void {
    const isA4 = mode === 'a4';
    const is58 = mode === '58';

    const pageCss = isA4
      ? `@page { size: A4 portrait; margin: 10mm; } html, body { width: 100%; max-width: 210mm; margin: 0 auto; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; background: #fff; }`
      : is58
      ? `@page { size: 58mm auto; margin: 0; } html, body { width: 58mm; margin: 0 auto; padding: 4px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; box-sizing: border-box; background: #fff; }`
      : `@page { size: 80mm auto; margin: 0; } html, body { width: 80mm; margin: 0 auto; padding: 6px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; box-sizing: border-box; background: #fff; }`;

    const printStyleTag = `<style id="be-print-page-style">${pageCss} @media print { html, body { width: ${isA4 ? '100%' : is58 ? '58mm' : '80mm'} !important; margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>`;

    let styledHtml = html;
    if (styledHtml.includes('<head>')) {
      styledHtml = styledHtml.replace('<head>', `<head>${printStyleTag}`);
    } else if (styledHtml.includes('<html>')) {
      styledHtml = styledHtml.replace('<html>', `<html><head><meta charset="utf-8"><title>${title}</title>${printStyleTag}</head>`);
    } else {
      styledHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>${printStyleTag}</head><body>${styledHtml}</body></html>`;
    }

    const popup = window.open('', '_blank', isA4 ? 'width=950,height=850' : 'width=460,height=720');
    if (popup) {
      popup.document.open();
      popup.document.write(styledHtml);
      popup.document.close();
      setTimeout(() => {
        try {
          popup.focus();
          popup.print();
        } catch {
          // Popup print handled
        }
      }, 250);
    }
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
