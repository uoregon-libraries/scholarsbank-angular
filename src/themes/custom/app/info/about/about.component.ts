import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AboutComponent as BaseComponent } from '../../../../../app/info/about/about.component';
import { AboutContentComponent } from '../../../../../app/info/about/about-content/about-content.component';

@Component({
  selector: 'ds-about',
  styleUrls: ['./about.component.scss'],
//   styleUrls: ['../../../../../app/info/about/about.component.scss'],
  templateUrl: './about.component.html',
//   templateUrl: '../../../../../app/info/about/about.component.html',
  standalone: true,
  imports: [AboutContentComponent, RouterLink],
})

/**
 * Component displaying the About info
 */
export class AboutComponent extends BaseComponent {
    title = "Scholars' Bank Overview";
}
