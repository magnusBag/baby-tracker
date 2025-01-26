import { effect, inject, Injectable, signal } from "@angular/core";
import { CapacitorHttp } from "@capacitor/core";
import { environment } from "src/environments/environment";
import { BabyService } from "./baby.service";
import { AuthService } from "./auth.service";
import { HeadersService } from "./headers.service";

export interface DailyReport {
    date: string;
    diapers: Array<{
        id: string;
        type: string;
        time: string;
    }>;
    nursings: Array<{
        id: string;
        time: string;
        type: string;
        amount: string;
    }>;
    sleeps: Array<{
        id: string;
        start: string;
        end: string;
    }>;
    totalHoursSlept: number;
}

export interface DailySummary {
    date: string;
    totalHoursSlept: number;
    diaperCount: number;
    nursingCount: number;
}

export interface WeeklyReport {
    startDate: string;
    endDate: string;
    dailySummaries: DailySummary[];
    avgSleepHours: number;
    avgDiapersPerDay: number;
    avgNursingsPerDay: number;
}

@Injectable({
    providedIn: "root",
})
export class ReportService {
    private apiUrl = environment.apiUrl;
    private babyService = inject(BabyService);
    private headersService = inject(HeadersService);

    constructor() {
    }

    async getDailyReport(date?: string): Promise<DailyReport> {
        const activeBaby = this.babyService.activeBaby();
        if (!activeBaby) {
            throw new Error("No active baby selected");
        }

        const queryParams = date ? `?date=${date}` : "";
        const response = await CapacitorHttp.get({
            url: `${this.apiUrl}/report/${activeBaby.id}${queryParams}`,
            headers: await this.headersService.getHeaders(),
        });

        return response.data;
    }

    async getWeeklyReport(endDate?: string): Promise<WeeklyReport> {
        const activeBaby = this.babyService.activeBaby();
        if (!activeBaby) {
            throw new Error("No active baby selected");
        }

        const queryParams = endDate ? `?endDate=${endDate}` : "";
        const response = await CapacitorHttp.get({
            url: `${this.apiUrl}/report/${activeBaby.id}/weekly${queryParams}`,
            headers: await this.headersService.getHeaders(),
        });

        return response.data;
    }
}
