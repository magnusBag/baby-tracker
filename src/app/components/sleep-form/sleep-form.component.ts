import { Component, inject, output, signal, viewChild } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ViewWillEnter } from "@ionic/angular/standalone";
import { CommonModule } from "@angular/common";
import { StorageService } from "src/app/services/storage.service";
import { SleepInput } from "../models";
import { addTimezoneOffset, now } from "../util";
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
        <ion-input
          type="tel"
          inputmode="numeric"
          formControlName="startTime"
          (ionInput)="formatTime('startTime', $event)"
          (ionFocus)="clearTime('startTime')"
          placeholder="HH:mm"
          maxlength="5"
        ></ion-input>
      </ion-item>

      <ion-item>
        <ion-label>Sleep End</ion-label>
        <ion-input
          type="tel"
          inputmode="numeric"
          formControlName="endTime"
          (ionInput)="formatTime('endTime', $event)"
          (ionFocus)="clearTime('endTime')"
          placeholder="HH:mm"
          maxlength="5"
        ></ion-input>
      </ion-item>
      <ion-item>
      <ion-textarea 
            fill="outline" 
            (ionInput)="onNoteChange($event)" 
            placeholder="Note"
        ></ion-textarea>
      </ion-item>

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
  `],
})
export class SleepFormComponent {
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
    this.form.get(control)?.setValue("", { emitEvent: false });
  }

  initializeForm(sleep: SleepInput) {
    const startDate = new Date(sleep.start);
    const endDate = new Date(sleep.end);

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

  saveSleep() {
    if (this.form.valid) {
      const now = new Date();
      const startDate = new Date(now);
      const endDate = new Date(now);

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
      : new Date();

    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    if (lastTimerDate.getTime() < threeHoursAgo) {
      lastTimerDate = new Date();
    }

    lastTimerDate.setMinutes(
      lastTimerDate.getMinutes() - lastTimerDate.getTimezoneOffset(),
    );
    this.sleepStart.set(lastTimerDate);
    this.sleepEnd.set(now());
    this.id.set(undefined);
    this.form.patchValue({
      startTime: lastTimerDate.toISOString().slice(11, 16),
      endTime: now().toISOString().slice(11, 16),
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
}
