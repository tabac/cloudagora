import { Component, OnInit } from '@angular/core';
import { AuctionService } from '../../services/auctions.service';
import { Auction } from '../../models/contract';

@Component({
  selector: 'app-auctions',
  templateUrl: './auctions.component.html',
  styleUrls: []
})
export class AuctionsComponent implements OnInit {

  private storageAuctions: Auction[];
  private computeAuctions: Auction[];

  private duration: number;
  private auctionType: string;
  private filesize: number;
  private gas: number;
  private createAuctionErrorMessage: string;
  private createAuctionSuccessMessage: string;

  constructor(private auctionService: AuctionService) { }

  ngOnInit() {
    this.duration = 0;
    this.auctionType = 'Storage';
    this.filesize = 0;
    this.gas = 0;
    this.createAuctionErrorMessage = '';
    this.createAuctionSuccessMessage = '';

    this.getAuctions();
  }

  getAuctions(): void {
    this.auctionService.getStorageAuctions().subscribe(
      (auctions) => this.storageAuctions = auctions
    );
    this.auctionService.getComputeAuctions().subscribe(
      (auctions) => this.computeAuctions = auctions
    );
  }

  getTimelinePercentage(auction: Auction): number {
    if (auction.startTime !== 0 && auction.endTime !== 0) {
      const now = Date.now();

      if (now > auction.startTime) {
        const total = auction.endTime - auction.startTime;
        const progress = now - auction.startTime;

        return Math.min(Math.floor((progress / total) * 100), 100);
      }
    }

    return 0;
  }

  getWidthStyle(auction: Auction) {
      return {'width': this.getTimelinePercentage(auction) + '%'};
  }

  setDuration(duration: string) {
    this.duration = parseInt(duration);
  }

  setFilesizeOrGas(filesizeOrGas: string) {
    if (this.auctionType === 'Storage') {
      this.gas = 0;
      this.filesize = parseInt(filesizeOrGas);
    } else {
      this.filesize = 0;
      this.gas = parseInt(filesizeOrGas);
    }
  }

  createAuction(): void {
    const filesizeOrGas = this.auctionType == 'Storage' ? this.filesize : this.gas;

    this.auctionService.create(this.auctionType, filesizeOrGas, this.duration).subscribe(
      (auctions) => this.getAuctions()
    );
  }

  setAuctionType(auctionType: string) {
    this.gas = 0;
    this.filesize = 0;

    if (auctionType === 'Storage') {
        this.auctionType = 'Storage';
    } else {
        this.auctionType = 'Compute';
    }
  }
}
