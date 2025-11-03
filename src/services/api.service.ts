import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MenuResponse } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'https://weborder.ipos.vn/api/v1/menu?pos_parent=BRAND-9VV6&pos_id=104679';
  // IMPORTANT: Replace this placeholder with your actual Google Apps Script Web App URL
  private appScriptUrl = 'https://script.google.com/macros/s/AKfycbxNbPXeQuRSCTRSys8jWXSW1kKROF8MKvFvYZ6oG1R_4fWXKJ8nexkIa6NG2OIt6LtT/exec';

  getMenu(): Observable<MenuResponse> {
    return this.http.get<MenuResponse>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching menu data:', error);
        return of({ error: 1, message: 'Không thể tải dữ liệu thực đơn.', data: null } as any);
      })
    );
  }

  submitOrder(orderData: any): Observable<any> {
    // By default, Angular's HttpClient sends a JSON payload with a 'Content-Type' of 'application/json'.
    // This triggers a CORS preflight (OPTIONS) request, which Google Apps Script web apps do not handle, causing the request to fail.
    // To work around this, we stringify the payload manually and send it as 'text/plain'.
    // The browser does not send a preflight request for this content type, avoiding the CORS issue.
    // The Apps Script backend can then parse this text string back into a JSON object.
    const payload = JSON.stringify(orderData);
    const headers = new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' });

    return this.http.post(this.appScriptUrl, payload, { headers, responseType: 'json' }).pipe(
      catchError(error => {
        console.error('Error submitting order:', error);
        // Return an observable with an error object
        return of({ success: false, error: 'Gửi đơn hàng thất bại.' });
      })
    );
  }
}