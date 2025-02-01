import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  ViewChild,
  viewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  AlertController,
  Gesture,
  GestureController,
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonRippleEffect,
  IonRow,
  IonTitle,
  ViewDidEnter,
  ViewWillEnter,
} from "@ionic/angular/standalone";
import { StorageService } from "../services/storage.service";
import { DiaperInput, NursingInput } from "../components/models";
import { SleepInput } from "../components/models";
import {
  addOutline,
  arrowBackOutline,
  arrowForwardOutline,
  pencilOutline,
  trashOutline,
} from "ionicons/icons";
import { Router } from "@angular/router";
import { addIcons } from "ionicons";
import { addTimezoneOffset } from "../components/util";
import { BabyService } from "../services/baby.service";
import { HistoryService } from "../services/history.service";
import { SleepFormComponent } from "../components/sleep-form/sleep-form.component";
import { DiaperFormComponent } from "../components/diaper-form/diaper-form.component";
import { NursingFormComponent } from "../components/nursing-form/nursing-form.component";

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
    SleepFormComponent,
    DiaperFormComponent,
    NursingFormComponent,
    IonModal,
    IonAccordionGroup,
    IonAccordion,
    IonRippleEffect,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class HistoryPage implements ViewWillEnter, ViewDidEnter {
  storageService = inject(StorageService);
  historyService = inject(HistoryService);
  private alertController = inject(AlertController);
  private router = inject(Router);
  babyService = inject(BabyService);
  date = signal(new Date());

  sleeps = signal<SleepInput[]>([]);
  diapers = signal<DiaperInput[]>([]);
  nursings = signal<NursingInput[]>([]);

  totalSleepDuration = computed(() => {
    const sleepsArray = this.sleeps();
    if (!sleepsArray || !Array.isArray(sleepsArray)) {
      return 0;
    }
    return sleepsArray.reduce((acc, sleep) => {
      if (!sleep.start || !sleep.end) {
        return acc;
      }
      return acc + this.calculateDurationInHours(sleep.start, sleep.end);
    }, 0);
  });
  private gestureCtrl = inject(GestureController);
  sleepModal = viewChild<IonModal>("sleepModal");
  diaperModal = viewChild<IonModal>("diaperModal");
  nursingModal = viewChild<IonModal>("nursingModal");
  sleepForm = viewChild<SleepFormComponent>("sleepForm");
  diaperForm = viewChild<DiaperFormComponent>("diaperForm");
  nursingForm = viewChild<NursingFormComponent>("nursingForm");

  @ViewChild("accordionGroup", { static: true })
  accordionGroup!: IonAccordionGroup;

  selectedSleep = signal<SleepInput | undefined>(undefined);
  selectedDiaper = signal<DiaperInput | undefined>(undefined);
  selectedNursing = signal<NursingInput | undefined>(undefined);

  constructor() {
    addIcons({
      arrowBackOutline,
      pencilOutline,
      trashOutline,
      addOutline,
      arrowForwardOutline,
    });
    effect(() => {
      this.date();
      this.ionViewWillEnter();
    });
  }

  async ionViewWillEnter() {
    if (this.babyService.activeBaby()) {
      console.log("active baby", this.babyService.activeBaby());

      const history = await this.historyService.getHistoryForBaby(
        this.babyService.activeBaby()!.id,
        this.date(),
      );
      this.sleeps.set(history.sleeps || []);
      this.diapers.set(history.diapers || []);
      this.nursings.set(history.nursings || []);
      console.log(history);
      const values = [];
      if (this.sleeps() && this.sleeps().length > 0) {
        values.push("sleep");
      }
      if (this.diapers() && this.diapers().length > 0) {
        values.push("diapers");
      }
      if (this.nursings() && this.nursings().length > 0) {
        values.push("nursings");
      }
      this.accordionGroup.value = values;
    }
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
    this.diapers.set(this.diapers().filter((d) => d.id !== diaper.id));
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
    this.sleeps.set(this.sleeps().filter((s) => s.id !== sleep.id));
  }

  async showDeleteNursingAlert(nursing: NursingInput) {
    const alert = await this.alertController.create({
      header: "Delete Nursing",
      message: "Are you sure you want to delete this nursing?",
      buttons: ["Cancel", {
        text: "Delete",
        handler: () => this.deleteNursing(nursing),
      }],
    });
    await alert.present();
  }

  async deleteNursing(nursing: NursingInput) {
    if (nursing.id) {
      await this.storageService.deleteNursing(nursing.id);
    }
    this.nursings.set(this.nursings().filter((n) => n.id !== nursing.id));
  }

  goToHome() {
    this.router.navigate(["/home"]);
  }

  ionViewDidEnter() {
    const headerRow = document.querySelector("ion-row");
    const content = document.querySelector("ion-content");
    if (!headerRow || !content) {
      console.error("Could not find required elements");
      return;
    }

    const gesture: Gesture = this.gestureCtrl.create({
      el: content,
      threshold: 15,
      gestureName: "swipe",
      gesturePriority: 100,
      direction: "x",
      onStart: () => {
        console.log("Gesture started");
      },
      onMove: (detail) => {
        console.log("Gesture moving:", detail.deltaX);
        const deltaX = detail.deltaX;
        if (Math.abs(detail.deltaY) > Math.abs(deltaX)) {
          return;
        }

        if (deltaX > 50) {
          this.animateAndChangePage("right", content);
          gesture.enable(false);
          setTimeout(() => gesture.enable(true), 500);
        } else if (deltaX < -50) {
          this.animateAndChangePage("left", content);
          gesture.enable(false);
          setTimeout(() => gesture.enable(true), 500);
        }
      },
    });

    gesture.enable(true);
  }

  private animateAndChangePage(direction: "left" | "right", content: Element) {
    // Add transition and fade-out classes
    content.classList.add("page-transition");
    content.classList.add("fade-out");

    setTimeout(() => {
      if (direction === "right") {
        this.previousDay();
      } else {
        this.nextDay();
      }

      content.classList.remove("fade-out");
      content.classList.add("fade-in");

      // Clean up ALL classes after animation completes
      setTimeout(() => {
        content.classList.remove("page-transition", "fade-in");
      }, 300);
    }, 150);
  }

  previousDay() {
    const newDate = new Date(this.date());
    newDate.setDate(newDate.getDate() - 1);
    this.date.set(newDate);
  }

  nextDay() {
    const newDate = new Date(this.date());
    newDate.setDate(newDate.getDate() + 1);
    this.date.set(newDate);
  }

  calculateDurationInHours(start: Date, end: Date) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate.getTime() - startDate.getTime();
    return Math.floor(duration / 60000) / 60;
  }

  editSleep(sleep: SleepInput) {
    this.selectedSleep.set(sleep);
    this.sleepForm()!.initializeForm(sleep);
    this.sleepModal()?.present();
  }

  editDiaper(diaper: DiaperInput) {
    this.selectedDiaper.set(diaper);
    this.diaperForm()!.initializeForm(diaper);
    this.diaperModal()?.present();
  }

  editNursing(nursing: NursingInput) {
    this.selectedNursing.set(nursing);
    this.nursingForm()!.initializeForm(nursing);
    this.nursingModal()?.present();
  }

  async onSleepEdit(sleep: SleepInput | undefined) {
    if (sleep) {
      const hours = sleep.start.getHours();
      const minutes = sleep.start.getMinutes();
      sleep.start = new Date(this.date());
      sleep.start.setHours(hours);
      sleep.start.setMinutes(minutes);
      const endHours = sleep.end.getHours();
      const endMinutes = sleep.end.getMinutes();
      sleep.end = new Date(this.date());
      sleep.end.setHours(endHours);
      sleep.end.setMinutes(endMinutes);
      sleep.id = this.selectedSleep()?.id;

      if (sleep.id) {
        await this.storageService.editSleep(sleep);
      } else {
        await this.storageService.addSleep(sleep);
      }
    }
    this.sleepModal()?.dismiss();
    this.selectedSleep.set(undefined);
    this.ionViewWillEnter();
  }

  async onDiaperEdit(diaper: DiaperInput | undefined) {
    if (diaper) {
      const hours = diaper.time.getHours();
      const minutes = diaper.time.getMinutes();
      diaper.time = new Date(this.date());
      diaper.time.setHours(hours);
      diaper.time.setMinutes(minutes);
      diaper.id = this.selectedDiaper()?.id;
      if (diaper.id) {
        await this.storageService.editDiaper(diaper);
      } else {
        await this.storageService.addDiaper(diaper);
      }
    }
    this.diaperModal()?.dismiss();
    this.selectedDiaper.set(undefined);
    this.ionViewWillEnter();
  }

  async onNursingEdit(nursing: NursingInput | undefined) {
    if (nursing) {
      const hours = nursing.time.getHours();
      const minutes = nursing.time.getMinutes();
      nursing.time = new Date(this.date());
      nursing.time.setHours(hours);
      nursing.time.setMinutes(minutes);
      nursing.id = this.selectedNursing()?.id;
      if (nursing.id) {
        await this.storageService.editNursing(nursing);
      } else {
        await this.storageService.addNursing(nursing);
      }
    }
    this.nursingModal()?.dismiss();
    this.selectedNursing.set(undefined);
    this.ionViewWillEnter();
  }

  async addNewSleep() {
    const form = this.sleepForm();
    if (!form) return;
    await form.reset();
    this.selectedSleep.set(undefined);
    await this.sleepModal()?.present();
  }

  async addNewDiaper() {
    const form = this.diaperForm();
    if (!form) return;
    await form.reset();
    this.selectedDiaper.set(undefined);
    await this.diaperModal()?.present();
  }

  async addNewNursing() {
    const form = this.nursingForm();
    if (!form) return;
    await form.reset();
    this.selectedNursing.set(undefined);
    await this.nursingModal()?.present();
  }

  async handleRefresh(event: any) {
    await this.ionViewWillEnter();
    //wait 1 second
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }
}
