import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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
export class ContactusComponent implements OnInit, AfterViewInit {

  constructor(private renderer: Renderer2, private route: ActivatedRoute) { }

  ngOnInit() {
    // Add LibAnswers script to inject contact form
    const script = this.renderer.createElement('script');
    script.src = `https://uoregon.libanswers.com/1.0/widgets/20077`;
    this.renderer.appendChild(document.head, script);
  }

  ngAfterViewInit(): void {
    // Add item information to additional details field if reporting an a11y issue
    this.route.queryParamMap.subscribe((paramMap) => {
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

  // Wait for the specified element to exist
  waitForElement(selector, callback) {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        callback(element);
      }
    }, 150);
  }
}