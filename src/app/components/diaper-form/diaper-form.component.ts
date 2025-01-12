import {
  Component,
  inject,
  OnInit,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {
  IonButton,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
} from "@ionic/angular/standalone";
import { nutritionOutline, syncOutline, waterOutline } from "ionicons/icons";
import { DiaperInput, DiaperType } from "../models";
import { addTimezoneOffset, now } from "../util";
import { BabyService } from "src/app/services/baby.service";
import { BabiesListComponent } from "../babies-list/babies-list.component";

@Component({
  selector: "app-diaper-form",
  imports: [
    ReactiveFormsModule,
    IonItem,
    IonLabel,
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonButton,
    IonTextarea,
    IonItem,
    BabiesListComponent,
  ],
  template: `
    <form [formGroup]="form" class="ion-padding">
        <ion-item>
          <ion-label>Diaper Time</ion-label>
        <ion-datetime-button datetime="time"></ion-datetime-button>
      </ion-item>
      <ion-segment formControlName="type" class="ion-padding-top">
        <ion-segment-button value="wet">
          <div class="dot wet"></div>
          <ion-label>Wet</ion-label>
        </ion-segment-button>
        <ion-segment-button value="solid">
          <div class="dot solid"></div>
          <ion-label>Solid</ion-label>
        </ion-segment-button>
        <ion-segment-button value="both">
          <div class="dot both"></div>
          <ion-label>Both</ion-label>
        </ion-segment-button>
      </ion-segment>
      <ion-textarea fill="outline" (ionInput)="onNoteChange($event)" placeholder="Note"></ion-textarea>
      <div class="button-container" style="margin-top: 1rem;">
        <ion-button class="form-button" (click)="saveDiaper()">Save Diaper</ion-button>
        <ion-button class="form-button" (click)="cancelDiaper()">Cancel</ion-button>
      </div>
      <app-babies-list></app-babies-list>
    </form>

    <ion-modal [keepContentsMounted]="true">
    <ng-template>
      <ion-datetime
        locale="da-DK"
        id="time"
        [value]="time().toISOString()"
        (ionChange)="onDiaperTimeChange($event)"
      ></ion-datetime>
    </ng-template>
  </ion-modal>
  `,
  styles: [],
})
export class DiaperFormComponent {
  babyService = inject(BabyService);
  form: FormGroup = new FormGroup({
    type: new FormControl<DiaperType>("both"),
  });
  time = signal<Date>(now());
  note = signal<string | undefined>(undefined);
  diaperOutput = output<DiaperInput | undefined>();
  babiesList = viewChild(BabiesListComponent);

  waterIcon = waterOutline;
  solidIcon = nutritionOutline;
  bothIcon = syncOutline;

  reset() {
    this.form.reset();
    this.form.patchValue({ type: "both" });
    this.time.set(now());
    this.note.set(undefined);
    this.babiesList()?.refresh();
  }

  saveDiaper() {
    this.diaperOutput.emit({
      type: this.form.value.type,
      time: addTimezoneOffset(this.time()),
      note: this.note(),
      babyId: this.babiesList()?.choosenBaby()?.id,
    });
  }

  cancelDiaper() {
    this.diaperOutput.emit(undefined);
  }

  onDiaperTimeChange(event: any) {
    const date = new Date(event.detail.value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    this.time.set(date);
  }

  onNoteChange(event: any) {
    this.note.set(event.detail.value);
  }
}
