import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { DailyReport, ReportService } from "../services/report.service";
import {
    IonButton,
    IonButtons,
    IonContent,
    IonIcon,
    IonTitle,
    IonToolbar,
    ViewWillEnter,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackOutline } from "ionicons/icons";
import { registerLocaleData } from "@angular/common";
import localeDa from "@angular/common/locales/da";
import { StorageService } from "../services/storage.service";

registerLocaleData(localeDa);

interface TimeSlot {
    hour: number;
    minutes: number[];
    activities: {
        type: "sleep" | "diaper" | "nursing";
        text: string;
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
                  <div class="activity {{ activity.type }}">
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
    ],
})
export class CalendarPage implements ViewWillEnter {
    private reportService = inject(ReportService);
    storageService = inject(StorageService);
    private router = inject(Router);
    report = signal<DailyReport | null>(null);
    currentDate = new Date();
    timeSlots: TimeSlot[] = [];

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
}
