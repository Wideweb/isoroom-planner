import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent} from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class TimezoneInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const timezoneOffset = new Date().getTimezoneOffset();

        const modifiedReq = req.clone({
            setHeaders: {
                'Timezone-Offset': timezoneOffset.toString()
            }
        });

        return next.handle(modifiedReq);
    }
}