import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import {throwError,  BehaviorSubject} from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';


export interface AuthResponseData {
        kind:string,
        idToken: string,
        email:string,
        refreshToken:string,
        expiresIn:string,
        localId:string,
        registered?: boolean
}

@Injectable({providedIn:'root'})
export class AuthService{

    user = new BehaviorSubject<User>(null);
    private tokenExpirationTimer: any;

    constructor(private http: HttpClient, private router:Router) {

    }

    signUp(email:string, password:string){
       return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyD9Rw5EaL5kIxdaK3eF67tiClMzCu0aTu0', {
            email:email,
            password:password,
            returnSecureToken:true
        }).pipe(catchError(this.handleError), tap(responseData => {
            this.handleAuthentication(responseData.email, responseData.localId,responseData.idToken, +responseData.expiresIn)
        }));
    }

    login(email:string, password:string) {
       return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD9Rw5EaL5kIxdaK3eF67tiClMzCu0aTu0', {
            email:email,
            password:password,
            returnSecureToken:true
       }).pipe(catchError(this.handleError), tap(responseData => {
           this.handleAuthentication(responseData.email, responseData.localId,responseData.idToken, +responseData.expiresIn)
       }));
    }

    autoLogin() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if(!userData)
         return ;
        
        const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate));

        if(loadedUser.token) {
            this.user.next(loadedUser);
            const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationDuration);
        }
    }

    logout(){
        this.user.next(null);
        this.router.navigate(['/auth']);
        localStorage.removeItem('userData');
        if(this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer = null;
    }

    autoLogout(expirationDuration: number) {
        this.tokenExpirationTimer = setTimeout(()=> {
            this.logout();
        }, expirationDuration)
    }

    private handleAuthentication(email:string, password:string, idToken:string, expiresIn: number) {
        const expirationDate = new Date(new Date().getTime() + (expiresIn) * 1000);
        const user = new User(email, password, idToken, expirationDate);
        this.user.next(user);
        this.autoLogout(expiresIn*1000);
        localStorage.setItem('userData', JSON.stringify(user));
    }

    private handleError(errorResponse: HttpErrorResponse) {
            let error = "An unknown Error";
            
            if(!errorResponse.error || !errorResponse.error.error) {
                return throwError(error);
            }

            switch(errorResponse.error.error.message) {
                case 'EMAIL_EXISTS':
                    error = 'This email already exists';
                    break;
                case 'EMAIL_NOT_FOUND':
                    error = 'This email doesnot exist';
                    break;
                case 'INVALID_PASSWORD':
                    error = 'This password is not correct';
                    break;
            }
            return throwError(error);
    }

}