import { Component, inject, output, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
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
  IonItem,
  IonLabel,
  IonModal,
} from "@ionic/angular/standalone";
import { BabiesListComponent } from "../babies-list/babies-list.component";

@Component({
  selector: "app-sleep-form",
  templateUrl: "./sleep-form.component.html",
  styleUrls: ["./sleep-form.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonDatetimeButton,
    IonButton,
    IonModal,
    IonDatetime,
    BabiesListComponent,
  ],
})
export class SleepFormComponent {
  babiesList = viewChild(BabiesListComponent);
  private storageService = inject(StorageService);
  sleepStart = signal<Date>(now());
  sleepEnd = signal<Date>(now());
  sleepOutput = output<SleepInput | undefined>();
  constructor() {
  }

  async reset() {
    this.babiesList()?.refresh();
    const lastTimer = await this.storageService.getLastTimer();
    let lastTimerDate = lastTimer.value ? new Date(lastTimer.value) : new Date();

    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    if (lastTimerDate.getTime() < threeHoursAgo) {
      lastTimerDate = new Date();
    }

    lastTimerDate.setMinutes(
      lastTimerDate.getMinutes() - lastTimerDate.getTimezoneOffset()
    );
    this.sleepStart.set(lastTimerDate);
    this.sleepEnd.set(now());
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

  saveSleep() {
    this.sleepOutput.emit({
      start: addTimezoneOffset(this.sleepStart()),
      end: addTimezoneOffset(this.sleepEnd()),
      babyId: this.babiesList()?.choosenBaby()?.id,
    });
  }

  closeModal() {
    this.sleepOutput.emit(undefined);
  }
}
