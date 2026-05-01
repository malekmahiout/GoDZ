import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface UserPosition {
  latitude: number;
  longitude: number;
}

const DEFAULT_POS: UserPosition = { latitude: 36.7538, longitude: 3.0588 }; // Alger

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  async getCurrentPosition(): Promise<UserPosition> {
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted') {
          return DEFAULT_POS;
        }
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } else {
        return this.getBrowserPosition();
      }
    } catch {
      return DEFAULT_POS;
    }
  }

  private getBrowserPosition(): Promise<UserPosition> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(DEFAULT_POS);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(DEFAULT_POS),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  async checkPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.checkPermissions();
      return perm.location === 'granted';
    }
    return 'geolocation' in navigator;
  }

  async requestPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.requestPermissions();
      return perm.location === 'granted';
    }
    return 'geolocation' in navigator;
  }
}
