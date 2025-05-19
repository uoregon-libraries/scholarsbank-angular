import { Component } from '@angular/core';
import { ContactusContentComponent } from './contactus-content/contactus-content.component';


@Component({
  selector: 'ds-contactus',
  templateUrl: './contactus.component.html',
  styleUrls: ['./contactus.component.scss'],
  standalone: true,
  imports: [ContactusContentComponent],
})
/**
 * Component displaying the contactus Statement
 */
export class ContactusComponent {
}
