import { Component, inject, OnInit, signal } from "@angular/core";
import { BabyService } from "src/app/services/baby.service";
import { Baby } from "../models";
import { IonButton, IonTitle } from "@ionic/angular/standalone";

@Component({
    selector: "app-babies-list",
    template: `
    @if (babyService.babies().length > 1) {
   <ion-title class="ion-padding-top">Babies</ion-title>
      <div class="babies button-container ion-padding">
          @for (baby of babyService.babies(); track baby.id) {
              <ion-button [fill]="baby.id === choosenBaby()?.id ? 'solid' : 'outline'" (click)="choosenBaby.set(baby)">{{ baby.name }}</ion-button>
          }
      </div>
    }
  `,
    standalone: true,
    imports: [IonButton, IonTitle],
})
export class BabiesListComponent implements OnInit {
    babyService = inject(BabyService);
    choosenBaby = signal<Baby | undefined>(undefined);

    ngOnInit() {
        this.choosenBaby.set(this.babyService.activeBaby()!);
    }

    refresh() {
        this.babyService.refresh();
        this.choosenBaby.set(this.babyService.activeBaby()!);
    }
}
