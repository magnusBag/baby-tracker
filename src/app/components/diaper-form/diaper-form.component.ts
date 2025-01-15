import {
  Component,
  inject,
  OnInit,
  output,
  signal,
  viewChild,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  IonButton,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonInput,
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
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonTextarea,
    IonInput,
    BabiesListComponent,
  ],
  template: `
    <form [formGroup]="form" class="ion-padding">
      <ion-item>
        <ion-label>Diaper Time</ion-label>
        <ion-input
          type="tel"
          inputmode="numeric"
          formControlName="time"
          (ionInput)="formatTime($event)"
          (ionFocus)="clearTime()"
          placeholder="HH:mm"
          maxlength="5"
        ></ion-input>
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
      <ion-textarea 
        fill="outline" 
        (ionInput)="onNoteChange($event)" 
        placeholder="Note"
      ></ion-textarea>
      <div class="button-container" style="margin-top: 1rem;">
        <ion-button class="form-button" (click)="saveDiaper()">Save Diaper</ion-button>
        <ion-button class="form-button" (click)="cancelDiaper()">Cancel</ion-button>
      </div>
      <app-babies-list></app-babies-list>
    </form>
  `,
  styles: [`
    ion-input {
      width: 80px;
      --padding-start: 8px;
      --padding-end: 8px;
    }
  `],
})
export class DiaperFormComponent {
  babyService = inject(BabyService);
  form = new FormGroup({
    type: new FormControl<DiaperType>("both"),
    time: new FormControl("", [
      Validators.required,
      Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    ]),
  });
  time = signal<Date>(now());
  note = signal<string | undefined>(undefined);
  diaperOutput = output<DiaperInput | undefined>();
  babiesList = viewChild(BabiesListComponent);
  id = signal<string | undefined>(undefined);
  waterIcon = waterOutline;
  solidIcon = nutritionOutline;
  bothIcon = syncOutline;

  reset() {
    this.form.reset();
    this.form.patchValue({ type: "both" });
    this.time.set(now());
    this.note.set(undefined);
    this.id.set(undefined);
    this.babiesList()?.refresh();
    this.form.patchValue({
      time: now().toISOString().slice(11, 16),
    });
  }

  formatTime(event: any) {
    let value = event.detail.value.replace(/\D/g, ""); // Remove non-digits

    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    if (value.length >= 2) {
      const hours = parseInt(value.slice(0, 2));
      if (hours > 23) {
        value = "23" + value.slice(2);
      }
    }

    if (value.length >= 4) {
      const minutes = parseInt(value.slice(2, 4));
      if (minutes > 59) {
        value = value.slice(0, 2) + "59";
      }
    }

    // Format with colon
    if (value.length >= 3) {
      value = value.slice(0, 2) + ":" + value.slice(2);
    }

    this.form.get("time")?.setValue(value, { emitEvent: false });
  }

  initializeForm(diaper: DiaperInput) {
    console.log(diaper);
    const diaperTime = new Date(diaper.time);
    this.form.patchValue({
      time: `${diaperTime.getHours().toString().padStart(2, "0")}:${
        diaperTime.getMinutes().toString().padStart(2, "0")
      }`,
      type: diaper.type as DiaperType,
    });
    this.id.set(diaper.id);
    this.note.set(diaper.note);
  }

  saveDiaper() {
    if (this.form.valid) {
      const now = new Date();
      const [hours, minutes] = this.form.value.time!.split(":").map(Number);

      now.setHours(hours);
      now.setMinutes(minutes);

      this.diaperOutput.emit({
        type: this.form.value.type!,
        time: now,
        note: this.note(),
        babyId: this.babiesList()?.choosenBaby()?.id,
        id: this.id(),
      });
    }
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

  clearTime() {
    this.form.get("time")?.setValue("", { emitEvent: false });
  }
}
