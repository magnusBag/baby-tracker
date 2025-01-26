import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { CapacitorHttp } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { HeadersService } from "./headers.service";

@Injectable({
    providedIn: "root",
})
export class HistoryService {
    constructor(private headersService: HeadersService) {}

    async getHistoryForBaby(babyId: string, date: Date = new Date()) {
        // date is in format YYYY-MM-DD
        const response = await CapacitorHttp.get({
            url: `${environment.apiUrl}/report/${babyId}/history/${
                date.toISOString().split("T")[0]
            }`,
            headers: await this.headersService.getHeaders(),
        });
        return response.data;
    }
}
