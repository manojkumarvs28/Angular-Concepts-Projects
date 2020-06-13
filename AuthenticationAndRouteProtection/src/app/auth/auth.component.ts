import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService, AuthResponseData } from './auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector:'app-auth',
    templateUrl:'./auth.component.html',
})
export class AuthComponent {
   isLoginmode = true;
   isLoading= false;
   error:string = null;

   constructor(private authService: AuthService, private router:Router){}

   onSwitchMode(){
       this.isLoginmode =!this.isLoginmode;
   }

   onSubmit(form:NgForm) {
        if(!form.valid)
         return;
        const email = form.value.email;
        const password = form.value.password;
        let authObs:Observable<AuthResponseData>; 
        this.isLoading = true;
        if(this.isLoginmode){
            authObs=this.authService.login(email,password);
        } else {
            authObs = this.authService.signUp(email,password)
        }

        authObs.subscribe(authResponseData => {
            this.isLoading = false;
            this.router.navigate(['/recipes']);
        },errorMessage => {
            this.isLoading = false;
            this.error = errorMessage;
        })
        
       form.reset()
   }


}