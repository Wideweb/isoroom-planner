import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export enum FailtDialogSelection {
  Retry,
  ToMenu
}

export interface FailDialogModel {
  blocked: number;
}

@Component({
  selector: 'fail-dialog',
  templateUrl: './fail-dialog.component.html',
  styleUrls: ['./fail-dialog.component.scss']
})
export class FailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FailDialogModel) { }


  retry() {
    this.dialogRef.close(FailtDialogSelection.Retry);
  }

  toMenu() {
    this.dialogRef.close(FailtDialogSelection.ToMenu);
  }
}
