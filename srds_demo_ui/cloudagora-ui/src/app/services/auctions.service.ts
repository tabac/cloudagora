import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageContractService } from './storage-contract.service';
import { ComputeContractService } from './compute-contract.service';
import { Auction } from '../models/contract';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  // Auctions Url.
  private auctionsUrl: string = 'auctions';
  private placeOfferUrl: string = 'bid';
  private finalizeUrl: string = 'finalize';
  private createAuctionUrl: string = 'auction';

  constructor(
    private http: HttpClient,
    private storageContractService: StorageContractService,
    private computeContractService: ComputeContractService
  ) { }

  getStorageAuctions(): Observable<Auction[]> {
    const backendUrl = this.storageContractService.getBackendUrl();

    const url = `${backendUrl}/${this.auctionsUrl}/storage`;

    return this.http.get<Auction[]>(url);
  }

  getComputeAuctions(): Observable<Auction[]> {
    const backendUrl = this.storageContractService.getBackendUrl();

    const url = `${backendUrl}/${this.auctionsUrl}/compute`;

    return this.http.get<Auction[]>(url);
  }

  getAuction(address: string): Observable<Auction> {
    const backendUrl = this.storageContractService.getBackendUrl();

    const url = `${backendUrl}/${this.auctionsUrl}/${address}`;

    return this.http.get<Auction>(url);
  }

  placeOffer(address: string, amount: number): Observable<Auction> {
    const backendUrl = this.storageContractService.getBackendUrl();

    const url = `${backendUrl}/${this.placeOfferUrl}/${address}/${amount}`;

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.put<Auction>(url, {}, httpOptions);
  }

  finalize(address: string, file: File = undefined): Observable<Auction> {
    const backendUrl = this.storageContractService.getBackendUrl();

    const url = `${backendUrl}/${this.finalizeUrl}/${address}`;

    const formData: FormData = new FormData();

    if (file != undefined) {
        formData.append('file', file, file.name);
    }
    formData.append('address', address);

    return this.http.post<Auction>(url, formData);
  }

  create(auctionType: string, filesizeOrGas: number, duration: number): Observable<any> {
    const backendUrl = this.storageContractService.getBackendUrl();

    const type = auctionType.toLowerCase();
    const url = `${backendUrl}/${this.createAuctionUrl}/${type}`;

    const body = {
      duration: duration,
      filesizeOrGas: filesizeOrGas,
    };

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.post(url, body, httpOptions);
  }
}
