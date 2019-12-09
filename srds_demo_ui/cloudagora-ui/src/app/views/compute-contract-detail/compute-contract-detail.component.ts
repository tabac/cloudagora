import { Component, OnInit } from '@angular/core';
import { ComputeContract, ComputeContractDetails } from '../../models/contract';
import { ActivatedRoute } from '@angular/router';
import { ComputeContractService } from '../../services/compute-contract.service';

@Component({
  selector: 'app-compute-contract-detail',
  templateUrl: './compute-contract-detail.component.html',
  styleUrls: []
})
export class ComputeContractDetailComponent implements OnInit {
  contract: ComputeContract;

  activating: boolean;
  activateErrorMessage: string;
  activateSuccessMessage: string;

  runErrorMessage: string;
  runSuccessMessage: string;

  completing: boolean;
  completeErrorMessage: string;
  completeSuccessMessage: string;

  canceling: boolean;
  cancelErrorMessage: string;
  cancelSuccessMessage: string;

  invalidating: boolean;
  invalidateErrorMessage: string;
  invalidateSuccessMessage: string;

  taskToUpload: File;
  taskUploading: boolean;
  taskUploadErrorMessage: string;
  taskUploadSuccessMessage: string;

  challenging: boolean;
  challengeErrorMessage: string;
  challengeSuccessMessage: string;

  constructor(
    private route: ActivatedRoute,
    private computeContractService: ComputeContractService
  ) { }

  ngOnInit(): void {
    this.activating = false;
    this.activateErrorMessage = '';
    this.activateSuccessMessage = '';

    this.runErrorMessage = '';
    this.runSuccessMessage = '';

    this.completing = false;
    this.completeErrorMessage = '';
    this.completeSuccessMessage = '';

    this.canceling = false;
    this.cancelErrorMessage = '';
    this.cancelSuccessMessage = '';

    this.invalidating = false;
    this.invalidateErrorMessage = '';
    this.invalidateSuccessMessage = '';

    this.taskToUpload = null;
    this.taskUploading = false;
    this.taskUploadErrorMessage = '';
    this.taskUploadSuccessMessage = '';


    this.challenging = false;
    this.challengeErrorMessage = '';
    this.challengeSuccessMessage = '';


    this.getComputeContract();
  }

  getComputeContract(): void {
      const address = this.route.snapshot.paramMap.get('address');
      this.computeContractService.getComputeContract(address).subscribe(
          contract => this.contract = contract
      );
  }

  getDuration(contractDetails: ComputeContractDetails): number {
    return Math.floor(contractDetails.duration / (60 * 60 * 24 * 1000));
  }

  getStatusColor(contractDetails: ComputeContractDetails): string {
    return ComputeContractDetails.getStatusColorStyle(contractDetails);
  }

  hasClientRole(): boolean {
      return this.contract.role === 'client';
  }

  isActivateContractEnabled(): boolean {
    return this.contract.details.status === 'Inactive' && this.isTaskUploaded();
  }

  isRunCodeEnabled(): boolean {
    return this.contract.details.status === 'Active';
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

  isUploadTaskEnabled(): boolean {
    return (
      this.contract.details.status === 'Inactive' &&
      (this.contract.taskUploaded === undefined || !this.contract.taskUploaded)
    );
  }

  isChallengeContractEnabled(): boolean {
    return this.contract.details.status === 'Active';
  }

  isTaskUploaded(): boolean {
      return this.contract.taskUploaded !== undefined && this.contract.taskUploaded;
  }

  activateContract(): void {
    if (this.contract.details.status !== 'Inactive') {
      return;
    }

    this.activating = true;
    this.activateErrorMessage = '';
    this.activateSuccessMessage = '';

    this.computeContractService.activateContract(this.contract.address).subscribe(
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

  runCode(): void{
    this.runErrorMessage = '';
    this.runSuccessMessage = '';
    this.computeContractService.runTask(this.contract.address).subscribe(
      res => {
        this.runErrorMessage = '';
        this.runSuccessMessage = 'Execution Completed';
          console.log('Info: Task execution triggered successfully.');
      },
      err => {
        this.runErrorMessage = 'Execution Failed';
        this.runSuccessMessage = '';
          console.log('Error: Failed to run task with:', err);
      }
    )
  }

  completeContract(): void {
    if (this.contract.details.status !== 'Active') {
      return;
    }

    this.completing = true;
    this.completeErrorMessage = '';
    this.completeSuccessMessage = '';

    this.computeContractService.completeContract(this.contract.address).subscribe(
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

    this.computeContractService.cancelContract(this.contract.address).subscribe(
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

    this.computeContractService.invalidateContract(this.contract.address).subscribe(
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

  uploadTask(): void {
    this.taskUploading = true;
    this.taskUploadErrorMessage = '';
    this.taskUploadSuccessMessage = '';

    this.computeContractService.uploadTask(
      this.contract.address,
      this.taskToUpload
    ).subscribe(
      res => {
        this.taskUploading = false;
        this.taskToUpload = null;
        this.taskUploadErrorMessage = '';
        this.taskUploadSuccessMessage = 'File uploaded successfully';

        console.log('Info: Uploaded file with response: ', res);
      },
      err => {
        this.taskUploading = false;
        this.taskToUpload = null;
        this.taskUploadErrorMessage = 'Failed to upload file';
        this.taskUploadSuccessMessage = '';

        console.log('Error: Failed to upload file with:', err);
      },
    );
  }

  challengeContract(): void {
    this.challenging = true;
    this.challengeErrorMessage = '';
    this.challengeSuccessMessage = '';

    this.computeContractService.challengeContract(this.contract.address).subscribe(
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
      this.taskToUpload = files.item(0);
    }
  }
}
