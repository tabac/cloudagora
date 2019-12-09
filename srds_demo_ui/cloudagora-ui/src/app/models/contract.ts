export enum ContractStatus {
    Inactive = 0, Active = 1, Complete = 2
}

export class Wallet {
  address: string;
  blockchainUrl: string;
  balance: number;
}

export class RegistryEntry {
  address: string;
  endpoint: string;
  challenge: string;
}

export class ContractDetails {
    provider: string;
    activateDate: number;
    endDate: number;
    duration: number;
    payment: number;
    guarantee: number;
    status: string;

    constructor(other: ContractDetails) {
      this.provider = other.provider;
      this.activateDate = other.activateDate;
      this.endDate = other.endDate;
      this.duration = other.duration;
      this.payment = other.payment;
      this.guarantee = other.guarantee;
      this.status = other.status;
    }

    static getStatusColorStyle(contractDetails: ContractDetails): string {
      if (contractDetails.status === 'Inactive') {
        return 'text-secondary';
      }
      if (contractDetails.status === 'Active') {
        return 'text-success';
      }
      if (contractDetails.status === 'Complete') {
        return 'text-primary';
      }
      if (contractDetails.status === 'Cancelled') {
        return 'text-warning';
      }
      if (contractDetails.status === 'Invalid') {
        return 'text-danger';
      }

      return 'text-secondary';
    }
}

export class StorageContractDetails extends ContractDetails{
	
  fileHash: string;

  constructor(other: StorageContractDetails) {
    super(other);
    this.fileHash = other.fileHash;
  }
}

export class ComputeContractDetails extends ContractDetails{

  constructor(other: ComputeContractDetails) {
    super(other);
  }
}

export class StorageContract {
  address: string;
  filename: string;
  filesize: number;
  createDate: number;
  fileUploaded: boolean;
  details: StorageContractDetails;
  role: string;

  constructor(other: StorageContract) {
    this.address = other.address;
    this.filename = other.filename;
    this.filesize = other.filesize;
    this.createDate = other.createDate;
    this.role = other.role;
    this.details = new StorageContractDetails(other.details);
  }
}

export class Auction {
  address: string;
  taskId: string;
  owner: string;
  isCompute: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  contract: string;
  canceled: boolean;
  finalized: boolean;
  lowestOffer: number;
  winner: string;
}

export class ComputeContract {
    address: string;
    filename: string;
    gas: number;
    createDate: number;
    taskUploaded: boolean;
    details: ComputeContractDetails;
    role: string;

    constructor(other: ComputeContract) {
      this.address = other.address;
      this.filename = other.filename;
      this.gas = other.gas;
      this.createDate = other.createDate;
      this.role = other.role;
      this.details = new ComputeContractDetails(other.details);
    }
}
