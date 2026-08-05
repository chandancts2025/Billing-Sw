import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';

export abstract class ApiService {
  protected readonly http = inject(HttpClient);
  protected readonly apiBase = environment.apiBaseUrl;

  protected url(path: string): string {
    return `${this.apiBase}/${path.replace(/^\/+/, '')}`;
  }

  protected params(values: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return params;
  }
}
