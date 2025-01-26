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
import { HeadersService } from "./headers.service";

@Injectable({
    providedIn: "root",
})
export class StorageService {
    toastController = inject(ToastController);
    babyService = inject(BabyService);
    headersService = inject(HeadersService);
    totalHoursSlept = signal<number>(0);

    private apiUrl = environment.apiUrl;

    sleeps = signal<SleepInput[]>([]);
    diapers = signal<DiaperInput[]>([]);
    nursings = signal<NursingInput[]>([]);

    totalDiapersToday = computed(() => {
        const diapers = this.diapers();
        if (!Array.isArray(diapers)) return [];
        return diapers
            .filter((diaper) => this.compareDates(diaper.time, new Date()))
            .map((diaper, index) => ({
                ...diaper,
                id: diaper.id || `today-${index}`,
            }));
    });

    totalNursingsToday = computed(() => {
        const nursings = this.nursings();
        if (!Array.isArray(nursings)) return [];
        return nursings
            .filter((nursing) => this.compareDates(nursing.time, new Date()))
            .map((nursing, index) => ({
                ...nursing,
                id: nursing.id || `today-${index}`,
            }));
    });

    sleepArrayFromTotalHoursSlept = computed(() => {
        this.sleeps();
        this.refreshTotalHoursSlept().catch(() => {
            // Ignore errors here as they'll be handled in refreshTotalHoursSlept
        });
        const totalHoursSlept = this.totalHoursSlept();
        const array = [];
        for (let i = 0; i < totalHoursSlept; i++) {
            array.push({
                type: totalHoursSlept - i < 1 ? "half" : "full",
                id: `sleep-${i}`,
            });
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
            this.refreshTotalHoursSlept().catch(() => {
                // Ignore errors here as they'll be handled in refreshTotalHoursSlept
            });
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

    async refresh() {
        const activeBaby = this.babyService.activeBaby();
        if (!activeBaby) {
            this.sleeps.set([]);
            this.diapers.set([]);
            this.nursings.set([]);
            return;
        }

        const today = new Date().toISOString().split("T")[0];

        try {
            const response = await CapacitorHttp.get({
                url: `${this.apiUrl}/report/${activeBaby.id}/history/${today}`,
                headers: await this.headersService.getHeaders(),
            });

            if (response.data) {
                this.sleeps.set(response.data.sleeps || []);
                this.diapers.set(response.data.diapers || []);
                this.nursings.set(response.data.nursings || []);
            } else {
                this.sleeps.set([]);
                this.diapers.set([]);
                this.nursings.set([]);
            }
        } catch (error) {
            console.error("Failed to refresh data:", error);
            this.sleeps.set([]);
            this.diapers.set([]);
            this.nursings.set([]);
            await this.showToast("Failed to refresh data");
            throw error;
        }
    }

    async refreshTotalHoursSlept(): Promise<void> {
        const activeBaby = this.babyService.activeBaby();
        if (!activeBaby) {
            this.totalHoursSlept.set(0);
            return;
        }
        const today = new Date().toISOString().split("T")[0];

        try {
            const response = await CapacitorHttp.get({
                url: `${this.apiUrl}/report/${activeBaby.id}/history/${today}`,
                headers: await this.headersService.getHeaders(),
            });

            if (response.data && Array.isArray(response.data.sleeps)) {
                const totalHoursSlept = response.data.sleeps.reduce(
                    (acc: number, sleep: SleepInput) => {
                        return acc +
                            (new Date(sleep.end).getTime() -
                                    new Date(sleep.start).getTime()) / 3600000;
                    },
                    0,
                );
                this.totalHoursSlept.set(totalHoursSlept);
            } else {
                this.totalHoursSlept.set(0);
            }
        } catch (error) {
            console.error("Failed to refresh total hours slept:", error);
            this.totalHoursSlept.set(0);
        }
    }

    async getTotalHoursSleptForDate(
        date?: string,
        babyId?: string,
    ): Promise<number> {
        if (!babyId) {
            babyId = this.babyService.activeBaby()?.id;
        }
        if (!babyId) {
            return 0;
        }
        const dateString = date ??
            new Date().toISOString().split("T")[0].replace(/-/g, "/");
        try {
            const response = await CapacitorHttp.get({
                url: `${this.apiUrl}/sleep/${babyId}/date/${dateString}`,
                headers: await this.headersService.getHeaders(),
            });
            return response.data.totalHoursSlept ?? 0;
        } catch (error) {
            console.error("Failed to get total hours slept:", error);
            return 0;
        }
    }

    async addSleep(sleep: SleepInput, babyName: string = "My") {
        sleep.babyId = sleep.babyId ?? this.babyService.activeBaby()?.id;
        if (!sleep.babyId) {
            await this.showToast("No active baby selected");
            throw new Error("No active baby selected");
        }

        try {
            const response = await CapacitorHttp.post({
                url: `${this.apiUrl}/sleep`,
                headers: await this.headersService.getHeaders(),
                data: sleep,
            });
            const newSleep = response.data;

            this.sleeps.update((sleeps) => [...(sleeps ?? []), newSleep]);
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
                headers: await this.headersService.getHeaders(),
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
        if (!diaper.babyId) {
            await this.showToast("No active baby selected");
            throw new Error("No active baby selected");
        }

        try {
            const response = await CapacitorHttp.post({
                url: `${this.apiUrl}/diaper`,
                headers: await this.headersService.getHeaders(),
                data: diaper,
            });
            const newDiaper = response.data;

            this.diapers.update((diapers) => [...(diapers ?? []), newDiaper]);
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

    async editSleep(sleep: SleepInput) {
        try {
            await CapacitorHttp.put({
                url: `${this.apiUrl}/sleep/${sleep.id}`,
                headers: await this.headersService.getHeaders(),
                data: sleep,
            });
            await this.refresh();
        } catch (error) {
            await this.showToast("Failed to edit sleep record");
            throw error;
        }
    }

    async editDiaper(diaper: DiaperInput) {
        try {
            await CapacitorHttp.put({
                url: `${this.apiUrl}/diaper/${diaper.id}`,
                headers: await this.headersService.getHeaders(),
                data: diaper,
            });
            await this.refresh();
        } catch (error) {
            await this.showToast("Failed to edit diaper record");
            throw error;
        }
    }

    async editNursing(nursing: NursingInput) {
        try {
            await CapacitorHttp.put({
                url: `${this.apiUrl}/nursing/${nursing.id}`,
                headers: await this.headersService.getHeaders(),
                data: nursing,
            });
            await this.refresh();
        } catch (error) {
            await this.showToast("Failed to edit nursing record");
            throw error;
        }
    }

    async deleteDiaper(diaperId: string) {
        try {
            await CapacitorHttp.delete({
                url: `${this.apiUrl}/diaper/${diaperId}`,
                headers: await this.headersService.getHeaders(),
            });

            this.diapers.update((diapers) =>
                diapers.filter((diaper) => diaper.id !== diaperId)
            );
            await this.refresh();
        } catch (error) {
            await this.showToast("Failed to delete diaper record");
            throw error;
        }
    }

    async addNursing(nursing: NursingInput) {
        nursing.babyId = nursing.babyId ?? this.babyService.activeBaby()?.id;
        if (!nursing.babyId) {
            await this.showToast("No active baby selected");
            throw new Error("No active baby selected");
        }

        try {
            const response = await CapacitorHttp.post({
                url: `${this.apiUrl}/nursing`,
                headers: await this.headersService.getHeaders(),
                data: nursing,
            });
            const newNursing = response.data;

            this.nursings.update((
                nursings,
            ) => [...(nursings ?? []), newNursing]);
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
                headers: await this.headersService.getHeaders(),
            });

            this.nursings.update((nursings) =>
                nursings.filter((nursing) => nursing.id !== nursingId)
            );
        } catch (error) {
            await this.showToast("Failed to delete nursing record");
            throw error;
        }
    }

    async showToast(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            position: "bottom",
        });
        await toast.present();
    }
}
