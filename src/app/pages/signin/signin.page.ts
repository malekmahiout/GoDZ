import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
  standalone: false
})
export class SigninPage {
  email = '';
  password = '';
  showPassword = false;

  constructor(private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(): void {
    this.router.navigate(['/tabs/home']);
  }
}
