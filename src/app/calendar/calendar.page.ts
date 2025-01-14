import { Component, inject, signal, viewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { DailyReport, ReportService } from "../services/report.service";
import {
    IonButton,
    IonButtons,
    IonContent,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
    ModalController,
    ViewWillEnter,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackOutline } from "ionicons/icons";
import { registerLocaleData } from "@angular/common";
import localeDa from "@angular/common/locales/da";
import { StorageService } from "../services/storage.service";
import { DiaperType, NursingInput, NursingType } from "../components/models";
import { SleepInput } from "../components/models";
import { DiaperInput } from "../components/models";
import { DiaperFormComponent } from "../components/diaper-form/diaper-form.component";
import { NursingFormComponent } from "../components/nursing-form/nursing-form.component";
import { SleepFormComponent } from "../components/sleep-form/sleep-form.component";

registerLocaleData(localeDa);

interface TimeSlot {
    hour: number;
    minutes: number[];
    activities: {
        type: "sleep" | "diaper" | "nursing";
        text: string;
        diaper?: DiaperInput;
        nursing?: NursingInput;
        sleep?: SleepInput;
    }[];
    isSleeping: boolean;
}

@Component({
    selector: "app-calendar",
    template: `
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="goBack()">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ currentDate | date:'dd/MM/yyyy':'':'da-DK' }}</ion-title>
        <ion-title size="small">Sleep: {{ storageService.totalHoursSlept() | number:'1.0-1' }} hours - Diapers: {{ storageService.totalDiapersToday().length }} - Nursing: {{ storageService.totalNursingsToday().length }}</ion-title>
      </ion-toolbar>

    <ion-content class="ion-padding">
      @if (report(); as report) {
        <div class="calendar-container">
          @for (slot of timeSlots; track slot.hour + '-' + slot.minutes[0]) {
            <div class="time-slot" [class.sleeping]="slot.isSleeping">
              <div class="time">
                {{ slot.hour }}.{{ slot.minutes[0] === 0 ? '00' : slot.minutes[0] }}
              </div>
              <div class="activities">
                @for (activity of slot.activities; track activity.text) {
                  <div class="activity {{ activity.type }}" (click)="onActivityClick(activity)">
                    {{ activity.text }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <p>Loading...</p>
      }
    </ion-content>

    <!-- Edit Modals -->
    <ion-modal #sleepModal [breakpoints]="[0, 0.5, 0.75, 1]" [initialBreakpoint]="0.5" [keepContentsMounted]="true">
      <ng-template>
        <ion-content class="ion-padding">
          <app-sleep-form #sleepForm (sleepOutput)="onSleepEdit($event)"></app-sleep-form>
        </ion-content>
      </ng-template>
    </ion-modal>

    <ion-modal #diaperModal [breakpoints]="[0, 0.5, 0.75, 1]" [initialBreakpoint]="0.5" [keepContentsMounted]="true">
      <ng-template>
        <ion-content class="ion-padding">
          <app-diaper-form #diaperForm (diaperOutput)="onDiaperEdit($event)"></app-diaper-form>
        </ion-content>
      </ng-template>
    </ion-modal>

    <ion-modal #nursingModal [breakpoints]="[0, 0.5, 0.75, 1]" [initialBreakpoint]="0.5" [keepContentsMounted]="true">
      <ng-template>
        <ion-content class="ion-padding">
          <app-nursing-form #nursingForm (nursingOutput)="onNursingEdit($event)"></app-nursing-form>
        </ion-content>
      </ng-template>
    </ion-modal>

    <style>
      .calendar-container {
        display: flex;
        flex-direction: column;
        gap: 0;
        border: 1px solid var(--ion-color-light);
      }

      .time-slot {
        display: flex;
        min-height: 30px;
        border-bottom: 1px solid var(--ion-color-light);
        transition: background-color 0.2s ease;
      }

      .time-slot.sleeping {
        background-color: var(--ion-color-primary-tint);
        color: var(--ion-color-primary-contrast);
      }

      .time {
        width: 60px;
        padding: 4px;
        font-size: 14px;
        border-right: 1px solid var(--ion-color-light);
      }

      .activities {
        flex: 1;
        padding: 4px;
      }

      .activity {
        padding: 2px 8px;
        margin: 2px 0;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }

      .activity:hover {
        opacity: 0.8;
      }

      .activity.sleep {
        background-color: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast);
      }

      .activity.nursing {
        background-color: var(--ion-color-warning);
        color: var(--ion-color-warning-contrast);
      }

      .activity.diaper {
        background-color: var(--ion-color-success);
        color: var(--ion-color-success-contrast);
      }
    </style>
  `,
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonModal,
        DiaperFormComponent,
        NursingFormComponent,
        SleepFormComponent,
    ],
})
export class CalendarPage implements ViewWillEnter {
    private reportService = inject(ReportService);
    storageService = inject(StorageService);
    private router = inject(Router);
    private modalController = inject(ModalController);
    report = signal<DailyReport | null>(null);
    currentDate = new Date();
    timeSlots: TimeSlot[] = [];

    sleepModal = viewChild<IonModal>("sleepModal");
    diaperModal = viewChild<IonModal>("diaperModal");
    nursingModal = viewChild<IonModal>("nursingModal");
    sleepForm = viewChild<SleepFormComponent>("sleepForm");
    diaperForm = viewChild<DiaperFormComponent>("diaperForm");
    nursingForm = viewChild<NursingFormComponent>("nursingForm");

    selectedActivity: TimeSlot["activities"][0] | null = null;

    constructor() {
        addIcons({ arrowBackOutline });
        this.initializeTimeSlots();
    }

    initializeTimeSlots() {
        this.timeSlots = [];
        for (let hour = 0; hour < 24; hour++) {
            this.timeSlots.push({
                hour,
                minutes: [0, 15, 30, 45],
                activities: [],
                isSleeping: false,
            });
        }
    }

    updateActivities(report: DailyReport) {
        this.initializeTimeSlots();

        // Add sleep activities and mark sleeping hours
        report.sleeps.forEach((sleep) => {
            const startTime = new Date(sleep.start);
            const endTime = new Date(sleep.end);
            const startHour = startTime.getHours();
            const endHour = endTime.getHours();

            // Add the sleep activity to the start hour
            const startSlot = this.timeSlots.find((slot) =>
                slot.hour === startHour
            );
            if (startSlot) {
                startSlot.activities.push({
                    type: "sleep",
                    text: `Sleep: ${startTime.getHours()}.${
                        startTime.getMinutes().toString().padStart(2, "0")
                    } - ${endTime.getHours()}.${
                        endTime.getMinutes().toString().padStart(2, "0")
                    }`,
                    sleep: {
                        start: new Date(sleep.start),
                        end: new Date(sleep.end),
                        id: sleep.id,
                    },
                });
            }

            // Mark all hours between start and end as sleeping
            for (let hour = startHour; hour <= endHour; hour++) {
                const slot = this.timeSlots.find((slot) => slot.hour === hour);
                if (slot) {
                    slot.isSleeping = true;
                }
            }
        });

        // Add diaper changes
        report.diapers.forEach((diaper) => {
            const time = new Date(diaper.time);
            const hour = time.getHours();
            const slot = this.timeSlots.find((slot) => slot.hour === hour);
            if (slot) {
                slot.activities.push({
                    type: "diaper",
                    text: `Diaper: ${diaper.type}`,
                    diaper: {
                        id: diaper.id,
                        type: diaper.type as DiaperType,
                        time: new Date(diaper.time),
                    },
                });
            }
        });

        // Add nursing sessions
        report.nursings.forEach((nursing) => {
            const time = new Date(nursing.time);
            const hour = time.getHours();
            const slot = this.timeSlots.find((slot) => slot.hour === hour);
            if (slot) {
                slot.activities.push({
                    type: "nursing",
                    text: `Nursing: ${nursing.type}`,
                    nursing: {
                        id: nursing.id,
                        type: nursing.type as NursingType,
                        time: new Date(nursing.time),
                        amount: nursing.amount as
                            | "a little"
                            | "medium"
                            | "a lot",
                    },
                });
            }
        });
    }

    async ionViewWillEnter() {
        try {
            const report = await this.reportService.getDailyReport();
            console.log(report);
            this.report.set(report);
            if (report) {
                this.updateActivities(report);
            }
        } catch (error) {
            console.error("Failed to load report:", error);
        }
    }

    goBack() {
        this.router.navigate(["/home"]);
    }

    async onActivityClick(activity: TimeSlot["activities"][0]) {
        this.selectedActivity = activity;

        switch (activity.type) {
            case "sleep":
                if (activity.sleep) {
                    await this.sleepForm()?.reset();
                    // Pre-fill the form with existing data
                    // handle timezones
                    const start = new Date(activity.sleep.start);
                    const end = new Date(activity.sleep.end);
                    start.setMinutes(
                        start.getMinutes() - start.getTimezoneOffset(),
                    );
                    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
                    this.sleepForm()!.sleepStart.set(start);
                    this.sleepForm()!.sleepEnd.set(end);
                    await this.sleepModal()?.present();
                }
                break;
            case "diaper":
                if (activity.diaper) {
                    await this.diaperForm()?.reset();
                    // Pre-fill the form
                    this.diaperForm()!.form.patchValue({
                        type: activity.diaper.type,
                    });
                    // handle timezones
                    const time = new Date(activity.diaper.time);
                    time.setMinutes(
                        time.getMinutes() - time.getTimezoneOffset(),
                    );
                    this.diaperForm()!.time.set(time);
                    await this.diaperModal()?.present();
                }
                break;
            case "nursing":
                if (activity.nursing) {
                    await this.nursingForm()?.reset();
                    // Pre-fill the nursing signal
                    const time = new Date(activity.nursing.time);
                    time.setMinutes(
                        time.getMinutes() - time.getTimezoneOffset(),
                    );
                    this.nursingForm()!.nursing.set({
                        type: activity.nursing.type,
                        time: time,
                        amount: activity.nursing.amount,
                    });
                    await this.nursingModal()?.present();
                }
                break;
        }
    }

    async onSleepEdit(event: SleepInput | undefined) {
        if (event && this.selectedActivity?.sleep?.id) {
            event.id = this.selectedActivity.sleep.id;

            await this.storageService.editSleep(event);
            await this.refreshData();
        }
        await this.sleepModal()?.dismiss();
    }

    async onDiaperEdit(event: DiaperInput | undefined) {
        if (event && this.selectedActivity?.diaper?.id) {
            event.id = this.selectedActivity.diaper.id;
            await this.storageService.editDiaper(event);
            await this.refreshData();
        }
        await this.diaperModal()?.dismiss();
    }

    async onNursingEdit(event: NursingInput | undefined) {
        if (event && this.selectedActivity?.nursing?.id) {
            event.id = this.selectedActivity.nursing.id;
            await this.storageService.editNursing(event);
            await this.refreshData();
        }
        await this.nursingModal()?.dismiss();
    }

    async refreshData() {
        const report = await this.reportService.getDailyReport();
        this.report.set(report);
        if (report) {
            this.updateActivities(report);
        }
    }
}
