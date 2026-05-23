import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { RepairOrderPhoto } from '../models/repair-order-photo';
import { ToastService } from './toast.service';
import { TranslationService } from './translation.service';

/**
 * Allowed image MIME types and extensions for repair order photos.
 * Only JPG / JPEG are accepted (matches backend AllowedFileExtensions.Photos).
 */
const ALLOWED_MIME = ['image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg'];

@Injectable({
  providedIn: 'root',
})
export class RepairOrderPhotoService {
  private apiUrl = '/api/repairorderphoto';

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private ts: TranslationService,
  ) {}

  /** Returns true when the file is a valid JPG/JPEG image. */
  isJpegFile(file: File): boolean {
    if (!file) return false;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const mimeOk = ALLOWED_MIME.includes((file.type || '').toLowerCase());
    const extOk = ALLOWED_EXTENSIONS.includes(ext);
    // Accept when either MIME or extension matches JPG (some browsers omit MIME).
    return mimeOk || extOk;
  }

  getPhotos(repairOrderId: number): Observable<RepairOrderPhoto[]> {
    return this.http.get<RepairOrderPhoto[]>(`${this.apiUrl}/${repairOrderId}`);
  }

  uploadPhotos(
    repairOrderId: number,
    files: File[],
    description?: string,
  ): Observable<{ message: string; photos: RepairOrderPhoto[] }> {
    // Client-side validation: only JPG allowed. Show a popup and abort
    // upload if any file has an unsupported format.
    const invalid = files.filter((f) => !this.isJpegFile(f));
    if (invalid.length > 0) {
      const msg = this.ts.t('orderDetail.photoFormatNotSupported');
      this.toast.error(msg);
      return throwError(() => new Error(msg));
    }

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (description) formData.append('description', description);
    return this.http.post<{ message: string; photos: RepairOrderPhoto[] }>(
      `${this.apiUrl}/${repairOrderId}`,
      formData,
    );
  }

  deletePhoto(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
