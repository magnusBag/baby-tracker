import { effect, Injectable, OnInit, signal } from "@angular/core";
import { AuthService } from "./auth.service";
import { BabyService } from "./baby.service";
import { Preferences } from "@capacitor/preferences";
import { Router } from "@angular/router";

@Injectable({
    providedIn: "root",
})
export class InitService {
    startPage = signal<string | undefined>(undefined);
    constructor(
        private authService: AuthService,
        private babyService: BabyService,
        private router: Router,
    ) {
        effect(() => {
            const startPage = this.startPage();
            if (startPage) {
                Preferences.set({ key: "startPage", value: startPage });
            }
        });
    }
    

    async initialize() {
        // First check authentication
        const isAuthenticated = await this.authService.checkAuthentication();
        if (!isAuthenticated) {
            return;
        }
        const startPage = await Preferences.get({ key: "startPage" });
        
        switch (startPage.value) {
            case "timeline":
                this.router.navigate(["/timeline"], { queryParams: { isHomePage: true } });
                break;
            case "history":
                this.router.navigate(["/history"], { queryParams: { startOnHistory: true } });
                break;
            default:
                break;
        }
        // Then check if we have a baby
        await this.babyService.refresh();
        if (!this.babyService.activeBaby()) {
            const babyName = `First baby`;
            await this.babyService.makeBaby(babyName);
        }

    }
}
