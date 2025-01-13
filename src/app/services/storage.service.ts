import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { Preferences } from "@capacitor/preferences";
import { ToastController } from "@ionic/angular/standalone";
import { DiaperInput, NursingInput, SleepInput } from "../components/models";
import { formatDisplayTime } from "../components/util";
import { BabyService } from "./baby.service";
import { CapacitorHttp } from "@capacitor/core";
import { environment } from "src/environments/environment";
import { Device } from "@capacitor/device";
import { ReportService } from "./report.service";

@Injectable({
    providedIn: "root",
})
export class StorageService {
    toastController = inject(ToastController);
    babyService = inject(BabyService);
    totalHoursSlept = signal<number>(0);

    private apiUrl = environment.apiUrl;

    sleeps = signal<SleepInput[]>([]);
    diapers = signal<DiaperInput[]>([]);
    nursings = signal<NursingInput[]>([]);

    totalDiapersToday = computed(() =>
        this.diapers().filter((diaper) =>
            this.compareDates(diaper.time, new Date())
        )
    );
    totalNursingsToday = computed(() =>
        this.nursings().filter((nursing) =>
            this.compareDates(nursing.time, new Date())
        )
    );

    sleepArrayFromTotalHoursSlept = computed(() => {
        this.sleeps();
        this.refreshTotalHoursSlept();
        const totalHoursSlept = this.totalHoursSlept();
        const array = [];
        for (let i = 0; i < totalHoursSlept; i++) {
            array.push(totalHoursSlept - i < 1 ? "half" : "full");
        }
        return array;
    });

    compareDates(date1: Date, date2: Date) {
        if (typeof date1 === "string") {
            date1 = new Date(date1);
        }
        if (typeof date2 === "string") {
            date2 = new Date(date2);
        }
        return date1.toISOString().split("T")[0] ===
            date2.toISOString().split("T")[0];
    }
    constructor() {
        effect(() => {
            this.sleeps();
            this.refreshTotalHoursSlept();
        });
    }

    saveLastTimer(lastTimer: Date) {
        Preferences.set({
            key: "lastTimer",
            value: lastTimer.toISOString(),
        });
    }

    async getLastTimer() {
        const lastTimer = await Preferences.get({ key: "lastTimer" });
        this.removeLastTimer();
        return lastTimer;
    }

    async removeLastTimer() {
        await Preferences.remove({ key: "lastTimer" });
    }

    private async headers() {
        const deviceID = await Device.getId();
        return {
            "X-Parrent-User-ID": deviceID.identifier,
            "Content-Type": "application/json",
            Accept: "application/json",
        };
    }

    async refreshTotalHoursSlept(): Promise<void> {
        const activeBaby = this.babyService.activeBaby();
        if (!activeBaby) {
            throw new Error("No active baby selected");
        }
        const dateString = new Date().toISOString().split("T")[0].replace(
            /-/g,
            "/",
        );

        const response = await CapacitorHttp.get({
            url: `${this.apiUrl}/sleep/${activeBaby.id}/date/${dateString}`,
            headers: await this.babyService.headers(),
        });
        //calculate total hours slept from the response.sleeps
        const totalHoursSlept = response.data.reduce(
            (acc: number, sleep: SleepInput) => {
                return acc +
                    (new Date(sleep.end).getTime() -
                            new Date(sleep.start).getTime()) /
                        3600000;
            },
            0,
        );
        this.totalHoursSlept.set(totalHoursSlept);
    }

    async getTotalHoursSleptForDate(
        date?: string,
        babyId?: string,
    ): Promise<number> {
        if (!babyId) {
            babyId = this.babyService.activeBaby()?.id;
        }
        const dateString = date ??
            new Date().toISOString().split("T")[0].replace(/-/g, "/");
        const response = await CapacitorHttp.get({
            url: `${this.apiUrl}/sleep/${babyId}/date/${dateString}`,
            headers: await this.babyService.headers(),
        });
        return response.data.totalHoursSlept;
    }

    async addSleep(sleep: SleepInput, babyName: string = "My") {
        sleep.babyId = sleep.babyId ?? this.babyService.activeBaby()?.id;
        console.log(sleep);

        try {
            const response = await CapacitorHttp.post({
                url: `${this.apiUrl}/sleep`,
                headers: await this.headers(),
                data: sleep,
            });
            const newSleep = response.data;

            this.sleeps.update((sleeps) => [...sleeps, newSleep]);
            await this.showToast(
                `Added ${babyName} sleep from ${
                    formatDisplayTime(sleep.start)
                } to ${formatDisplayTime(sleep.end)}`,
            );
        } catch (error) {
            await this.showToast("Failed to add sleep record");
            throw error;
        }
    }

    async deleteSleep(sleepId: string) {
        try {
            await CapacitorHttp.delete({
                url: `${this.apiUrl}/sleep/${sleepId}`,
                headers: await this.headers(),
            });

            this.sleeps.update((sleeps) =>
                sleeps.filter((sleep) => sleep.id !== sleepId)
            );
        } catch (error) {
            await this.showToast("Failed to delete sleep record");
            throw error;
        }
    }

    async addDiaper(diaper: DiaperInput) {
        diaper.babyId = diaper.babyId ?? this.babyService.activeBaby()?.id;

        try {
            const response = await CapacitorHttp.post({
                url: `${this.apiUrl}/diaper`,
                headers: await this.headers(),
                data: diaper,
            });
            const newDiaper = response.data;

            this.diapers.update((diapers) => [...diapers, newDiaper]);
            await this.showToast(
                `Added diaper: type: ${diaper.type}, time: ${
                    formatDisplayTime(diaper.time)
                }`,
            );
        } catch (error) {
            await this.showToast("Failed to add diaper record");
            throw error;
        }
    }

    async deleteDiaper(diaperId: string) {
        try {
            await CapacitorHttp.delete({
                url: `${this.apiUrl}/diaper/${diaperId}`,
                headers: await this.headers(),
            });

            this.diapers.update((diapers) =>
                diapers.filter((diaper) => diaper.id !== diaperId)
            );
        } catch (error) {
            await this.showToast("Failed to delete diaper record");
            throw error;
        }
    }

    async addNursing(nursing: NursingInput) {
        nursing.babyId = nursing.babyId ?? this.babyService.activeBaby()?.id;

        try {
            const response = await CapacitorHttp.post({
                url: `${this.apiUrl}/nursing`,
                headers: await this.headers(),
                data: nursing,
            });
            const newNursing = response.data;

            this.nursings.update((nursings) => [...nursings, newNursing]);
            await this.showToast(
                `Added nursing: ${nursing.amount} ${nursing.type}, time: ${
                    formatDisplayTime(nursing.time)
                }`,
            );
        } catch (error) {
            await this.showToast("Failed to add nursing record");
            throw error;
        }
    }

    async deleteNursing(nursingId: string) {
        try {
            await CapacitorHttp.delete({
                url: `${this.apiUrl}/nursing/${nursingId}`,
                headers: await this.headers(),
            });

            this.nursings.update((nursings) =>
                nursings.filter((nursing) => nursing.id !== nursingId)
            );
        } catch (error) {
            await this.showToast("Failed to delete nursing record");
            throw error;
        }
    }

    async refresh() {
        try {
            const [sleepsResponse, diapersResponse, nursingsResponse] =
                await Promise.all([
                    CapacitorHttp.get({
                        url: `${this.apiUrl}/sleep`,
                        headers: await this.headers(),
                    }),
                    CapacitorHttp.get({
                        url: `${this.apiUrl}/diaper`,
                        headers: await this.headers(),
                    }),
                    CapacitorHttp.get({
                        url: `${this.apiUrl}/nursing`,
                        headers: await this.headers(),
                    }),
                ]);

            this.sleeps.set(sleepsResponse.data ?? []);
            this.diapers.set(diapersResponse.data ?? []);
            this.nursings.set(nursingsResponse.data ?? []);
        } catch (error) {
            await this.showToast("Failed to refresh data");
            throw error;
        }
    }

    async showToast(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            position: "top",
            color: "primary",
        });
        await toast.present();
    }
}
