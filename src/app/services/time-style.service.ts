import { effect, Injectable, signal } from "@angular/core";
import { Preferences } from "@capacitor/preferences";
@Injectable({
  providedIn: 'root'
})
export class TimeStyleService {
    public timeStyle = signal<"native" | "number">("native");

  constructor() { 
    effect(() => {
        Preferences.set({
            key: "timeStyle",
            value: this.timeStyle()
        })
    })
    Preferences.get({
        key: "timeStyle"
    }).then(({value}) => {
        if (value) {
            this.timeStyle.set(value as "native" | "number");
        }
    })
  }
}
