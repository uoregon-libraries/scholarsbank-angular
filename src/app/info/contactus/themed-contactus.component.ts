import { Component } from '@angular/core';
import { ThemedComponent } from '../../shared/theme-support/themed.component';
import { ContactusComponent } from './contactus.component';

/**
 * Themed wrapper for ContactusComponent
 */
@Component({
  selector: 'ds-themed-contactus',
  styleUrls: [],
  templateUrl: '../../shared/theme-support/themed.component.html',
  standalone: true,
  imports: [ContactusComponent],
})
export class ThemedContactusComponent extends ThemedComponent<ContactusComponent> {
  protected getComponentName(): string {
    return 'ContactusComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../../themes/${themeName}/app/info/contactus/contactus.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import(`./contactus.component`);
  }

}
