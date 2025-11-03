import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { MenuResponse } from '../models/menu.model';

interface ApiConfig {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  
  // URL này bây giờ trỏ đến Apps Script của bạn để lấy cả cấu hình và gửi đơn hàng.
  private appScriptUrl = 'https://script.google.com/macros/s/AKfycbwTabDy3kijdHPBqMQvLaFtQ505b-ArfjE9Ai-dIxRj90nOheY4mxV8Knp3mM56lqfr/exec';
  
  private iposApiUrl: string | null = null;

  private getConfig(): Observable<ApiConfig> {
    // Gửi yêu cầu GET đến cùng một URL Apps Script để kích hoạt hàm doGet
    return this.http.get<ApiConfig>(this.appScriptUrl).pipe(
      tap(config => {
        // Lưu trữ URL iPOS nhận được để sử dụng sau này
        this.iposApiUrl = config.url;
      }),
      catchError(error => {
        console.error('Error fetching API config:', error);
        return of({ url: '' }); // Trả về config trống nếu có lỗi
      })
    );
  }

  getMenu(): Observable<MenuResponse> {
    if (this.iposApiUrl) {
      // Nếu URL đã được tải, hãy sử dụng nó ngay lập tức
      return this.fetchMenu(this.iposApiUrl);
    } else {
      // Nếu chưa, hãy tải cấu hình trước, sau đó tìm nạp menu
      return this.getConfig().pipe(
        switchMap(config => {
          if (!config.url) {
            // Xử lý trường hợp không thể tải URL cấu hình
            return of({ error: 1, message: 'Không thể tải cấu hình API.', data: null } as any);
          }
          return this.fetchMenu(config.url);
        })
      );
    }
  }

  private fetchMenu(url: string): Observable<MenuResponse> {
    return this.http.get<MenuResponse>(url).pipe(
      catchError(error => {
        console.error('Error fetching menu data:', error);
        return of({ error: 1, message: 'Không thể tải dữ liệu thực đơn.', data: null } as any);
      })
    );
  }

  submitOrder(orderData: any): Observable<any> {
    const payload = JSON.stringify(orderData);
    const headers = new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' });

    // Gửi yêu cầu POST đến cùng một URL Apps Script để kích hoạt hàm doPost
    return this.http.post(this.appScriptUrl, payload, { headers, responseType: 'json' }).pipe(
      catchError(error => {
        console.error('Error submitting order:', error);
        return of({ success: false, error: 'Gửi đơn hàng thất bại.' });
      })
    );
  }
}