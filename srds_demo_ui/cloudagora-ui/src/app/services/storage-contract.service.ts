import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageContract, Wallet, RegistryEntry } from '../models/contract';

@Injectable({
  providedIn: 'root'
})
export class StorageContractService {
  // Backend URL.
  private backendUrl: string = '';

  // Get Storage Contracts URL.
  private contractsUrl: string = 'contracts';

  // Update Storage Contract Status URLs.
  private activateUrl: string = 'activate';
  private completeUrl: string = 'complete';
  private cancelUrl: string = 'cancel';
  private invalidateUrl: string = 'invalidate';

  // Storage Contract Actions URLs.
  private uploadFileUrl: string = 'upload-file';
  private challengeUrl: string = 'challenge';

  // Get Wallet URL.
  private walletUrl: string = 'config';

  // Get Registry URL.
  private registryUrl: string = 'registry';

  constructor(private http: HttpClient) { }

  getBackendUrl(): string {
    return this.backendUrl;
  }

  setBackendUrl(backendUrl: string): void {
    this.backendUrl = backendUrl;
  }

  getClientStorageContracts(): Observable<StorageContract[]> {
      const url = `${this.backendUrl}/${this.contractsUrl}/client`;
      return this.http.get<StorageContract[]>(url);
  }

  getProviderStorageContracts(): Observable<StorageContract[]> {
    const url = `${this.backendUrl}/${this.contractsUrl}/provider`;
    return this.http.get<StorageContract[]>(url);
  }

  getStorageContract(address: string): Observable<StorageContract> {
    const url = `${this.backendUrl}/${this.contractsUrl}/${address}`;
    return this.http.get<StorageContract>(url);
  }

  activateContract(address: string): Observable<any> {
    const url = `${this.backendUrl}/${this.activateUrl}/${address}`;

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.put(url, {}, httpOptions);
  }

  completeContract(address: string): Observable<any> {
    const url = `${this.backendUrl}/${this.completeUrl}/${address}/`;

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.put(url, {}, httpOptions);
  }

  cancelContract(address: string): Observable<any> {
    const url = `${this.backendUrl}/${this.cancelUrl}/${address}/`;

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.put(url, {}, httpOptions);
  }

  invalidateContract(address: string): Observable<any> {
    const url = `${this.backendUrl}/${this.invalidateUrl}/${address}/`;

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.put(url, {}, httpOptions);
  }

  uploadFile(address: string, file: File): Observable<any> {
    const url = `${this.backendUrl}/${this.uploadFileUrl}`;
    const formData: FormData = new FormData();

    formData.append('file', file, file.name);
    formData.append('address', address);

    return this.http.post(url, formData);
  }

  challengeContract(address: string): Observable<any> {
    const url = `${this.backendUrl}/${this.challengeUrl}/${address}`;

    return this.http.get(url);
  }

  getWallet(): Observable<Wallet> {
    const url = `${this.backendUrl}/${this.walletUrl}`;
    return this.http.get<Wallet>(url);
  }

  getRegistry(): Observable<RegistryEntry[]> {
    const url = `${this.backendUrl}/${this.registryUrl}`;
    return this.http.get<RegistryEntry[]>(url);
  }
}
