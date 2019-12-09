import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuctionService } from '../../services/auctions.service';
import { Auction } from '../../models/contract';

@Component({
  selector: 'app-auction-detail',
  templateUrl: './auction-detail.component.html',
  styleUrls: []
})
export class AuctionDetailComponent implements OnInit {
  private auction: Auction;

  private offer: number;
  private bidding: boolean;
  private bidErrorMessage: string;
  private bidSuccessMessage: string;

  private finalizeFile: File;
  private finalizing: boolean;
  private finalizeErrorMessage: string;
  private finalizeSuccessMessage: string;

  constructor(
    private route: ActivatedRoute,
    private auctionService: AuctionService,
  ) { }

  ngOnInit(): void {
    this.bidding = false;
    this.bidErrorMessage = '';
    this.bidSuccessMessage = '';

    this.finalizeFile = null;
    this.finalizing = false;
    this.finalizeErrorMessage = '';
    this.finalizeSuccessMessage = '';

    this.getAuction();
  }

  getAuction(): void {
    const address = this.route.snapshot.paramMap.get('address');

    this.auctionService.getAuction(address).subscribe(
      (auction) => this.auction = auction
    );
  }

  getDurationInDays(duration: number): number {
    return Math.floor(duration / (60 * 60 * 24 * 1000));
  }

  getAuctionStatus(): string {
    if (this.auction.canceled) {
      return 'Cancelled';
    }
    if (this.auction.finalized) {
      return 'Finalized';
    }

    return 'Active';
  }

  getAuctionStatusColor(): string {
    if (this.auction.canceled) {
      return 'text-warning';
    }
    if (this.auction.finalized) {
      return 'text-secondary';
    }

    return 'text-success';
   }

   setOffer(target: string): void {
     this.offer = parseInt(target);
   }

   placeOffer(): void {
    this.bidding = false;
    this.bidErrorMessage = '';
    this.bidSuccessMessage = '';

    if (this.offer === undefined || isNaN(this.offer)) {
      this.bidErrorMessage = 'Must specify a numerical value';
      return;
    }

    this.bidding = true;

    this.auctionService.placeOffer(this.auction.address, this.offer).subscribe(
      auction => {
        this.auction = auction;

        this.bidding = false;
        this.bidErrorMessage = '';
        this.bidSuccessMessage = 'Placed new offer successfully';
      },
      err => {
        console.log(err);

        this.bidding = false;
        this.bidErrorMessage = 'Failed to place offer';
        this.bidSuccessMessage = '';
      }
    );
   }

   finalize(): void {
     this.finalizing = true;
     this.finalizeErrorMessage = '';
     this.finalizeSuccessMessage = '';

     this.auctionService.finalize(this.auction.address, this.finalizeFile).subscribe(
       auction => {
         this.auction = auction;

         this.finalizeFile = null;
         this.finalizing = false;
         this.finalizeErrorMessage = '';
         this.finalizeSuccessMessage = 'Auction finalized successfully';
       },
       err => {
         this.finalizeFile = null;
         this.finalizing = false;
         this.finalizeErrorMessage = 'Failed to finalize auction';
         this.finalizeSuccessMessage = '';
       }
     );
   }

  setFinalizeFile(files: FileList): void {
    if (files.length > 0) {
      this.finalizeFile = files.item(0);
    }
  }
}
