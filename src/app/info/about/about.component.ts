import { Component } from '@angular/core';

import { AboutContentComponent } from './about-content/about-content.component';

@Component({
  selector: 'ds-base-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [AboutContentComponent],
})
/**
 * Component displaying the About Page
 */
export class AboutComponent {
}
