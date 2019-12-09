import { TestBed } from '@angular/core/testing';

import { StorageContractService } from './storage-contract.service';

describe('StorageContractService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StorageContractService = TestBed.get(StorageContractService);
    expect(service).toBeTruthy();
  });
});
