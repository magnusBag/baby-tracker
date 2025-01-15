import {
    Component,
    ElementRef,
    inject,
    output,
    signal,
    viewChild,
} from "@angular/core";
import { NursingAmount, NursingInput, NursingType } from "../models";
import {
    IonButton,
    IonDatetime,
    IonDatetimeButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonSegment,
    IonSegmentButton,
    IonTextarea,
} from "@ionic/angular/standalone";
import { StorageService } from "src/app/services/storage.service";
import { addTimezoneOffset, now } from "../util";
import {
    addCircleOutline,
    ellipse,
    removeCircleOutline,
    syncCircleOutline,
    water,
    waterOutline,
} from "ionicons/icons";
import { BabiesListComponent } from "../babies-list/babies-list.component";
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";

@Component({
    selector: "app-nursing-form",
    imports: [
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonSegment,
        IonSegmentButton,
        IonButton,
        IonTextarea,
        IonInput,
        IonModal,
        IonDatetime,
        BabiesListComponent,
    ],
    template: `
    <form [formGroup]="form" class="ion-padding">
        <ion-item>
            <ion-label>Nursing Time</ion-label>
            <ion-input
                type="tel"
                inputmode="numeric"
                formControlName="time"
                (ionInput)="formatTime($event)"
                (ionFocus)="clearTime()"
                placeholder="HH:mm"
                maxlength="5"
            ></ion-input>
        </ion-item>

        <ion-segment formControlName="type" class="ion-padding-top">
            <ion-segment-button value="left">
                <div class="dot half"></div>
                <ion-label>Left</ion-label>
            </ion-segment-button>
            <ion-segment-button value="right">
                <div class="dot half"></div>
                <ion-label>Right</ion-label>
            </ion-segment-button>
            <ion-segment-button value="both">
                <div class="dot full"></div>
                <ion-label>Both</ion-label>
            </ion-segment-button>
        </ion-segment>

        <ion-segment formControlName="amount" class="ion-padding-top">
            <ion-segment-button value="a little">
            <svg class="droplet empty" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 100 100">
                    <path d="M49.015,0.803
                    c-0.133-1.071-1.896-1.071-2.029,0
                    C42.57,36.344,20,43.666,20,68.367   
                    C20,83.627,32.816,96,48,96
                    s28-12.373,28-27.633
                    C76,43.666,53.43,36.344,49.015,0.803z 
                    M44.751,40.09   
                    c-0.297,1.095-0.615,2.223-0.942,3.386
                    c-2.007,7.123-4.281,15.195-4.281,24.537
                    c0,5.055-2.988,6.854-5.784,6.854   
                    c-3.189,0-5.782-2.616-5.782-5.831
                    c0-11.034,5.315-18.243,10.005-24.604
                    c1.469-1.991,2.855-3.873,3.983-5.749   
                    c0.516-0.856,1.903-0.82,2.533,0.029
                    C44.781,39.116,44.879,39.619,44.751,40.09z"/>
                </svg>
                <ion-label>A little</ion-label>
            </ion-segment-button>
            <ion-segment-button value="medium">
            <svg class="droplet half" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 100 100">
                    <path d="M49.015,0.803
                    c-0.133-1.071-1.896-1.071-2.029,0
                    C42.57,36.344,20,43.666,20,68.367   
                    C20,83.627,32.816,96,48,96
                    s28-12.373,28-27.633
                    C76,43.666,53.43,36.344,49.015,0.803z 
                    M44.751,40.09   
                    c-0.297,1.095-0.615,2.223-0.942,3.386
                    c-2.007,7.123-4.281,15.195-4.281,24.537
                    c0,5.055-2.988,6.854-5.784,6.854   
                    c-3.189,0-5.782-2.616-5.782-5.831
                    c0-11.034,5.315-18.243,10.005-24.604
                    c1.469-1.991,2.855-3.873,3.983-5.749   
                    c0.516-0.856,1.903-0.82,2.533,0.029
                    C44.781,39.116,44.879,39.619,44.751,40.09z"/>
                </svg>
                <ion-label>Medium</ion-label>
            </ion-segment-button>
            <ion-segment-button value="a lot">
            <svg class="droplet full"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 100 100">
                    <path d="M49.015,0.803
                    c-0.133-1.071-1.896-1.071-2.029,0
                    C42.57,36.344,20,43.666,20,68.367   
                    C20,83.627,32.816,96,48,96
                    s28-12.373,28-27.633
                    C76,43.666,53.43,36.344,49.015,0.803z 
                    M44.751,40.09   
                    c-0.297,1.095-0.615,2.223-0.942,3.386
                    c-2.007,7.123-4.281,15.195-4.281,24.537
                    c0,5.055-2.988,6.854-5.784,6.854   
                    c-3.189,0-5.782-2.616-5.782-5.831
                    c0-11.034,5.315-18.243,10.005-24.604
                    c1.469-1.991,2.855-3.873,3.983-5.749   
                    c0.516-0.856,1.903-0.82,2.533,0.029
                    C44.781,39.116,44.879,39.619,44.751,40.09z"/>
                </svg>
                <ion-label>A lot</ion-label>
            </ion-segment-button>
        </ion-segment>

        <ion-textarea 
            fill="outline" 
            (ionInput)="onNoteChange($event)" 
            placeholder="Note"
        ></ion-textarea>

        <div class="button-container" style="margin-top: 1rem;">
            <ion-button class="form-button" (click)="saveNursing()">Save Nursing</ion-button>
            <ion-button class="form-button" (click)="cancelNursing()">Cancel</ion-button>
        </div>
        <app-babies-list></app-babies-list>
    </form>

    <ion-modal [keepContentsMounted]="true">
    <ng-template>
      <ion-datetime
        id="nursing-time"
        locale="da-DK"
        [value]="time().toISOString()"
        (ionChange)="onNursingTimeChange($event)"
      ></ion-datetime>
    </ng-template>
  </ion-modal>
    `,
    standalone: true,
    styles: [`
        .dot {
            border-radius: 50%;
        }
        svg {
            width: 20px;
            height: 20px;
        }
        .droplet.full path {
            fill: var(--ion-color-primary);
            stroke: var(--ion-color-primary);
            stroke-width: 0;
        }
        .droplet.half path {
            fill: var(--ion-color-primary);
            fill-opacity: 0.7;
        }
        .droplet.empty path {
            fill: var(--ion-color-primary);
            fill-opacity: 0.2;
        }
        ion-input {
            width: 80px;
            --padding-start: 8px;
            --padding-end: 8px;
        }
    `],
})
export class NursingFormComponent {
    // Icon properties
    protected readonly removeCircleOutline = removeCircleOutline;
    protected readonly addCircleOutline = addCircleOutline;
    protected readonly syncCircleOutline = syncCircleOutline;
    protected readonly ellipse = ellipse;
    protected readonly waterOutline = waterOutline;
    protected readonly water = water;

    babiesList = viewChild(BabiesListComponent);
    nursing = signal<NursingInput>({
        type: "both",
        amount: "medium",
        time: now(),
    });
    time = signal<Date>(now());
    nursingOutput = output<NursingInput | undefined>();
    id = signal<string | undefined>(undefined);
    reset() {
        this.babiesList()?.refresh();
        this.nursing.set({
            type: "both",
            amount: "medium",
            time: now(),
        });
        this.time.set(now());
        this.id.set(undefined);
        this.form.patchValue({
            time: now().toISOString().slice(11, 16),
            type: "both",
            amount: "medium",
            note: "",
        });
    }

    onTypeChange(event: any) {
        const type = event.detail.value;
        this.nursing.update((nursing) => ({
            ...nursing,
            type,
        }));
    }

    onAmountChange(event: any) {
        const amount = event.detail.value;
        this.nursing.update((nursing) => ({
            ...nursing,
            amount,
        }));
    }

    onNursingTimeChange(event: any) {
        const date = new Date(event.detail.value);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        this.time.set(date);
    }

    saveNursing() {
        if (this.form.valid) {
            const now = new Date();
            const [hours, minutes] = this.form.value.time!.split(":").map(
                Number,
            );

            now.setHours(hours);
            now.setMinutes(minutes);

            this.nursingOutput.emit({
                type: this.form.value.type!,
                amount: this.form.value.amount as NursingAmount,
                time: now,
                note: this.form.value.note || undefined,
                babyId: this.babiesList()?.choosenBaby()?.id,
                id: this.id(),
            });
        }
    }

    cancelNursing() {
        this.nursingOutput.emit(undefined);
    }

    initializeForm(nursing: NursingInput) {
        const nursingTime = new Date(nursing.time);
        this.form.patchValue({
            time: `${nursingTime.getHours().toString().padStart(2, "0")}:${
                nursingTime.getMinutes().toString().padStart(2, "0")
            }`,
            type: nursing.type as NursingType,
            amount: nursing.amount,
            note: nursing.note,
        });
        this.id.set(nursing.id);
    }

    formatTime(event: any) {
        let value = event.detail.value.replace(/\D/g, ""); // Remove non-digits

        if (value.length > 4) {
            value = value.slice(0, 4);
        }

        if (value.length >= 2) {
            const hours = parseInt(value.slice(0, 2));
            if (hours > 23) {
                value = "23" + value.slice(2);
            }
        }

        if (value.length >= 4) {
            const minutes = parseInt(value.slice(2, 4));
            if (minutes > 59) {
                value = value.slice(0, 2) + "59";
            }
        }

        if (value.length >= 3) {
            value = value.slice(0, 2) + ":" + value.slice(2);
        }

        this.form.get("time")?.setValue(value, { emitEvent: false });
    }

    clearTime() {
        this.form.get("time")?.setValue("", { emitEvent: false });
    }

    form = new FormGroup({
        type: new FormControl<NursingType>("both"),
        amount: new FormControl("medium"),
        time: new FormControl("", [
            Validators.required,
            Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        ]),
        note: new FormControl(""),
    });

    onNoteChange(event: any) {
        this.form.get("note")?.setValue(event.detail.value);
    }
}
