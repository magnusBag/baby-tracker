import { BabyService } from "./../services/baby.service";
import { DarkModeService } from "./../services/dark-mode.service";
import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { EmailComposer } from "capacitor-email-composer";
import { Preferences } from "@capacitor/preferences";

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
  IonToggle,
  IonToolbar,
  ViewWillEnter,
} from "@ionic/angular/standalone";
import { Baby } from "../components/models";
import {
  add,
  arrowBackOutline,
  pencil,
  radioButtonOn,
  share,
  shareOutline,
  shareSocial,
  shareSocialOutline,
  star,
  starOutline,
  trash,
} from "ionicons/icons";
import { addIcons } from "ionicons";
import { BubbleNotificationPlugin } from "bubble-notification-plugin";

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
    IonToggle,
  ],
})
export class SettingsPage implements ViewWillEnter {
  babyService = inject(BabyService);
  darkModeService = inject(DarkModeService);
  activeBaby = signal<Baby | null>(null);
  alertController = inject(AlertController);
  router = inject(Router);
  startOnHistory = signal(false);
  constructor() {
    addIcons({
      arrowBackOutline,
      trash,
      pencil,
      shareSocial,
      star,
      starOutline,
      add,
      shareSocialOutline,
      share,
      radioButtonOn,
    });
  }

  async ionViewWillEnter() {
    console.log("ionViewWillEnter");
    this.babyService.refresh();
    const { value } = await Preferences.get({ key: "startOnHistory" });
    this.startOnHistory.set(value === "true");
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

  async openAddBabyByIdAlert() {
    const alert = await this.alertController.create({
      header: "Add baby by id",
      inputs: [{ name: "id", type: "text", placeholder: "Baby id" }],
      buttons: [
        {
          text: "Add",
          handler: (data) => this.babyService.addBabyById(data.id),
        },
        { text: "Cancel", role: "cancel" },
      ],
    });
    await alert.present();
  }

  makeMailToBaby(baby: Baby) {
    EmailComposer.open({
      subject: "Baby Tracker - Add baby to your account",
      body:
        `To add ${baby.name} to your account, copy the id and add the baby in the settings page. <br> Baby ID: ${baby.id}`,
      isHtml: true,
    });
  }

  async toggleStartOnHistory(event: any) {
    const isChecked = event.detail.checked;
    await Preferences.set({
      key: "startOnHistory",
      value: isChecked.toString(),
    });
    this.startOnHistory.set(isChecked);
  }

  async showBubbleNotification() {
    await this.babyService.getActiveBaby();
    const babyName = this.babyService.activeBaby()?.name || "your baby";

    await BubbleNotificationPlugin.showBubbleNotification({
      title: "Baby Tracker",
      content:
        `Track ${babyName}'s activities - tap to quickly add new entries!`,
    });
  }
}
