import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { Baby } from "../components/models";
import { CapacitorHttp } from "@capacitor/core";
import { environment } from "src/environments/environment";
import { Device } from "@capacitor/device";
import { Preferences } from "@capacitor/preferences";

@Injectable({
    providedIn: "root",
})
export class BabyService {
    private apiUrl = environment.apiUrl;

    babies = signal<Baby[]>([]);
    activeBaby = signal<Baby | undefined>(undefined);

    constructor() {
        Preferences.get({ key: "activeBaby" }).then((result) => {
            if (result.value) {
                this.activeBaby.set(JSON.parse(result.value));
            }
        });
    }

    async headers() {
        const deviceID = await Device.getId();
        return {
            "X-Parrent-User-ID": deviceID.identifier,
            "Content-Type": "application/json",
            Accept: "application/json",
        };
    }

    async checkUserExists() {
        const response = await CapacitorHttp.get({
            url: `${this.apiUrl}/user`,
            headers: await this.headers(),
        });
        if (response.status === 404) {
            await this.createUser();
        }
    }

    async createUser() {
        const deviceID = await Device.getId();
        await CapacitorHttp.post({
            url: `${this.apiUrl}/user`,
            headers: await this.headers(),
            data: { id: deviceID.identifier },
        });
    }

    async makeBaby(name: string) {
        try {
            const response = await CapacitorHttp.post({
                url: `${this.apiUrl}/baby`,
                headers: await this.headers(),
                data: { name },
            });
            const newBaby = { ...response.data, active: false };
            console.log("New baby", newBaby);
            this.babies.update((babies) => [...babies, newBaby]);

            if (!this.activeBaby()) {
                await this.setActiveBaby(newBaby);
            }
            return newBaby;
        } catch (error) {
            console.error("Failed to create baby:", error);
            throw error;
        }
    }

    async setActiveBaby(baby: Baby) {
        Preferences.set({ key: "activeBaby", value: JSON.stringify(baby) });
        this.activeBaby.set(baby);
    }

    async refresh() {
        try {
            const response = await CapacitorHttp.get({
                url: `${this.apiUrl}/baby`,
                headers: await this.headers(),
            });
            this.babies.set(response.data ?? []);
        } catch (error) {
            console.error("Failed to fetch babies:", error);
            throw error;
        }
    }

    async deleteBaby(baby: Baby) {
        try {
            await CapacitorHttp.delete({
                url: `${this.apiUrl}/baby/${baby.id}`,
                headers: await this.headers(),
            });
            this.babies.update((babies) =>
                babies.filter((b) => b.id !== baby.id)
            );
        } catch (error) {
            console.error("Failed to delete baby:", error);
            throw error;
        }
    }

    async editBaby(baby: Baby) {
        try {
            await CapacitorHttp.put({
                url: `${this.apiUrl}/baby/${baby.id}`,
                headers: await this.headers(),
                data: { name: baby.name },
            });
            this.babies.update((babies) =>
                babies.map((b) =>
                    b.id === baby.id ? { ...b, name: baby.name } : b
                )
            );
        } catch (error) {
            console.error("Failed to update baby:", error);
            throw error;
        }
    }
}
