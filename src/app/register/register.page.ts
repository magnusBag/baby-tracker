import { Component, inject } from "@angular/core";
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import { FormsModule } from "@angular/forms";
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
} from "@ionic/angular/standalone";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-register",
    template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ selectedSegment === 'register' ? 'Register' : 'Login' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-segment [(ngModel)]="selectedSegment" class="ion-margin-bottom">
        <ion-segment-button value="register">
          Register
        </ion-segment-button>
        <ion-segment-button value="login">
          Login
        </ion-segment-button>
      </ion-segment>

      <ion-card>
        <ion-card-content>
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Username</ion-label>
              <ion-input type="text" formControlName="username"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input type="password" formControlName="password"></ion-input>
            </ion-item>

            <ion-button expand="block" type="submit" [disabled]="!authForm.valid" class="ion-margin-top">
              {{ selectedSegment === 'register' ? 'Register' : 'Login' }}
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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
        IonSegment,
        IonSegmentButton,
        ReactiveFormsModule,
    ],
})
export class RegisterPage {
    private authService = inject(AuthService);
    private formBuilder = inject(FormBuilder);
    private router = inject(Router);

    selectedSegment = "register";
    authForm: FormGroup;

    constructor() {
        this.authForm = this.formBuilder.group({
            username: ["", [Validators.required, Validators.minLength(3)]],
            password: ["", [Validators.required, Validators.minLength(6)]],
        });
    }

    async onSubmit() {
        if (this.authForm.valid) {
            try {
                const { username, password } = this.authForm.value;

                if (this.selectedSegment === "register") {
                    await this.authService.register(username, password);
                } else {
                    await this.authService.login(username, password);
                }

                // After successful authentication, navigate to home
                this.router.navigate(["/"]);
            } catch (error) {
                console.error(
                    `${
                        this.selectedSegment === "register"
                            ? "Registration"
                            : "Login"
                    } failed:`,
                    error,
                );
                // Handle error (show toast or alert)
            }
        }
    }
}
