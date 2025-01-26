import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { Baby } from "../components/models";
import { CapacitorHttp } from "@capacitor/core";
import { environment } from "src/environments/environment";
import { Device } from "@capacitor/device";
import { Preferences } from "@capacitor/preferences";
import { HeadersService } from "./headers.service";

@Injectable({
    providedIn: "root",
})
export class BabyService {
    private apiUrl = environment.apiUrl;

    babies = signal<Baby[]>([]);
    activeBaby = signal<Baby | undefined>(undefined);

    constructor(private headersService: HeadersService) {
        this.loadActiveBaby();
    }

    private async loadActiveBaby() {
        const result = await Preferences.get({ key: "activeBaby" });
        if (result.value) {
            const savedBaby = JSON.parse(result.value);
            this.activeBaby.set(savedBaby);
        }
    }

    async getActiveBaby() {
        const result = await Preferences.get({ key: "activeBaby" });
        if (result.value) {
            const savedBaby = JSON.parse(result.value);
            this.activeBaby.set(savedBaby);
        }
    }

    async headers() {
        return await this.headersService.getHeaders();
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
            const newBaby = response.data;
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

    async addBabyById(id: string) {
        const response = await CapacitorHttp.post({
            url: `${this.apiUrl}/baby/${id}/parent`,
            headers: await this.headers(),
            data: { babyId: id },
        });
        console.log("Baby", response.data);
        await this.refresh();
        return response.data;
    }

    async setActiveBaby(baby: Baby) {
        await Preferences.set({
            key: "activeBaby",
            value: JSON.stringify(baby),
        });
        this.activeBaby.set(baby);
    }

    async refresh() {
        try {
            const response = await CapacitorHttp.get({
                url: `${this.apiUrl}/baby`,
                headers: await this.headers(),
            });

            // Ensure response.data is an array
            const babies = Array.isArray(response.data) ? response.data : [];
            this.babies.set(babies);

            // If we have babies but no active baby, set the first one as active
            if (babies.length > 0 && !this.activeBaby()) {
                await this.setActiveBaby(babies[0]);
            }

            // If we have an active baby, make sure it still exists in the list
            const activeBaby = this.activeBaby();
            if (activeBaby) {
                const babyStillExists = babies.some((b) =>
                    b.id === activeBaby.id
                );
                if (!babyStillExists && babies.length > 0) {
                    await this.setActiveBaby(babies[0]);
                } else if (!babyStillExists) {
                    this.activeBaby.set(undefined);
                }
            }
        } catch (error) {
            console.error("Failed to fetch babies:", error);
            this.babies.set([]);
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

            // If we deleted the active baby, set a new one
            if (this.activeBaby()?.id === baby.id) {
                const remainingBabies = this.babies();
                if (remainingBabies.length > 0) {
                    await this.setActiveBaby(remainingBabies[0]);
                } else {
                    this.activeBaby.set(undefined);
                }
            }
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

            // If we edited the active baby, update it
            if (this.activeBaby()?.id === baby.id) {
                await this.setActiveBaby(baby);
            }
        } catch (error) {
            console.error("Failed to update baby:", error);
            throw error;
        }
    }
}
