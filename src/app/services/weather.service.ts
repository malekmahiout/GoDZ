import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CurrentWeather {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  icon: string;
  labelFr: string;
  labelEn: string;
  labelAr: string;
  labelEs: string;
  labelDe: string;
}

export interface HourlyWeather {
  hour: string;
  temperature: number;
  weatherCode: number;
  icon: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather[];
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
}

const WMO: Record<number, { icon: string; fr: string; en: string; ar: string; es: string; de: string }> = {
  0:  { icon: '☀️',  fr: 'Ensoleillé',         en: 'Clear sky',        ar: 'مشمس',         es: 'Despejado',       de: 'Sonnig' },
  1:  { icon: '🌤️', fr: 'Peu nuageux',         en: 'Mainly clear',     ar: 'صافٍ غالباً',  es: 'Mayormente despejado', de: 'Überwiegend klar' },
  2:  { icon: '⛅',  fr: 'Partiellement nuageux', en: 'Partly cloudy',  ar: 'غيوم جزئية',   es: 'Parcialmente nublado', de: 'Teils bewölkt' },
  3:  { icon: '☁️',  fr: 'Nuageux',             en: 'Overcast',         ar: 'غائم',          es: 'Nublado',         de: 'Bewölkt' },
  45: { icon: '🌫️', fr: 'Brumeux',             en: 'Foggy',            ar: 'ضبابي',         es: 'Neblinoso',       de: 'Neblig' },
  48: { icon: '🌫️', fr: 'Brume givrante',      en: 'Freezing fog',     ar: 'ضباب متجمد',    es: 'Niebla helada',   de: 'Gefrierender Nebel' },
  51: { icon: '🌦️', fr: 'Bruine légère',       en: 'Light drizzle',    ar: 'رذاذ خفيف',     es: 'Llovizna ligera', de: 'Leichter Nieselregen' },
  53: { icon: '🌦️', fr: 'Bruine modérée',      en: 'Moderate drizzle', ar: 'رذاذ معتدل',    es: 'Llovizna moderada', de: 'Mäßiger Nieselregen' },
  55: { icon: '🌧️', fr: 'Bruine forte',        en: 'Heavy drizzle',    ar: 'رذاذ غزير',     es: 'Llovizna intensa', de: 'Starker Nieselregen' },
  61: { icon: '🌧️', fr: 'Pluie légère',        en: 'Light rain',       ar: 'مطر خفيف',      es: 'Lluvia ligera',   de: 'Leichter Regen' },
  63: { icon: '🌧️', fr: 'Pluie modérée',       en: 'Moderate rain',    ar: 'مطر معتدل',     es: 'Lluvia moderada', de: 'Mäßiger Regen' },
  65: { icon: '🌧️', fr: 'Forte pluie',         en: 'Heavy rain',       ar: 'أمطار غزيرة',   es: 'Lluvia intensa',  de: 'Starker Regen' },
  71: { icon: '🌨️', fr: 'Neige légère',        en: 'Light snow',       ar: 'ثلج خفيف',      es: 'Nieve ligera',    de: 'Leichter Schnee' },
  73: { icon: '🌨️', fr: 'Neige modérée',       en: 'Moderate snow',    ar: 'ثلج معتدل',     es: 'Nieve moderada',  de: 'Mäßiger Schnee' },
  75: { icon: '❄️',  fr: 'Neige forte',         en: 'Heavy snow',       ar: 'ثلوج كثيفة',   es: 'Nevada intensa',  de: 'Starker Schnee' },
  77: { icon: '❄️',  fr: 'Grains de neige',     en: 'Snow grains',      ar: 'حبيبات ثلج',   es: 'Granizo de nieve', de: 'Schneekörner' },
  80: { icon: '🌦️', fr: 'Averses légères',     en: 'Light showers',    ar: 'زخات خفيفة',   es: 'Aguaceros ligeros', de: 'Leichte Schauer' },
  81: { icon: '🌧️', fr: 'Averses modérées',    en: 'Moderate showers', ar: 'زخات معتدلة',   es: 'Aguaceros moderados', de: 'Mäßige Schauer' },
  82: { icon: '⛈️',  fr: 'Averses fortes',      en: 'Heavy showers',    ar: 'زخات غزيرة',   es: 'Aguaceros intensos', de: 'Starke Schauer' },
  85: { icon: '🌨️', fr: 'Averses de neige',    en: 'Snow showers',     ar: 'زخات ثلجية',   es: 'Aguaceros de nieve', de: 'Schneeschauer' },
  86: { icon: '❄️',  fr: 'Fortes averses neige', en: 'Heavy snow showers', ar: 'زخات ثلجية غزيرة', es: 'Aguaceros de nieve intensa', de: 'Starke Schneeschauer' },
  95: { icon: '⛈️',  fr: 'Orage',               en: 'Thunderstorm',     ar: 'عاصفة رعدية',  es: 'Tormenta',        de: 'Gewitter' },
  96: { icon: '⛈️',  fr: 'Orage avec grêle',    en: 'Storm with hail',  ar: 'عاصفة مع برد', es: 'Tormenta con granizo', de: 'Gewitter mit Hagel' },
  99: { icon: '⛈️',  fr: 'Forte tempête',       en: 'Heavy storm',      ar: 'عاصفة شديدة',  es: 'Tormenta fuerte', de: 'Starkes Gewitter' },
};

function getWmo(code: number) {
  return WMO[code] ?? WMO[3];
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private cache = new Map<string, { data: WeatherData; ts: number }>();
  private readonly TTL = 30 * 60 * 1000; // 30 min

  constructor(private http: HttpClient) {}

  getWeather(lat: number, lng: number): Observable<WeatherData> {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.ts < this.TTL) return of(cached.data);

    const url = `https://api.open-meteo.com/v1/forecast`
      + `?latitude=${lat}&longitude=${lng}`
      + `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m`
      + `&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto`;

    return this.http.get<OpenMeteoResponse>(url).pipe(
      map(res => this.parse(res)),
      catchError(() => of(this.fallback())),
      map(data => { this.cache.set(key, { data, ts: Date.now() }); return data; })
    );
  }

  private parse(res: OpenMeteoResponse): WeatherData {
    const c = res.current;
    const wmo = getWmo(c.weather_code);
    const now = new Date();

    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const hourly: HourlyWeather[] = res.hourly.time
      .map((t, i) => ({ t, temp: res.hourly.temperature_2m[i], code: res.hourly.weather_code[i] }))
      .filter(h => {
        const d = new Date(h.t);
        return d >= now && d < in24h;
      })
      .map(h => ({
        hour: new Date(h.t).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(h.temp),
        weatherCode: h.code,
        icon: getWmo(h.code).icon,
      }));

    return {
      current: {
        temperature: Math.round(c.temperature_2m),
        weatherCode: c.weather_code,
        windSpeed: Math.round(c.wind_speed_10m),
        humidity: c.relative_humidity_2m,
        icon: wmo.icon,
        labelFr: wmo.fr,
        labelEn: wmo.en,
        labelAr: wmo.ar,
        labelEs: wmo.es,
        labelDe: wmo.de,
      },
      hourly,
    };
  }

  private fallback(): WeatherData {
    return {
      current: { temperature: 25, weatherCode: 0, windSpeed: 10, humidity: 50,
        icon: '☀️', labelFr: 'Ensoleillé', labelEn: 'Clear sky', labelAr: 'مشمس', labelEs: 'Despejado', labelDe: 'Sonnig' },
      hourly: [],
    };
  }
}
