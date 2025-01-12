import { BabyService } from "./../services/baby.service";
import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from "@ionic/angular/standalone";
import { Baby } from "../components/models";
import {
  add,
  arrowBackOutline,
  pencil,
  radioButtonOn,
  star,
  starOutline,
  trash,
} from "ionicons/icons";
import { addIcons } from "ionicons";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.page.html",
  styleUrls: ["./settings.page.scss"],
  standalone: true,
  imports: [
    IonItem,
    IonContent,
    IonTitle,
    CommonModule,
    FormsModule,
    IonText,
    IonButton,
    IonIcon,
    IonButtons,
    IonList,
    IonItem,
  ],
})
export class SettingsPage implements ViewWillEnter {
  babyService = inject(BabyService);
  activeBaby = signal<Baby | null>(null);
  alertController = inject(AlertController);
  router = inject(Router);
  constructor() {
    addIcons({
      arrowBackOutline,
      trash,
      pencil,
      star,
      starOutline,
      add,
      radioButtonOn,
    });
  }

  ionViewWillEnter() {
    console.log("ionViewWillEnter");
    this.babyService.refresh();
  }

  async openBabyAlert(baby?: Baby) {
    const alert = await this.alertController.create({
      header: baby ? "Edit baby" : "Make a baby",
      inputs: [{
        name: "name",
        type: "text",
        placeholder: "Baby name",
        value: baby?.name,
      }],
      buttons: [
        {
          text: "Make",
          handler: async (data) => {
            if (this.validateBabyName(data.name)) {
              this.babyService.makeBaby(data.name);
            } else {
              const alert = await this.alertController.create({
                header: "Invalid baby name",
                message: "Please enter a valid baby name",
                buttons: [{ text: "OK" }],
              });
              await alert.present();
            }
          },
        },
        { text: "Cancel", role: "cancel" },
      ],
    });
    await alert.present();
  }
  validateBabyName(name: string) {
    return name.length > 0;
  }
  goBack() {
    this.router.navigate(["/"]);
  }

  async openDeleteBabyAlert(baby: Baby) {
    const alert = await this.alertController.create({
      header: "Delete baby",
      message: "Are you sure you want to delete this baby?",
      buttons: [
        {
          text: "Delete",
          handler: () => {
            this.babyService.deleteBaby(baby);
          },
        },
        { text: "Cancel" },
      ],
    });
    await alert.present();
  }
}
