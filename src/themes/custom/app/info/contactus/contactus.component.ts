import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ds-contactus',
  styleUrls: ['./contactus.component.scss'],
  // styleUrls: ['../../../../../app/info/contactus/contactus.component.scss'],
  templateUrl: './contactus.component.html',
  // templateUrl: '../../../../../app/info/contactus/contactus.component.html',
  standalone: true,
  // imports: [ContactusComponent]
})

/**
 * Component displaying the Contact info
 */
export class ContactusComponent implements OnInit, AfterViewInit, OnDestroy {

  private sub: Subscription;
  private intervals: ReturnType<typeof setInterval>[] = [];

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
  ) { }

  ngOnInit() {
    // The LibAnswers widget is browser-only: SSR has no document, and a
    // script tag in the SSR'd HTML would get added again during hydration
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Add LibAnswers script to inject contact form
    const script = this.renderer.createElement('script');
    script.src = `https://uoregon.libanswers.com/1.0/widgets/20077`;
    this.renderer.appendChild(document.head, script);
  }

  ngAfterViewInit(): void {
    // On the server, waitForElement's polling would throw (no document) and
    // never stop
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Add item information to additional details field if reporting an a11y issue
    this.sub = this.route.queryParamMap.subscribe((paramMap) => {
      const titleValue = paramMap.get('itemTitle');
      const urlValue = paramMap.get('itemURL');

      if (titleValue && urlValue){
        this.waitForElement('#pquestion_20077', (question) => {
          question.value =
            'Accessibility Issue ';
        });
        this.waitForElement('#pdetails_20077', (details) => {
          details.value =
            'Add more details about the accessibility issue that you would like to report:\n\n\n' +
            'Title: ' + titleValue + '\n' +
            'URL: ' + urlValue;
          details.style.height = "150px";
        });
      }
    });
  };

  ngOnDestroy(): void {
    // Stop polling if the user leaves before the widget renders
    this.sub?.unsubscribe();
    this.intervals.forEach((interval) => clearInterval(interval));
  }

  // Wait for the specified element to exist
  waitForElement(selector, callback) {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        callback(element);
      }
    }, 150);
    this.intervals.push(interval);
  }
}