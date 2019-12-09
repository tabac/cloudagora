import { Component, OnInit } from '@angular/core';
import { StorageContractService } from '../../services/storage-contract.service';
import { Wallet } from '../../models/contract';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: [],
})
export class WalletComponent implements OnInit {
  wallet: Wallet;

  constructor(private storageContractService: StorageContractService) { }

  ngOnInit() {
    this.storageContractService.getWallet().subscribe(
      (wallet) => this.wallet = wallet
    );
  }

}
