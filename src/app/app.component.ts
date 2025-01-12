import { Component, inject } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { DarkModeService } from "./services/dark-mode.service";
import { BabyService } from "./services/baby.service";
import { Router } from "@angular/router";
import { AlertController, ToastController } from "@ionic/angular/standalone";

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
  private router = inject(Router);
  constructor() {
    const userExists = this.babyService.checkUserExists();
  }
}
