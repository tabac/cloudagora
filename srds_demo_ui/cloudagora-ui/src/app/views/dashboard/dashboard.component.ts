import { Component, OnInit } from '@angular/core';
import { StorageContract, StorageContractDetails, ComputeContract, ComputeContractDetails, ContractDetails } from '../../models/contract';
import { StorageContractService } from '../../services/storage-contract.service';
import { ComputeContractService } from '../../services/compute-contract.service';

@Component({
  templateUrl: 'dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  clientStorageContracts: StorageContract[];
  providerStorageContracts: StorageContract[];
	
  clientComputeContracts: ComputeContract[];
  providerComputeContracts: ComputeContract[];

  constructor(private storageContractService: StorageContractService,
	      private computeContractService: ComputeContractService ) { }

  ngOnInit(): void {
	  this.getStorageContracts();
	  this.getComputeContracts();
  }

  getTimelinePercentage(contractDetails: ContractDetails): number {
    if (contractDetails.activateDate !== 0 && contractDetails.endDate !== 0) {
      const now = Date.now();

      if (now > contractDetails.activateDate) {
        const total = contractDetails.endDate - contractDetails.activateDate;
        const progress = now - contractDetails.activateDate;

        return Math.min(Math.floor((progress / total) * 100), 100);
      }
    }

    return 0;
  }

  getWidthStyle(contractDetails: ContractDetails) {
      return {'width': this.getTimelinePercentage(contractDetails) + '%'};
  }

  getStorageContracts(): void {
    this.storageContractService.getClientStorageContracts().subscribe(
        contracts => this.clientStorageContracts = contracts
    );
    this.storageContractService.getProviderStorageContracts().subscribe(
        contracts => this.providerStorageContracts = contracts
    );
  }

  getComputeContracts(): void {
    this.computeContractService.getClientTaskContracts().subscribe(
        contracts => this.clientComputeContracts = contracts
    );
    this.computeContractService.getProviderTaskContracts().subscribe(
        contracts => this.providerComputeContracts = contracts
    );
  }

  getStatusColor(contractDetails: ContractDetails): string {
    return StorageContractDetails.getStatusColorStyle(contractDetails);
  }
}
