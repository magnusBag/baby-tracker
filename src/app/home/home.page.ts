import { Component, inject, signal, viewChild } from "@angular/core";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonMenu,
  IonMenuButton,
  IonModal,
  ViewWillEnter,
} from "@ionic/angular/standalone";
import { CommonModule } from "@angular/common";
import { addIcons } from "ionicons";
import { gridOutline, menuOutline } from "ionicons/icons";
import { Router } from "@angular/router";
import { LongPressDirective } from "../components/directives/long-press.directive";
import { SleepFormComponent } from "../components/sleep-form/sleep-form.component";
import { StorageService } from "../services/storage.service";
import { DarkModeService } from "../services/dark-mode.service";
import { DiaperFormComponent } from "../components/diaper-form/diaper-form.component";
import { DiaperInput, NursingInput, SleepInput } from "../components/models";
import { BabyService } from "../services/baby.service";
import { NursingFormComponent } from "../components/nursing-form/nursing-form.component";
import { MenuOptionsComponent } from "../components/menu-options/menu-options.component";
import { ReportService } from "../services/report.service";

@Component({
  selector: "app-home",
  imports: [
    IonContent,
    CommonModule,
    IonButton,
    IonModal,
    IonButtons,
    LongPressDirective,
    SleepFormComponent,
    DiaperFormComponent,
    NursingFormComponent,
    IonMenu,
    IonMenuButton,
    MenuOptionsComponent,
  ],
  templateUrl: "home.page.html",
  styleUrl: "home.page.scss",
  standalone: true,
})
export class HomePage implements ViewWillEnter {
  storageService = inject(StorageService);
  darkModeService = inject(DarkModeService);
  babyService = inject(BabyService);
  sleepModal = viewChild<IonModal>("sleepModal");
  diaperModal = viewChild<IonModal>("diaperModal");
  nursingModal = viewChild<IonModal>("nursingModal");
  sleepForm = viewChild<SleepFormComponent>("sleepForm");
  diaperForm = viewChild<DiaperFormComponent>("diaperForm");
  nursingForm = viewChild<NursingFormComponent>("nursingForm");
  constructor(private router: Router) {
    addIcons({ menuOutline, gridOutline });
  }

  async ionViewWillEnter() {
    await this.storageService.refreshTotalHoursSlept();
    this.storageService.refresh();
  }

  onLongPressSleep() {
    this.router.navigate(["/timer"]);
  }

  onSleepOutput(event: SleepInput | undefined) {
    if (event) {
      this.storageService.addSleep(event);
    }
    this.sleepModal()!.dismiss();
  }

  resetSleepModal() {
    this.sleepForm()!.reset();
  }

  onDiaperOutput(event: DiaperInput | undefined) {
    if (event) {
      this.storageService.addDiaper(event);
    }
    this.diaperModal()!.dismiss();
  }

  resetDiaperModal() {
    this.diaperForm()!.reset();
  }

  onLongPressDiaper() {
    this.storageService.addDiaper({
      type: "both",
      time: new Date(),
    });
  }

  onLongPressNursing() {
    this.nursingModal()!.present();
  }

  onNursingOutput(event: NursingInput | undefined) {
    if (event) {
      this.storageService.addNursing(event);
    }
    this.nursingModal()!.dismiss();
  }

  resetNursingModal() {
    this.nursingForm()!.reset();
  }
}
