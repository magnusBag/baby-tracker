import { Component, effect, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { ReportService, WeeklyReport } from "../services/report.service";
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
import { Preferences } from "@capacitor/preferences";
import { LongPressDirective } from "../components/directives/long-press.directive";
registerLocaleData(localeDa);

@Component({
    selector: "app-weekly-report",
    template: `
        <ion-toolbar>
            <ion-buttons slot="start">
                <ion-button (click)="goBack()">
                    <ion-icon name="arrow-back-outline"></ion-icon>
                </ion-button>
            </ion-buttons>
            <ion-title>Weekly Report</ion-title>
        </ion-toolbar>

        <ion-content class="ion-padding">
            @if (report(); as report) {
                <div class="report-container">
                    <div class="date-range">
                        {{ report.startDate | date:'dd/MM/yyyy':'':'da-DK' }} - {{ report.endDate | date:'dd/MM/yyyy':'':'da-DK' }}
                    </div>

                    <div class="averages">
                        <div class="average-item">
                            <div class="label">Avg. Sleep</div>
                            <div class="value">{{ report.avgSleepHours | number:'1.1-1' }} hours</div>
                        </div>
                        <div class="average-item">
                            <div class="label">Avg. Diapers</div>
                            <div class="value">{{ report.avgDiapersPerDay | number:'1.0-0' }}/day</div>
                        </div>
                        <div class="average-item">
                            <div class="label">Avg. Nursings</div>
                            <div class="value">{{ report.avgNursingsPerDay | number:'1.0-0' }}/day</div>
                        </div>
                    </div>

                    <div class="daily-summaries">
                        <h2>Daily Overview</h2>
                        @for (summary of report.dailySummaries; track summary.date) {
                            <div class="summary-card">
                                <div class="date">{{ summary.date | date:'EEE, dd/MM':'':'da-DK' }}</div>
                                <div class="stats">
                                    <div class="stat">
                                        <span class="label">Sleep:</span>
                                        <span class="value">{{ summary.totalHoursSlept | number:'1.1-1' }}h</span>
                                    </div>
                                    <div class="stat">
                                        <span class="label">Diapers:</span>
                                        <span class="value">{{ summary.diaperCount }}</span>
                                    </div>
                                    <div class="stat">
                                        <span class="label">Nursings:</span>
                                        <span class="value">{{ summary.nursingCount }}</span>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            } @else {
                <div class="loading">Loading...</div>
            }
        </ion-content>

        <style>
            .report-container {
                max-width: 800px;
                margin: 0 auto;
            }

            .date-range {
                text-align: center;
                font-size: 1.2rem;
                margin-bottom: 2rem;
                color: var(--ion-color-medium);
            }

            .averages {
                display: flex;
                flex-direction: row;
                justify-content: center;
                margin-bottom: 2rem;
                gap: 0.5rem;
            }

            .average-item {
                background: var(--ion-color-light);
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
                flex: 1;
            }

            .average-item .label {
                font-size: 0.9rem;
                color: var(--ion-color-medium);
                margin-bottom: 0.5rem;
            }

            .average-item .value {
                font-size: 1.2rem;
                font-weight: bold;
            }

            .daily-summaries h2 {
                margin-bottom: 1rem;
            }

            .summary-card {
                background: var(--ion-color-light);
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
            }

            .summary-card .date {
                font-weight: bold;
                margin-bottom: 0.5rem;
            }

            .summary-card .stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5rem;
            }

            .stat {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.2rem;
            }

            .stat .label {
                font-size: 0.8rem;
                color: var(--ion-color-medium);
            }

            .stat .value {
                font-weight: bold;
            }

            .loading {
                text-align: center;
                padding: 2rem;
                color: var(--ion-color-medium);
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
export class WeeklyReportPage implements ViewWillEnter {
    private reportService = inject(ReportService);
    private router = inject(Router);
    report = signal<WeeklyReport | null>(null);
    constructor() {
        addIcons({ arrowBackOutline });
    }

    async ionViewWillEnter() {
        try {
            const report = await this.reportService.getWeeklyReport();
            this.report.set(report);
        } catch (error) {
            console.error("Failed to load weekly report:", error);
        }
    }

    goBack() {
        this.router.navigate(["/home"]);
    }
}
