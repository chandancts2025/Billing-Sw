import { Directive, HostListener, input, output } from '@angular/core';

@Directive({ selector: '[beDebounceInput]', standalone: true })
export class DebounceInputDirective {
  readonly debounceMs = input(300);
  readonly debouncedValue = output<string>();
  private timer?: number;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    window.clearTimeout(this.timer);
    const value = (event.target as HTMLInputElement).value;
    this.timer = window.setTimeout(() => this.debouncedValue.emit(value), this.debounceMs());
  }
}
