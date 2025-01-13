import { Component, inject } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { App } from "@capacitor/app";
import { Router } from "@angular/router";
import { AlertController, ToastController } from "@ionic/angular/standalone";
import { DarkModeService } from "./services/dark-mode.service";
import { BabyService } from "./services/baby.service";
import { StorageService } from "./services/storage.service";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private darkModeService = inject(DarkModeService);
  private babyService = inject(BabyService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private storageService = inject(StorageService);
  private router = inject(Router);

  constructor() {
    this.initializeApp();
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
    this.babyService.checkUserExists();
    this.storageService.refresh();
  }
}
