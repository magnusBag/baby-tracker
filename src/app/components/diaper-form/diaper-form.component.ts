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
import { DatePicker } from "@capacitor-community/date-picker";
import { TimeStyleService } from "src/app/services/time-style.service";
import { DarkModeService } from "src/app/services/dark-mode.service";

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
        @if(timeStyleService.timeStyle() === 'number') {
        <ion-input
          type="tel"
          inputmode="numeric"
          formControlName="time"
          (ionInput)="formatTime($event)"
          (ionFocus)="clearTime()"
          placeholder="HH:mm"
          maxlength="5"
        ></ion-input>
        } @else {
        <ion-button fill="clear" (click)="openDatePicker()">{{form.value.time}}</ion-button>
        }
      </ion-item>
      <div class="quick-time-buttons">
        <ion-button size="small" (click)="setQuickTime(30)">{{getTimeString(30)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime(20)">{{getTimeString(20)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime(15)">{{getTimeString(15)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime(10)">{{getTimeString(10)}}</ion-button>
      </div>
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
    .quick-time-buttons {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
    }
    .quick-time-buttons ion-button {
      flex: 1;
      font-size: 12px;
    }
  `],
})
export class DiaperFormComponent {
  timeStyleService = inject(TimeStyleService);
  darkModeService = inject(DarkModeService);
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
    const defaultTime = new Date();
    //offset with timezone
    defaultTime.setMinutes(defaultTime.getMinutes() - defaultTime.getTimezoneOffset());
    const roundedTime = this.roundToNearestFiveMinutes(defaultTime);
    this.time.set(roundedTime);
    this.note.set(undefined);
    this.id.set(undefined);
    this.babiesList()?.refresh();
    this.form.patchValue({
      time: roundedTime.toISOString().slice(11, 16),
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
    //only remove last 2 characters
    const time = this.form.get("time")?.value;
    if (time) {
      this.form.get("time")?.setValue(time.slice(0, -2), { emitEvent: false });
    }
  }

  async openDatePicker() {
    const result = await DatePicker.present({
      mode: 'time',
      locale: 'en-GB',
      is24h: true,
      theme: this.darkModeService.isDarkMode() ? 'dark' : 'light',
    });
    if (result.value) {
      const value = result.value.substring(11, 16);
      this.form.get("time")?.setValue(value, { emitEvent: false });
    }
  }

  private roundToNearestFiveMinutes(date: Date): Date {
    const roundedDate = new Date(date);
    const minutes = roundedDate.getMinutes();
    const remainder = minutes % 5;
    if (remainder >= 2.5) {
      roundedDate.setMinutes(minutes + (5 - remainder));
    } else {
      roundedDate.setMinutes(minutes - remainder);
    }
    return roundedDate;
  }

  getTimeString(minutesAgo: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - minutesAgo);
    const roundedTime = this.roundToNearestFiveMinutes(now);
    return `${roundedTime.getHours().toString().padStart(2, "0")}:${roundedTime.getMinutes().toString().padStart(2, "0")}`;
  }

  setQuickTime(minutesAgo: number) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - minutesAgo);
    const roundedTime = this.roundToNearestFiveMinutes(now);
    const timeString = `${roundedTime.getHours().toString().padStart(2, "0")}:${roundedTime.getMinutes().toString().padStart(2, "0")}`;
    this.form.get("time")?.setValue(timeString, { emitEvent: false });
  }
}
