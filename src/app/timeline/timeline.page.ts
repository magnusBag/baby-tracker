import { Component, computed, effect, inject, signal, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  AlertController,
  GestureController,
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
  IonMenu,
  IonButtons,
  IonMenuButton,
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
  bedOutline,
  waterOutline,
  restaurantOutline, homeOutline } from "ionicons/icons";
import { ActivatedRoute, Router } from "@angular/router";
import { addIcons } from "ionicons";
import { BabyService } from "../services/baby.service";
import { HistoryService } from "../services/history.service";
import { SleepFormComponent } from "../components/sleep-form/sleep-form.component";
import { DiaperFormComponent } from "../components/diaper-form/diaper-form.component";
import { NursingFormComponent } from "../components/nursing-form/nursing-form.component";
import { DarkModeService } from "../services/dark-mode.service";
import { MenuOptionsComponent } from "../components/menu-options/menu-options.component";

interface TimelineItem {
  type: 'sleep' | 'diaper' | 'nursing';
  time: Date;
  data: SleepInput | DiaperInput | NursingInput;
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.page.html',
  styleUrls: ['./timeline.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonRow,
    IonModal,
    IonRippleEffect,
    IonRefresher,
    IonRefresherContent,
    SleepFormComponent,
    DiaperFormComponent,
    NursingFormComponent,
  ],
})
export class TimelinePage implements ViewWillEnter, ViewDidEnter {
  storageService = inject(StorageService);
  historyService = inject(HistoryService);
  private alertController = inject(AlertController);
  private router = inject(Router);
  babyService = inject(BabyService);
  private gestureCtrl = inject(GestureController);
  darkModeService = inject(DarkModeService);
  private route = inject(ActivatedRoute);


  isHomePage = signal(false);

  date = signal(this.makeDate());
  timelineItems = signal<TimelineItem[]>([]);
  filterToggle = signal<'sleep' | 'diaper' | 'nursing' | undefined>(undefined);
  @ViewChild('sleepModal') sleepModal!: IonModal;
  @ViewChild('diaperModal') diaperModal!: IonModal;
  @ViewChild('nursingModal') nursingModal!: IonModal;
  @ViewChild('sleepForm') sleepForm!: SleepFormComponent;
  @ViewChild('diaperForm') diaperForm!: DiaperFormComponent;
  @ViewChild('nursingForm') nursingForm!: NursingFormComponent;

  selectedSleep = signal<SleepInput | undefined>(undefined);
  selectedDiaper = signal<DiaperInput | undefined>(undefined);
  selectedNursing = signal<NursingInput | undefined>(undefined);

  totalSleepDuration = computed(() => {
    const items = this.timelineItems();
    const sleepItems = items.filter(item => item.type === 'sleep');
    return sleepItems.reduce((acc, item) => {
      const sleep = item.data as SleepInput;
      if (!sleep.start || !sleep.end) {
        return acc;
      }
      return acc + this.calculateDurationInHours(sleep.start, sleep.end);
    }, 0);
  });

  totalDiapers = computed(() => {
    const items = this.timelineItems();
    return items.filter(item => item.type === 'diaper').length;
  });

  totalNursings = computed(() => {
    const items = this.timelineItems();
    return items.filter(item => item.type === 'nursing').length;
  });

  constructor() {
    addIcons({arrowBackOutline,trashOutline,arrowForwardOutline,homeOutline,pencilOutline,addOutline,bedOutline,waterOutline,restaurantOutline});
    effect(() => {
      this.date();
      this.ionViewWillEnter();
    });
  }
  toggleFilter(filter: 'sleep' | 'diaper' | 'nursing') {
    if (this.filterToggle() === filter) {
      this.filterToggle.set(undefined);
    } else {
      this.filterToggle.set(filter);
    }
  }
  makeDate() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }

  async ionViewWillEnter() {
    console.log(this.route.snapshot.queryParams);
    
    if (this.route.snapshot.queryParams['isHomePage'] === 'true') {
      this.isHomePage.set(true);
    }
    if (this.babyService.activeBaby()) {
      const history = await this.historyService.getHistoryForBaby(
        this.babyService.activeBaby()!.id,
        this.date()
      );

      const timelineItems: TimelineItem[] = [
        ...(history.sleeps || []).map((sleep: SleepInput) => {
          const start = new Date(sleep.start);
          const end = new Date(sleep.end);
          return {
            type: 'sleep' as const,
            time: start,
            data: { ...sleep, start, end }
          };
        }),
        ...(history.diapers || []).map((diaper: DiaperInput) => {
          const time = new Date(diaper.time);
          return {
            type: 'diaper' as const,
            time,
            data: { ...diaper, time }
          };
        }),
        ...(history.nursings || []).map((nursing: NursingInput) => {
          const time = new Date(nursing.time);
          return {
            type: 'nursing' as const,
            time,
            data: { ...nursing, time }
          };
        })
      ].sort((a, b) => a.time.getTime() - b.time.getTime());

      this.timelineItems.set(timelineItems);
    }
  }

  ionViewDidEnter() {
    const content = document.querySelector('ion-content');
    if (!content) return;

    const gesture = this.gestureCtrl.create({
      el: content,
      threshold: 15,
      gestureName: 'swipe',
      gesturePriority: 100,
      direction: 'x',
      onMove: (detail) => {
        if (Math.abs(detail.deltaY) > Math.abs(detail.deltaX)) return;
        if (detail.deltaX > 50) {
          this.animateAndChangePage('right', content);
          gesture.enable(false);
          setTimeout(() => gesture.enable(true), 500);
        } else if (detail.deltaX < -50) {
          this.animateAndChangePage('left', content);
          gesture.enable(false);
          setTimeout(() => gesture.enable(true), 500);
        }
      }
    });
    gesture.enable();
  }

  private animateAndChangePage(direction: 'left' | 'right', content: Element) {
    content.classList.add('animate-page');
    content.classList.add(`slide-${direction}`);
    setTimeout(() => {
      if (direction === 'left') {
        this.nextDay();
      } else {
        this.previousDay();
      }
      content.classList.remove('animate-page', `slide-${direction}`);
    }, 250);
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
    const diff = end.getTime() - start.getTime();
    return diff / (1000 * 60 * 60);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  async handleRefresh(event: any) {
    await this.ionViewWillEnter();
    event.target.complete();
  }

  getItemTime(item: TimelineItem): string {
    if (item.type === 'sleep') {
      const sleep = item.data as SleepInput;
      return `${this.formatTime(sleep.start)} - ${this.formatTime(sleep.end)}`;
    }
    return this.formatTime(item.time);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  getItemDescription(item: TimelineItem): string {
    switch (item.type) {
      case 'sleep':
        const sleep = item.data as SleepInput;
        return `Sleep (${this.calculateDurationInHours(sleep.start, sleep.end).toFixed(1)} hours)`;
      case 'diaper':
        const diaper = item.data as DiaperInput;
        return `Diaper (${diaper.type})`;
      case 'nursing':
        const nursing = item.data as NursingInput;
        return `Nursing (${nursing.type})`;
    }
  }

  isOngoingSleep(item: TimelineItem): boolean {
    if (item.type !== 'sleep') return false;
    const sleep = item.data as SleepInput;
    // dates should be within the same minute
    const start = new Date(sleep.start);
    const end = new Date(sleep.end);
    const diff = end.getTime() - start.getTime();
    return diff < 60000;
  }

  roundToNearestFiveMinutes(date: Date): Date {
    const minutes = date.getMinutes();
    const remainder = minutes % 5;
    const roundedMinutes = remainder >= 2.5 ? minutes + (5 - remainder) : minutes - remainder;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  }

  async quickEndSleep(item: TimelineItem, event: Event) {
    if (item.type !== 'sleep') return;
    event.stopPropagation(); // Prevent opening the edit modal
    
    const sleep = item.data as SleepInput;
    const endTime = this.roundToNearestFiveMinutes(new Date());
    
    const updatedSleep: SleepInput = {
      ...sleep,
      end: endTime
    };
    
    await this.storageService.editSleep(updatedSleep);
    await this.ionViewWillEnter();
  }

  editItem(item: TimelineItem) {
    switch (item.type) {
      case 'sleep':
        this.editSleep(item.data as SleepInput);
        break;
      case 'diaper':
        this.editDiaper(item.data as DiaperInput);
        break;
      case 'nursing':
        this.editNursing(item.data as NursingInput);
        break;
    }
  }

  async deleteItem(item: TimelineItem) {
    switch (item.type) {
      case 'sleep':
        await this.showDeleteSleepAlert(item.data as SleepInput);
        break;
      case 'diaper':
        await this.showDeleteDiaperAlert(item.data as DiaperInput);
        break;
      case 'nursing':
        await this.showDeleteNursingAlert(item.data as NursingInput);
        break;
    }
  }

  // Sleep methods
  editSleep(sleep: SleepInput) {
    this.selectedSleep.set(sleep);
    this.sleepModal.present();
    setTimeout(() => {
      this.sleepForm.initializeForm(sleep);
    }, 100);
  }

  async showDeleteSleepAlert(sleep: SleepInput) {
    const alert = await this.alertController.create({
      header: 'Delete Sleep',
      message: 'Are you sure you want to delete this sleep?',
      buttons: [
        'Cancel',
        { text: 'Delete', handler: () => this.deleteSleep(sleep) },
      ],
    });
    await alert.present();
  }

  async deleteSleep(sleep: SleepInput) {
    if (sleep.id) {
      await this.storageService.deleteSleep(sleep.id);
      await this.ionViewWillEnter();
    }
  }

  // Diaper methods
  editDiaper(diaper: DiaperInput) {
    this.selectedDiaper.set(diaper);
    this.diaperModal.present();
    setTimeout(() => {
      this.diaperForm.initializeForm(diaper);
    }, 100);
  }

  async showDeleteDiaperAlert(diaper: DiaperInput) {
    const alert = await this.alertController.create({
      header: 'Delete Diaper',
      message: 'Are you sure you want to delete this diaper?',
      buttons: [
        'Cancel',
        { text: 'Delete', handler: () => this.deleteDiaper(diaper) },
      ],
    });
    await alert.present();
  }

  async deleteDiaper(diaper: DiaperInput) {
    if (diaper.id) {
      await this.storageService.deleteDiaper(diaper.id);
      await this.ionViewWillEnter();
    }
  }

  // Nursing methods
  editNursing(nursing: NursingInput) {
    this.selectedNursing.set(nursing);
    this.nursingModal.present();
    setTimeout(() => {
      this.nursingForm.initializeForm(nursing);
    }, 100);
  }

  async showDeleteNursingAlert(nursing: NursingInput) {
    const alert = await this.alertController.create({
      header: 'Delete Nursing',
      message: 'Are you sure you want to delete this nursing?',
      buttons: [
        'Cancel',
        { text: 'Delete', handler: () => this.deleteNursing(nursing) },
      ],
    });
    await alert.present();
  }

  async deleteNursing(nursing: NursingInput) {
    if (nursing.id) {
      await this.storageService.deleteNursing(nursing.id);
      await this.ionViewWillEnter();
    }
  }

  async onSleepEdit(sleep: SleepInput | undefined) {
    this.sleepModal.dismiss();
    if (!sleep) return;
  
    sleep.id ? 
    await this.storageService.editSleep(sleep) 
    : await this.storageService.addSleep(sleep);

    await this.ionViewWillEnter();  
  }

  async onDiaperEdit(diaper: DiaperInput | undefined) {
    this.diaperModal.dismiss();
    if (!diaper) return;

    diaper.id ? 
    await this.storageService.editDiaper(diaper) 
    : await this.storageService.addDiaper(diaper);

    await this.ionViewWillEnter();  

    this.diaperModal.dismiss();
  }

  async onNursingEdit(nursing: NursingInput | undefined) {
    this.nursingModal.dismiss();
    if (!nursing) return;

    nursing.id ? 
    await this.storageService.editNursing(nursing) 
    : await this.storageService.addNursing(nursing);

    await this.ionViewWillEnter();  

    this.nursingModal.dismiss();
  }

  async addNewSleep() {
    this.selectedSleep.set(undefined);
    this.sleepForm.reset();
    this.sleepModal.present();
  }

  async addNewDiaper() {
    this.selectedDiaper.set(undefined);
    this.diaperForm.reset();
    this.diaperModal.present();
  }

  async addNewNursing() {
    this.selectedNursing.set(undefined);
    this.nursingForm.reset();
    this.nursingModal.present();
  }
}
