import { Injectable } from "@angular/core";
import { Device } from "@capacitor/device";
import { CapacitorHttp } from "@capacitor/core";
import { environment } from "src/environments/environment";
import { Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { HeadersService } from "./headers.service";

interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
    };
}

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private isAuthenticated = new BehaviorSubject<boolean>(false);
    private baseUrl = environment.apiUrl.replace("/api", "");

    constructor(
        private router: Router,
        private headersService: HeadersService,
    ) {}

    private async validateToken(token: string): Promise<boolean> {
        try {
            const response = await CapacitorHttp.get({
                url: `${environment.apiUrl}/baby`,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            return response.status === 200;
        } catch (error) {
            console.error("Token validation failed:", error);
            return false;
        }
    }

    async checkAuthentication(): Promise<boolean> {
        const token = await this.headersService.getStoredToken();
        if (token) {
            // Validate token with backend
            const isValid = await this.validateToken(token);
            if (isValid) {
                this.isAuthenticated.next(true);
                return true;
            }
            // Token is invalid, remove it
            await this.headersService.removeToken();
        }

        // Try auto-login with device ID
        try {
            await this.autoLogin();
            return true;
        } catch (error) {
            console.error("Auto-login failed:", error);
            this.router.navigate(["/register"]);
            return false;
        }
    }

    private async autoLogin() {
        const deviceId = await Device.getId();
        const username = `user_${deviceId.identifier}`;
        const password = "changeme123";

        try {
            await this.login(username, password);
        } catch (error) {
            // If login fails, try to register
            await this.register(username, password);
        }
    }

    async login(username: string, password: string): Promise<void> {
        const response = await CapacitorHttp.post({
            url: `${this.baseUrl}/auth/login`,
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                username,
                password,
            },
        });

        if (response.status === 200) {
            const authResponse = response.data as AuthResponse;
            await this.headersService.setToken(authResponse.token);
            this.isAuthenticated.next(true);
        } else {
            throw new Error("Login failed");
        }
    }

    async register(username: string, password: string): Promise<void> {
        const response = await CapacitorHttp.post({
            url: `${this.baseUrl}/auth/register`,
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                username,
                password,
            },
        });

        if (response.status === 200) {
            const authResponse = response.data as AuthResponse;
            await this.headersService.setToken(authResponse.token);
            this.isAuthenticated.next(true);
        } else {
            throw new Error("Registration failed");
        }
    }

    async logout(): Promise<void> {
        await this.headersService.removeToken();
        this.isAuthenticated.next(false);
        this.router.navigate(["/login"]);
    }

    isAuthenticatedState() {
        return this.isAuthenticated.asObservable();
    }
}
