import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ReplenishDeckDialogModel {
  categories: { id: number, name: string, desc: string, icon: number }[];
}

@Component({
  selector: 'replenish-deck-dialog',
  templateUrl: './replenish-deck-dialog.component.html',
  styleUrls: ['./replenish-deck-dialog.component.scss']
})
export class ReplenishDeckDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReplenishDeckDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReplenishDeckDialogModel) { }


  select(id: number) {
    this.dialogRef.close(id);
  }
}
