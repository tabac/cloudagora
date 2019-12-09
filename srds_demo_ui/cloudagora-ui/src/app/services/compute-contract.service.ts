import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComputeContract, Wallet, RegistryEntry } from '../models/contract';

@Injectable({
  providedIn: 'root'
})
export class ComputeContractService {
  // Backend URL.
  private backendUrl: string = '';

  // Get Compute Contracts URL.
  private contractsUrl: string = 'compcontracts';

  // Update Compute Contract Status URLs.
  private activateUrl: string = 'compactivate';
  private completeUrl: string = 'compcomplete';
  private cancelUrl: string = 'compcancel';
  private invalidateUrl: string = 'invalidate';

  private updateContractStatusUrl: string = 'computestatus';

  // Compute Contract Actions URLs.
  private uploadTaskUrl: string = 'submit';
  private challengeUrl: string = 'challenge';
  private executeTaskUrl: string = 'select';

  // Get Wallet URL.
  private walletUrl: string = 'config';

  // Get Registry URL.
  private registryUrl: string = 'registry';

  private verifierUrl: string = 'verifier';

  constructor(private http: HttpClient) { }

  getBackendUrl(): string {
    return this.backendUrl;
  }

  setBackendUrl(backendUrl: string): void {
    this.backendUrl = backendUrl;
  }

  getClientTaskContracts(): Observable<ComputeContract[]> {
      const url = `${this.backendUrl}/${this.contractsUrl}/client`;
      return this.http.get<ComputeContract[]>(url);
  }

  getProviderTaskContracts(): Observable<ComputeContract[]> {
    const url = `${this.backendUrl}/${this.contractsUrl}/provider`;
    return this.http.get<ComputeContract[]>(url);
  }

  getComputeContract(address: string): Observable<ComputeContract> {
    const url = `${this.backendUrl}/${this.contractsUrl}/${address}`;
    return this.http.get<ComputeContract>(url);
  }

  activateContract(address: string): Observable<any> {
    const url = `${this.backendUrl}/${this.activateUrl}/${address}`;

    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.put(url, {}, httpOptions);
  }

   controlVerifier(enableValue: string): Observable<any> {
    console.log('Compute service: verifier activation')
    const url =  `${this.backendUrl}/${this.verifierUrl}/${enableValue}`;
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

  uploadTask(address: string, file: File): Observable<any> {
    const url = `${this.backendUrl}/${this.uploadTaskUrl}`;

    const rbody = '{"address": "'+address+'","tpath": "'+file.name+'"}';

    const httpOptions = {
	    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.post(url, rbody, httpOptions);
  }

  runTask(address: string){
    const url = `${this.backendUrl}/${this.executeTaskUrl}/${address}/`;
    //const rbody = '{"address": "'+address+'"}';

    const httpOptions = {
	    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    return this.http.put(url, {}, httpOptions);
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
