import { bubbleNotificationPlugin } from 'bubble-notification-plugin';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    bubbleNotificationPlugin.echo({ value: inputValue })
}
