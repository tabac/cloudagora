import { TestBed } from '@angular/core/testing';

import { ComputeContractService } from './compute-contract.service';

describe('ComputeContractService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ComputeContractService = TestBed.get(ComputeContractService);
    expect(service).toBeTruthy();
  });
});
