import { Component, inject, output, signal, viewChild } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ViewWillEnter } from "@ionic/angular/standalone";
import { CommonModule } from "@angular/common";
import { StorageService } from "src/app/services/storage.service";
import { SleepInput } from "../models";
import { addTimezoneOffset, now } from "../util";
import { DatePicker } from '@capacitor-community/date-picker';

import {
  IonButton,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonTextarea,
} from "@ionic/angular/standalone";
import { BabiesListComponent } from "../babies-list/babies-list.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { TimeStyleService } from "src/app/services/time-style.service";
import { DarkModeService } from "src/app/services/dark-mode.service";

@Component({
  selector: "app-sleep-form",
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonItem,
    IonLabel,
    IonButton,
    IonInput,
    BabiesListComponent,
    IonTextarea,
  ],
  standalone: true,
  template: `
    <form [formGroup]="form" class="ion-padding">
      <ion-item>
        <ion-label>Sleep Start</ion-label>
        @if(timeStyleService.timeStyle() === 'number') {
        <ion-input
          type="tel"
          inputmode="numeric"
          formControlName="startTime"
          (ionInput)="formatTime('startTime', $event)"
          (ionFocus)="clearTime('startTime')"
          placeholder="HH:mm"
          maxlength="5"
        ></ion-input>
        } @else {
          <ion-button fill="clear" (click)="openDatePicker('startTime')">{{form.value.startTime}}</ion-button>
        }
      </ion-item>
      <div class="quick-time-buttons">
        <ion-button size="small" (click)="setQuickTime('startTime', 30)">{{getTimeString(30)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime('startTime', 20)">{{getTimeString(20)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime('startTime', 15)">{{getTimeString(15)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime('startTime', 10)">{{getTimeString(10)}}</ion-button>
      </div>

      <ion-item>
        <ion-label>Sleep End</ion-label>
        @if(timeStyleService.timeStyle() === 'number') {
        <ion-input
          type="tel"
          inputmode="numeric"
          formControlName="endTime"
          (ionInput)="formatTime('endTime', $event)"
          (ionFocus)="clearTime('endTime')"
          placeholder="HH:mm"
          maxlength="5"
        ></ion-input>
        } @else {
        <ion-button fill="clear" (click)="openDatePicker('endTime')">{{form.value.endTime}}</ion-button>
        }
      </ion-item>
      <div class="quick-time-buttons">
        <ion-button size="small" (click)="setQuickTime('endTime', 30)">{{getTimeString(30)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime('endTime', 20)">{{getTimeString(20)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime('endTime', 15)">{{getTimeString(15)}}</ion-button>
        <ion-button size="small" (click)="setQuickTime('endTime', 10)">{{getTimeString(10)}}</ion-button>
      </div>
      <ion-textarea 
            fill="outline" 
            (ionInput)="onNoteChange($event)" 
            placeholder="Note"
        ></ion-textarea>

      <div class="ion-padding button-container">
        <ion-button class="form-button" (click)="saveSleep()">Save Sleep</ion-button>
        <ion-button class="form-button" (click)="closeModal()">Cancel</ion-button>
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
export class SleepFormComponent {
  originalStartTime = signal<Date | undefined>(undefined);
  originalEndTime = signal<Date | undefined>(undefined);
  timeStyleService = inject(TimeStyleService);
  darkModeService = inject(DarkModeService);
  form = new FormGroup({
    startTime: new FormControl("", [
      Validators.required,
      Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    ]),
    endTime: new FormControl("", [
      Validators.required,
      Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    ]),
    note: new FormControl(""),
  });

  formatTime(control: string, event: any) {
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

    if (value.length >= 3) {
      value = value.slice(0, 2) + ":" + value.slice(2);
    }

    this.form.get(control)?.setValue(value, { emitEvent: false });
  }

  clearTime(control: string) {
    const time = this.form.get(control)?.value;
    if (time) {
      this.form.get(control)?.setValue(time.slice(0, -2), { emitEvent: false });
    }
  }

  initializeForm(sleep: SleepInput) {
    const startDate = new Date(sleep.start);
    const endDate = new Date(sleep.end);
    this.originalStartTime.set(startDate);
    this.originalEndTime.set(endDate);

    this.form.patchValue({
      startTime: `${startDate.getHours().toString().padStart(2, "0")}:${
        startDate.getMinutes().toString().padStart(2, "0")
      }`,
      endTime: `${endDate.getHours().toString().padStart(2, "0")}:${
        endDate.getMinutes().toString().padStart(2, "0")
      }`,
      note: sleep.note,
    });
    this.id.set(sleep.id);
  }

  public saveSleep() {
    if (this.form.valid) {
      const now = new Date();
      const startDate = this.originalStartTime() ?? new Date(now);
      const endDate = this.originalEndTime() ?? new Date(now);

      const [startHours, startMinutes] = this.form.value.startTime!.split(":")
        .map(Number);
      const [endHours, endMinutes] = this.form.value.endTime!.split(":").map(
        Number,
      );

      startDate.setHours(startHours);
      startDate.setMinutes(startMinutes);
      endDate.setHours(endHours);
      endDate.setMinutes(endMinutes);

      this.sleepOutput.emit({
        start: startDate,
        end: endDate,
        babyId: this.babiesList()?.choosenBaby()?.id,
        id: this.id(),
        note: this.form.value.note ?? undefined,
      });
    }
  }

  babiesList = viewChild(BabiesListComponent);
  private storageService = inject(StorageService);
  sleepStart = signal<Date | undefined>(undefined);
  sleepEnd = signal<Date | undefined>(undefined);
  sleepOutput = output<SleepInput | undefined>();
  id = signal<string | undefined>(undefined);
  constructor() {
  }

  async reset() {
    this.babiesList()?.refresh();
    const lastTimer = await this.storageService.getLastTimer();
    let lastTimerDate = lastTimer.value
      ? new Date(lastTimer.value)
      : undefined;

    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    if (!lastTimerDate || lastTimerDate.getTime() < threeHoursAgo) {
      // Set start time to 5 minutes ago
      const startTime = new Date();
      lastTimerDate = this.roundToNearestFiveMinutes(startTime);
    }

    // Set end time to current time
    const endTime = new Date();
    const roundedEndTime = this.roundToNearestFiveMinutes(endTime);

    // Handle timezone for both times
    lastTimerDate.setMinutes(lastTimerDate.getMinutes() - lastTimerDate.getTimezoneOffset());
    roundedEndTime.setMinutes(roundedEndTime.getMinutes() - roundedEndTime.getTimezoneOffset());

    this.sleepStart.set(lastTimerDate);
    this.sleepEnd.set(roundedEndTime);
    this.id.set(undefined);
    this.originalStartTime.set(lastTimerDate);
    this.originalEndTime.set(roundedEndTime);
    this.form.patchValue({
      startTime: lastTimerDate.toISOString().slice(11, 16),
      endTime: roundedEndTime.toISOString().slice(11, 16),
      note: undefined,
    });
  }

  onSleepStartChange(event: any) {
    const date = new Date(event.detail.value);
    //handle timezone
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    this.sleepStart.set(date);
  }

  onSleepEndChange(event: any) {
    const date = new Date(event.detail.value);
    //handle timezone
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    this.sleepEnd.set(date);
  }

  onNoteChange(event: any) {
    this.form.get("note")?.setValue(event.detail.value, { emitEvent: false });
  }

  closeModal() {
    this.sleepOutput.emit(undefined);
  }

  async openDatePicker(control: string) {
    const result = await DatePicker.present({
      mode: 'time',
      locale: 'en-GB',
      is24h: true,
      theme: this.darkModeService.isDarkMode() ? 'dark' : 'light',
    });
    if (result.value) {
      //remove everything that is not hh:MM
      const value = result.value.substring(11, 16);
      this.form.get(control)?.setValue(value, { emitEvent: false });
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

  setQuickTime(control: string, value: string | number | null | undefined) {
    if (value) {
      const minutes = parseInt(value.toString());
      const now = new Date();
      now.setMinutes(now.getMinutes() - minutes);
      const roundedTime = this.roundToNearestFiveMinutes(now);
      roundedTime.setMinutes(roundedTime.getMinutes() - roundedTime.getTimezoneOffset());
      const timeString = `${roundedTime.getHours().toString().padStart(2, "0")}:${roundedTime.getMinutes().toString().padStart(2, "0")}`;
      this.form.get(control)?.setValue(timeString, { emitEvent: false });

      if (control === 'startTime') {
        this.originalStartTime.set(roundedTime);
        this.sleepStart.set(roundedTime);
      } else {
        this.originalEndTime.set(roundedTime);
        this.sleepEnd.set(roundedTime);
      }
    }
  }

  getTimeString(minutesAgo: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - minutesAgo);
    const roundedTime = this.roundToNearestFiveMinutes(now);
    roundedTime.setMinutes(roundedTime.getMinutes() - roundedTime.getTimezoneOffset());
    return `${roundedTime.getHours().toString().padStart(2, "0")}:${roundedTime.getMinutes().toString().padStart(2, "0")}`;
  }
}
