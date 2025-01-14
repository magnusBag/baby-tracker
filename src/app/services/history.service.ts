import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { CapacitorHttp } from "@capacitor/core";
import { Device } from "@capacitor/device";

@Injectable({
    providedIn: "root",
})
export class HistoryService {
    constructor() {}
    private async headers() {
        const deviceID = await Device.getId();
        return {
            "X-Parrent-User-ID": deviceID.identifier,
            "Content-Type": "application/json",
            Accept: "application/json",
        };
    }

    async getHistoryForBaby(babyId: string, date: Date = new Date()) {
        // date is in format YYYY-MM-DD
        const response = await CapacitorHttp.get({
            url: `${environment.apiUrl}/report/${babyId}/history/${
                date.toISOString().split("T")[0]
            }`,
            headers: await this.headers(),
        });
        return response.data;
    }
}
