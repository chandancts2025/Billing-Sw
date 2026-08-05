import { Directive, HostListener } from '@angular/core';

@Directive({ selector: '[beNumberOnly]', standalone: true })
export class NumberOnlyDirective {
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', '.'];
    if (!allowed.includes(event.key) && !/^\d$/.test(event.key)) event.preventDefault();
  }
}
