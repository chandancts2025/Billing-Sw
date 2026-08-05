import { NgModule } from '@angular/core';
import { ForgotPasswordComponent } from './forgot-password.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { ShopSetupComponent } from './shop-setup.component';

@NgModule({
  imports: [LoginComponent, RegisterComponent, ForgotPasswordComponent, ShopSetupComponent],
  exports: [LoginComponent, RegisterComponent, ForgotPasswordComponent, ShopSetupComponent]
})
export class AuthModule {}
