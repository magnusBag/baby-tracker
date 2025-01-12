import { Directive, EventEmitter, HostListener, Output } from "@angular/core";

@Directive({
    selector: "[longPress]",
    standalone: true,
})
export class LongPressDirective {
    @Output()
    longPress = new EventEmitter();

    private pressTimeout: any;
    private longPressTime = 1000; // 1 second

    @HostListener("touchstart", ["$event"])
    @HostListener("mousedown", ["$event"])
    onPressStart(event: any) {
        this.pressTimeout = setTimeout(() => {
            this.longPress.emit(event);
        }, this.longPressTime);
    }

    @HostListener("touchend")
    @HostListener("mouseup")
    @HostListener("mouseleave")
    onPressEnd() {
        clearTimeout(this.pressTimeout);
    }
}
