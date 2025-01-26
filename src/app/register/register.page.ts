import { Component, inject } from "@angular/core";
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonTitle,
    IonToolbar,
} from "@ionic/angular/standalone";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";

@Component({
    selector: "app-register",
    template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Register</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Username</ion-label>
              <ion-input type="text" formControlName="username"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input type="password" formControlName="password"></ion-input>
            </ion-item>

            <ion-button expand="block" type="submit" [disabled]="!registerForm.valid" class="ion-margin-top">
              Register
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
    standalone: true,
    imports: [
        IonContent,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonItem,
        IonLabel,
        IonInput,
        IonButton,
        IonCard,
        IonCardContent,
        ReactiveFormsModule,
    ],
})
export class RegisterPage {
    private authService = inject(AuthService);
    private formBuilder = inject(FormBuilder);
    private router = inject(Router);

    registerForm: FormGroup;

    constructor() {
        this.registerForm = this.formBuilder.group({
            username: ["", [Validators.required, Validators.minLength(3)]],
            password: ["", [Validators.required, Validators.minLength(6)]],
        });
    }

    async onSubmit() {
        if (this.registerForm.valid) {
            try {
                const { username, password } = this.registerForm.value;
                await this.authService.register(username, password);
                // After successful registration, navigate to home
                this.router.navigate(["/"]);
            } catch (error) {
                console.error("Registration failed:", error);
                // Handle error (show toast or alert)
            }
        }
    }
}
