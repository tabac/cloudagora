import { Component, OnInit } from '@angular/core';
import { RegistryEntry } from '../../models/contract';
import { StorageContractService } from '../../services/storage-contract.service';

@Component({
  selector: 'app-registry',
  templateUrl: './registry.component.html',
  styleUrls: []
})

export class RegistryComponent implements OnInit {
  registry: RegistryEntry[];

  constructor(private storageContractService: StorageContractService) { }

  ngOnInit() {
    this.storageContractService.getRegistry().subscribe(
      (registry) => this.registry = registry
    );
  }
}
