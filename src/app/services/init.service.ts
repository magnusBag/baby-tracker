import { Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { BabyService } from "./baby.service";
import { Device } from "@capacitor/device";

@Injectable({
    providedIn: "root",
})
export class InitService {
    constructor(
        private authService: AuthService,
        private babyService: BabyService,
    ) {}

    async initialize() {
        // First check authentication
        const isAuthenticated = await this.authService.checkAuthentication();
        if (!isAuthenticated) {
            return;
        }

        // Then check if we have a baby
        await this.babyService.refresh();
        if (!this.babyService.activeBaby()) {
            const deviceId = await Device.getId();
            const babyName = `Baby ${deviceId.identifier.slice(0, 4)}`;
            await this.babyService.makeBaby(babyName);
        }
    }
}
