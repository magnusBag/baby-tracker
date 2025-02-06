import { Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { BabyService } from "./baby.service";
import { Preferences } from "@capacitor/preferences";
import { Router } from "@angular/router";

@Injectable({
    providedIn: "root",
})
export class InitService {
    constructor(
        private authService: AuthService,
        private babyService: BabyService,
        private router: Router,
    ) {}

    async initialize() {
        // First check authentication
        const isAuthenticated = await this.authService.checkAuthentication();
        if (!isAuthenticated) {
            return;
        }
        const startOnHistory = await Preferences.get({ key: "startOnHistory" });
        if (startOnHistory.value === "true") {
            this.router.navigate(["/history"], { queryParams: { startOnHistory: true } });
        }

        // Then check if we have a baby
        await this.babyService.refresh();
        if (!this.babyService.activeBaby()) {
            const babyName = `First baby`;
            await this.babyService.makeBaby(babyName);
        }

    }
}
