import { Injectable } from "@angular/core";
import { Device } from "@capacitor/device";
import { Preferences } from "@capacitor/preferences";

@Injectable({
    providedIn: "root",
})
export class HeadersService {
    private JWT_TOKEN_KEY = "jwt_token";

    async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.getStoredToken();
        return {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    async getHeaders(): Promise<Record<string, string>> {
        const deviceID = await Device.getId();
        const authHeaders = await this.getAuthHeaders();
        return {
            ...authHeaders,
            "X-Parrent-User-ID": deviceID.identifier,
        };
    }

    async setToken(token: string): Promise<void> {
        await Preferences.set({
            key: this.JWT_TOKEN_KEY,
            value: token,
        });
    }

    async getStoredToken(): Promise<string | null> {
        const { value } = await Preferences.get({ key: this.JWT_TOKEN_KEY });
        return value;
    }

    async removeToken(): Promise<void> {
        await Preferences.remove({ key: this.JWT_TOKEN_KEY });
    }
}
