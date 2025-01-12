import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  AlertController,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonRow,
  IonTitle,
  ViewWillEnter,
} from "@ionic/angular/standalone";
import { StorageService } from "../services/storage.service";
import { DiaperInput } from "../components/models";
import { SleepInput } from "../components/models";
import { arrowBackOutline, trashOutline } from "ionicons/icons";
import { Router } from "@angular/router";
import { addIcons } from "ionicons";
import { addTimezoneOffset } from "../components/util";
import { BabyService } from "../services/baby.service";

@Component({
  selector: "app-history",
  templateUrl: "./history.page.html",
  styleUrls: ["./history.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonTitle,
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonRow,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
  ],
})
export class HistoryPage implements ViewWillEnter {
  private storageService = inject(StorageService);
  private alertController = inject(AlertController);
  private router = inject(Router);
  babyService = inject(BabyService);

  diapers = this.storageService.diapers;
  sleeps = this.storageService.sleeps;

  constructor() {
    addIcons({ arrowBackOutline, trashOutline });
  }

  ionViewWillEnter() {
    this.storageService.refresh();
  }

  async showDeleteDiaperAlert(diaper: DiaperInput) {
    const alert = await this.alertController.create({
      header: "Delete Diaper",
      message: "Are you sure you want to delete this diaper?",
      buttons: [
        "Cancel",
        { text: "Delete", handler: () => this.deleteDiaper(diaper) },
      ],
    });
    await alert.present();
  }

  async deleteDiaper(diaper: DiaperInput) {
    if (diaper.id) {
      await this.storageService.deleteDiaper(diaper.id);
    }
  }

  async showDeleteSleepAlert(sleep: SleepInput) {
    const alert = await this.alertController.create({
      header: "Delete Sleep",
      message: "Are you sure you want to delete this sleep?",
      buttons: [
        "Cancel",
        { text: "Delete", handler: () => this.deleteSleep(sleep) },
      ],
    });
    await alert.present();
  }

  async deleteSleep(sleep: SleepInput) {
    if (sleep.id) {
      await this.storageService.deleteSleep(sleep.id);
    }
  }

  goToHome() {
    this.router.navigate(["/home"]);
  }
}
