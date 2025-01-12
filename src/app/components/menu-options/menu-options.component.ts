import { Component, OnInit, output } from "@angular/core";
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";
import { RouterLink } from "@angular/router";
import { close } from "ionicons/icons";
import { addIcons } from "ionicons";

@Component({
  selector: "app-menu-options",
  templateUrl: "./menu-options.component.html",
  styleUrls: ["./menu-options.component.scss"],
  standalone: true,
  imports: [
    IonTitle,
    RouterLink,
    IonTitle,
    IonButton,
    IonIcon,
  ],
})
export class MenuOptionsComponent implements OnInit {
  close = output<void>();
  constructor() {
    addIcons({ close });
  }

  ngOnInit() {}
}
