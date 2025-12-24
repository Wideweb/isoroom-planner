import { ModuleWithProviders, NgModule } from "@angular/core";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { SpinnerService } from "./services/spinner.service";
import { LocalService } from "./services/local-storage.service";
import { CommonModule } from "@angular/common";
import { LocationHistoryService } from "./services/location-history.service";
import { NgxsModule } from "@ngxs/store";
import { CommonState } from "./state/common.state";
import { MatSnackBarModule } from "@angular/material/snack-bar";

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxsModule.forFeature([CommonState]),
  ],
  exports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
})
export class AppCommonModule {
  static forRoot(): ModuleWithProviders<AppCommonModule> {
    return {
      ngModule: AppCommonModule,
      providers: [
        SpinnerService,
        LocalService,
        LocationHistoryService,
      ]
    };
  }

  static forChild(): ModuleWithProviders<AppCommonModule> {
    return {
      ngModule: AppCommonModule,
      providers: []
    };
  }
}
