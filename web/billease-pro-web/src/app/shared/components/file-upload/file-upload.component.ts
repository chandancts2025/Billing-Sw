import { Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'be-file-upload',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <label class="upload">
      <input type="file" [accept]="accept()" (change)="selected($event)">
      <mat-icon>upload_file</mat-icon>
      <span>{{ fileName() || label() }}</span>
    </label>
  `,
  styles: [`.upload { display: flex; align-items: center; gap: 8px; min-height: 38px; border: 1px dashed #98a2b3; border-radius: 6px; padding: 8px 10px; cursor: pointer; } input { display: none; }`]
})
export class FileUploadComponent {
  readonly label = input('Upload file');
  readonly accept = input('*/*');
  readonly maxBytes = input(200 * 1024);
  readonly fileChange = output<{ file: File; dataUrl: string }>();
  readonly rejected = output<string>();
  readonly fileName = signal('');

  selected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > this.maxBytes()) { this.rejected.emit(`File must be ${Math.round(this.maxBytes() / 1024)}KB or less.`); return; }
    const reader = new FileReader();
    reader.onload = () => { this.fileName.set(file.name); this.fileChange.emit({ file, dataUrl: String(reader.result) }); };
    reader.readAsDataURL(file);
  }
}
