import { Component, inject, OnInit } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { App } from "@capacitor/app";
import { Router } from "@angular/router";
import { AlertController, ToastController } from "@ionic/angular/standalone";
import { DarkModeService } from "./services/dark-mode.service";
import { BabyService } from "./services/baby.service";
import { StorageService } from "./services/storage.service";
import { Preferences } from "@capacitor/preferences";
import { BubbleNotificationPlugin } from "bubble-notification-plugin";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private darkModeService = inject(DarkModeService);
  private babyService = inject(BabyService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private storageService = inject(StorageService);
  private router = inject(Router);

  constructor() {
    this.initializeApp();
  }

  async ngOnInit() {
    await this.babyService.getActiveBaby();
    const { value } = await Preferences.get({ key: "startOnHistory" });
    if (value === "true") {
      this.router.navigate(["/history"]);
    }
  }

  private initializeApp() {
    // Handle deep links
    App.addListener("appUrlOpen", (event) => {
      console.log("Deep link received:", event.url);
      const slug = event.url.split("babytracker://app/").pop();
      if (slug) {
        console.log("Navigating to:", slug);
        this.router.navigateByUrl(slug);
      }
    });

    // Listen for app pause event (when app goes to background or is closed)
    App.addListener("pause", async () => {
      try {
        await this.babyService.getActiveBaby();
        const babyName = this.babyService.activeBaby()?.name || "your baby";

        await BubbleNotificationPlugin.showBubbleNotification({
          title: "Baby Tracker",
          content:
            `Track ${babyName}'s activities - tap to quickly add new entries!`,
        });
      } catch (error) {
        console.error("Failed to show bubble notification:", error);
      }
    });

    this.babyService.checkUserExists();
    this.storageService.refresh();
  }
}
