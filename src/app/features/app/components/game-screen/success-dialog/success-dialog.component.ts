import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export enum SuccessDialogSelection {
  Retry,
  Next
}

export interface SuccessDialogModel {
  score: number;
}

@Component({
  selector: 'success-dialog',
  templateUrl: './success-dialog.component.html',
  styleUrls: ['./success-dialog.component.scss']
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessDialogModel) { }


  retry() {
    this.dialogRef.close(SuccessDialogSelection.Retry);
  }

  toNext() {
    this.dialogRef.close(SuccessDialogSelection.Next);
  }
}
