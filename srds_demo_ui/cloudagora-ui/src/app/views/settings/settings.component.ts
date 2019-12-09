import { Component, OnInit } from '@angular/core';
import { StorageContractService} from '../../services/storage-contract.service';
import { ComputeContractService} from '../../services/compute-contract.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: []
})
export class SettingsComponent implements OnInit {
  endpoint: string;
  verifierActivateSuccessMessage : string;
  verifierActivateErrorMessage : string;

  constructor(
    private storageContractService: StorageContractService,
    private computeContractService: ComputeContractService
  ) {}

  ngOnInit() {
    this.endpoint = this.storageContractService.getBackendUrl();
    this.verifierActivateSuccessMessage = '';
    this.verifierActivateErrorMessage = '';
  }

  setEndpoint(endpoint: any): void {
    this.endpoint = endpoint.value;
  }

  saveEndpoint(): void {
    this.storageContractService.setBackendUrl(this.endpoint);
    this.computeContractService.setBackendUrl(this.endpoint);
  }
  
  notifyVerifier(value): void {
    this.verifierActivateSuccessMessage = '';
    this.verifierActivateErrorMessage = '';
    this.computeContractService.controlVerifier(value).subscribe(
    res => {
        if(value == 1){
	    this.verifierActivateSuccessMessage = 'Verifier activated';
	}else{
	    this.verifierActivateSuccessMessage = 'Verifier deactivated';
	}
        this.verifierActivateErrorMessage = '';
        console.log('Info: Activated verifier: ', res);
      },
      err => {
        if(value == 1){
	    this.verifierActivateErrorMessage = 'Activation Failed';
	}else{
	    this.verifierActivateErrorMessage = 'Deactivation Failed';
	}
        this.verifierActivateSuccessMessage = '';
        console.log('Error: Failed to activate verifier with:', err);
      }
    );
  }
}
