import { effect, inject, Injectable, signal } from "@angular/core";
import { CapacitorHttp } from "@capacitor/core";
import { environment } from "src/environments/environment";
import { BabyService } from "./baby.service";

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
    }>;
    sleeps: Array<{
        id: string;
        start: string;
        end: string;
    }>;
    totalHoursSlept: number;
}

@Injectable({
    providedIn: "root",
})
export class ReportService {
    private apiUrl = environment.apiUrl;
    private babyService = inject(BabyService);

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
            headers: await this.babyService.headers(),
        });

        return response.data;
    }
}
