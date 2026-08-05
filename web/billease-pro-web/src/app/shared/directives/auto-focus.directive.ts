import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[beAutoFocus]', standalone: true })
export class AutoFocusDirective implements AfterViewInit {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  ngAfterViewInit(): void {
    queueMicrotask(() => this.element.nativeElement.focus());
  }
}
