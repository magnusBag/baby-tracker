import { Component, inject } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { InitService } from "./services/init.service";

@Component({
  selector: "app-root",
  template: `
        <ion-app>
            <ion-router-outlet></ion-router-outlet>
        </ion-app>
    `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private initService = inject(InitService);

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.initService.initialize();
  }
}
