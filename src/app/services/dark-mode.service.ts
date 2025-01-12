import { effect, inject, Injectable, signal } from "@angular/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { StorageService } from "./storage.service";
import { Platform } from "@ionic/angular";

@Injectable({
    providedIn: "root",
})
export class DarkModeService {
    private storageService = inject(StorageService);
    private platform = inject(Platform);

    public isDarkMode = signal<boolean>(false);

    constructor() {
        // Initialize the dark mode state
        this.initializeDarkMode();

        // Set up an effect to handle dark mode changes
        effect(() => {
            this.updateStatusBar(this.isDarkMode());
            this.updateBodyClass(this.isDarkMode());
        });
    }

    private async initializeDarkMode() {
        // First check if user has a stored preference
        this.isDarkMode.set(
            window.matchMedia("(prefers-color-scheme: dark)").matches,
        );

        this.initializeSystemPreferenceListener();
    }

    private initializeSystemPreferenceListener() {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        // Listen for system theme changes
        mediaQuery.addEventListener("change", (e) => {
            this.isDarkMode.set(e.matches);
        });
    }

    private updateStatusBar(darkMode: boolean) {
        if (this.platform.is("capacitor")) {
            StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light });
            StatusBar.setBackgroundColor({
                color: darkMode ? "#121212" : "#E0E1DD",
            });
        }
    }

    private updateBodyClass(darkMode: boolean) {
        // Update body class for CSS dark mode
        document.body.classList.toggle("dark", darkMode);
    }

    public async toggleDarkMode() {
        const newValue = !this.isDarkMode();
        this.isDarkMode.set(newValue);
    }

    public async setDarkMode(darkMode: boolean) {
        this.isDarkMode.set(darkMode);
    }
}
