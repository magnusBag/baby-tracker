import { Component, inject } from "@angular/core";
import { IonButton, IonContent } from "@ionic/angular/standalone";
import { CommonModule } from "@angular/common";
import { Preferences } from "@capacitor/preferences";
import { Router } from "@angular/router";
import { StorageService } from "../services/storage.service";

@Component({
  selector: "app-timer",
  template: `
    <ion-content class="ion-padding">
      <div class="container">
        <div class="timer-display">
          <h1>{{ formatTime(elapsedTime) }}.{{ formatMilliseconds(elapsedMilliseconds) }}</h1>
        </div>
        <div class="buttons">
          <ion-button 
            class="big-button" 
            fill="outline" 
            expand="block" 
            (click)="handlePauseReset()"
          >
            {{ isPaused ? 'Reset' : 'Pause' }}
          </ion-button>
          <ion-button class="big-button" expand="block" (click)="leaveTimer()">Stop</ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .timer-display {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .buttons {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2rem;
      padding: 2rem;
    }
    .big-button {
      height: 100px;
      font-size: 24px;
      --border-radius: 16px;
    }
    h1 {
      font-size: 4rem;
      font-weight: bold;
      color: var(--ion-color-primary);
    }
  `],
  standalone: true,
  imports: [IonContent, CommonModule, IonButton],
})
export class TimerPage {
  timerInterval: any;
  elapsedTime = 0;
  elapsedMilliseconds = 0;
  private startTime: number = 0;
  private pausedTime: number = 0;
  isPaused: boolean = false;
  private router = inject(Router);
  private storageService = inject(StorageService);

  ionViewWillEnter() {
    this.startTimer();
  }

  ionViewWillLeave() {
    this.stopTimer();
  }

  private startTimer() {
    if (!this.isPaused) {
      this.elapsedTime = 0;
      this.elapsedMilliseconds = 0;
    }
    this.startTime = Date.now() - (this.pausedTime || 0);

    this.timerInterval = setInterval(() => {
      const currentTime = Date.now();
      const diff = currentTime - this.startTime;

      this.elapsedTime = Math.floor(diff / 1000);
      this.elapsedMilliseconds = diff % 1000;
    }, 10);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${this.pad(hours)}:${this.pad(minutes)}:${
      this.pad(remainingSeconds)
    }`;
  }

  formatMilliseconds(ms: number): string {
    return Math.floor(ms / 10).toString().padStart(2, "0");
  }

  private pad(num: number): string {
    return num.toString().padStart(2, "0");
  }

  handlePauseReset() {
    if (!this.isPaused) {
      // First click - Pause the timer
      this.pauseTimer();
    } else {
      // Second click - Reset the timer
      this.resetTimer();
    }
  }

  private pauseTimer() {
    this.stopTimer();
    this.isPaused = true;
    this.pausedTime = (this.elapsedTime * 1000) + this.elapsedMilliseconds;
  }

  resetTimer() {
    this.stopTimer();
    this.isPaused = false;
    this.pausedTime = 0;
    this.startTimer();
  }

  leaveTimer() {
    this.storageService.saveLastTimer(new Date());
    this.router.navigate(["/home"]);
  }
}
