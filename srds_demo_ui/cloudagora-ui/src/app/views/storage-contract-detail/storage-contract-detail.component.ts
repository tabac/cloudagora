import { Component, OnInit } from '@angular/core';
import { StorageContract, StorageContractDetails } from '../../models/contract';
import { ActivatedRoute } from '@angular/router';
import { StorageContractService } from '../../services/storage-contract.service';

@Component({
  selector: 'app-storage-contract-detail',
  templateUrl: './storage-contract-detail.component.html',
  styleUrls: []
})
export class StorageContractDetailComponent implements OnInit {
  contract: StorageContract;

  activating: boolean;
  activateErrorMessage: string;
  activateSuccessMessage: string;

  completing: boolean;
  completeErrorMessage: string;
  completeSuccessMessage: string;

  canceling: boolean;
  cancelErrorMessage: string;
  cancelSuccessMessage: string;

  invalidating: boolean;
  invalidateErrorMessage: string;
  invalidateSuccessMessage: string;

  fileToUpload: File;
  fileUploading: boolean;
  fileUploadErrorMessage: string;
  fileUploadSuccessMessage: string;

  challenging: boolean;
  challengeErrorMessage: string;
  challengeSuccessMessage: string;

  constructor(
    private route: ActivatedRoute,
    private storageContractService: StorageContractService
  ) { }

  ngOnInit(): void {
    this.activating = false;
    this.activateErrorMessage = '';
    this.activateSuccessMessage = '';

    this.completing = false;
    this.completeErrorMessage = '';
    this.completeSuccessMessage = '';

    this.canceling = false;
    this.cancelErrorMessage = '';
    this.cancelSuccessMessage = '';

    this.invalidating = false;
    this.invalidateErrorMessage = '';
    this.invalidateSuccessMessage = '';

    this.fileToUpload = null;
    this.fileUploading = false;
    this.fileUploadErrorMessage = '';
    this.fileUploadSuccessMessage = '';


    this.challenging = false;
    this.challengeErrorMessage = '';
    this.challengeSuccessMessage = '';


    this.getStorageContract();
  }

  getStorageContract(): void {
      const address = this.route.snapshot.paramMap.get('address');
      this.storageContractService.getStorageContract(address).subscribe(
          contract => this.contract = contract
      );
  }

  getDuration(contractDetails: StorageContractDetails): number {
    return Math.floor(contractDetails.duration / (60 * 60 * 24 * 1000));
  }

  getStatusColor(contractDetails: StorageContractDetails): string {
    return StorageContractDetails.getStatusColorStyle(contractDetails);
  }

  hasClientRole(): boolean {
      return this.contract.role === 'client';
  }

  isActivateContractEnabled(): boolean {
    return this.contract.details.status === 'Inactive' && this.isFileUploaded();
  }

  isCompleteContractEnabled(): boolean {
    return this.contract.details.status === 'Active';
  }

  isCancelContractEnabled(): boolean {
      return this.contract.details.status === 'Inactive';
  }

  isInvalidateContractEnabled(): boolean {
    return this.contract.details.status === 'Active';
  }

  isUploadFileEnabled(): boolean {
    return (
      this.contract.details.status === 'Inactive' &&
      (this.contract.fileUploaded === undefined || !this.contract.fileUploaded)
    );
  }

  isChallengeContractEnabled(): boolean {
    return this.contract.details.status === 'Active';
  }

  isFileUploaded(): boolean {
      return this.contract.fileUploaded !== undefined && this.contract.fileUploaded;
  }

  activateContract(): void {
    if (this.contract.details.status !== 'Inactive') {
      return;
    }

    this.activating = true;
    this.activateErrorMessage = '';
    this.activateSuccessMessage = '';

    this.storageContractService.activateContract(this.contract.address).subscribe(
      res => {
        this.contract.details.status = 'Active';

        this.activating = false;
        this.activateErrorMessage = '';
        this.activateSuccessMessage = 'Contract activated';

        console.log('Info: Activated contract.');
      },
      err => {
        this.activating = false;
        this.activateErrorMessage = 'Failed to activate contract';
        this.activateSuccessMessage = '';

        console.log('Error: Failed to activate contract with:', err);
      }
    );
  }

  completeContract(): void {
    if (this.contract.details.status !== 'Active') {
      return;
    }

    this.completing = true;
    this.completeErrorMessage = '';
    this.completeSuccessMessage = '';

    this.storageContractService.completeContract(this.contract.address).subscribe(
      res => {
        this.contract.details.status = 'Complete';

        this.completing = false;
        this.completeErrorMessage = '';
        this.completeSuccessMessage = 'Contract completed';

        console.log('Info: Completed contract.');
      },
      err => {
        this.completing = false;
        this.completeErrorMessage = 'Failed to complete contract';
        this.completeSuccessMessage = '';

        console.log('Error: Failed to complete contract with:', err);
      }
    )
  }

  cancelContract(): void {
    if (this.contract.details.status !== 'Inactive') {
      return;
    }

    this.canceling = true;
    this.cancelErrorMessage = '';
    this.cancelSuccessMessage = '';

    this.storageContractService.cancelContract(this.contract.address).subscribe(
      res => {
        this.contract.details.status = 'Cancelled';

        this.canceling = false;
        this.cancelErrorMessage = '';
        this.cancelSuccessMessage = 'Contract cancelled';
      },
      err => {
        this.canceling = false;
        this.cancelErrorMessage = 'Failed to cancel contract';
        this.cancelSuccessMessage = '';

        console.log('Error: Failed to cancel with: ', err);
      }
    );
  }

  invalidateContract(): void {
    if (this.contract.details.status !== 'Active') {
      return;
    }

    this.invalidating = true;
    this.invalidateErrorMessage = '';
    this.invalidateSuccessMessage = '';

    this.storageContractService.invalidateContract(this.contract.address).subscribe(
      res => {
        this.contract.details.status = 'Invalid';

        this.invalidating = false;
        this.invalidateErrorMessage = '';
        this.invalidateSuccessMessage = 'Contract Invalidated';
      },
      err => {
        this.invalidating = false;
        this.invalidateErrorMessage = 'Failed to invalidate contract';
        this.invalidateSuccessMessage = '';

        console.log('Error: Failed to invalidate contract with:', err);
      }
    );
  }

  uploadFile(): void {
    this.fileUploading = true;
    this.fileUploadErrorMessage = '';
    this.fileUploadSuccessMessage = '';

    this.storageContractService.uploadFile(
      this.contract.address,
      this.fileToUpload
    ).subscribe(
      res => {
        this.fileUploading = false;
        this.fileToUpload = null;
        this.fileUploadErrorMessage = '';
        this.fileUploadSuccessMessage = 'File uploaded successfully';

        console.log('Info: Uploaded file with response: ', res);
      },
      err => {
        this.fileUploading = false;
        this.fileToUpload = null;
        this.fileUploadErrorMessage = 'Failed to upload file';
        this.fileUploadSuccessMessage = '';

        console.log('Error: Failed to upload file with:', err);
      },
    );
  }

  challengeContract(): void {
    this.challenging = true;
    this.challengeErrorMessage = '';
    this.challengeSuccessMessage = '';

    this.storageContractService.challengeContract(this.contract.address).subscribe(
      res => {
        this.challenging = false;

        if (res.result === 'valid') {
          this.challengeErrorMessage = '';
          this.challengeSuccessMessage = 'Provider replied with valid proof for block: ' + res.block;
        } else {
          this.challengeErrorMessage = 'Provider did not reply with valid proof for block: ' + res.block;
          this.challengeSuccessMessage = '';
        }

        console.log('Info: Challenged provider with response: ', res);
      },
      err => {
        this.challenging = false;
        this.challengeErrorMessage = 'Failed to challenge contract';
        this.challengeSuccessMessage = '';

        console.log('Error: Failed to challenge provider with:', err);
      }
    );
  }

  setFileToUpload(files: FileList): void {
    if (files.length > 0) {
      this.fileToUpload = files.item(0);
    }
  }
}
