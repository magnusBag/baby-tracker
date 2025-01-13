import { Component, inject } from "@angular/core";
import { BabyService } from "../services/baby.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular/standalone";
import { IonSpinner } from "@ionic/angular/standalone";

@Component({
    selector: "app-baby-add-parent",
    template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%">
      <ion-spinner></ion-spinner>
      <p>Adding baby...</p>
    </div>
  `,
    imports: [IonSpinner],
})
export class BabyAddParentPage implements ViewWillEnter {
    babyService = inject(BabyService);
    route = inject(ActivatedRoute);
    babyId = this.route.snapshot.params["id"];
    router = inject(Router);

    async ionViewWillEnter() {
        await this.babyService.addBabyById(this.babyId);
        await this.babyService.refresh();
        await this.router.navigate(["/settings"]);
    }
}
