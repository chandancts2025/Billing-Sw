import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({ selector: '[beCurrencyFormat]', standalone: true })
export class CurrencyFormatDirective {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('blur')
  format(): void {
    const value = Number(this.element.nativeElement.value);
    if (!Number.isNaN(value)) this.element.nativeElement.value = value.toFixed(2);
  }
}
