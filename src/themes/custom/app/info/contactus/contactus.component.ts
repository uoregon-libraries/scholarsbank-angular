import { Component, OnInit, Renderer2 } from '@angular/core';
// import { ContactusComponent as BaseComponent} from '../../../../../app/info/contactus/contactus.component';

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
export class ContactusComponent implements OnInit {

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    const script = this.renderer.createElement('script');
    script.src = `https://uoregon.libanswers.com/1.0/widgets/20077`;
    this.renderer.appendChild(document.head, script);
  }
}