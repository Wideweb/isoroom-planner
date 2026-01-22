import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export enum FailtDialogSelection {
  None,
  Retry,
  ToMenu
}

@Component({
  selector: 'fail-game-dialog',
  templateUrl: './fail-game-dialog.component.html',
  styleUrls: ['./fail-game-dialog.component.scss']
})
export class FailGameDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FailGameDialogComponent>) { }


  retry() {
    this.dialogRef.close(FailtDialogSelection.Retry);
  }

  toMenu() {
    this.dialogRef.close(FailtDialogSelection.ToMenu);
  }

  close() {
    this.dialogRef.close(FailtDialogSelection.None);
  }
}
