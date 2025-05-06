import {
  AsyncPipe,
  NgClass,
  NgComponentOutlet,
  NgFor,
  NgIf,
} from '@angular/common';
import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ThemedUserMenuComponent } from 'src/app/shared/auth-nav-menu/user-menu/themed-user-menu.component';
import { ThemedLangSwitchComponent } from 'src/app/shared/lang-switch/themed-lang-switch.component';

import { NavbarComponent as BaseComponent } from '../../../../app/navbar/navbar.component';
import { ContextHelpToggleComponent } from '../../../../app/header/context-help-toggle/context-help-toggle.component';
import { ThemedSearchNavbarComponent } from '../../../../app/search-navbar/themed-search-navbar.component';
import { ThemedAuthNavMenuComponent } from '../../../../app/shared/auth-nav-menu/themed-auth-nav-menu.component';
import { ImpersonateNavbarComponent } from '../../../../app/shared/impersonate-navbar/impersonate-navbar.component';
import { ThemedNavbarComponent } from '../../../../app/navbar/themed-navbar.component';

import { slideMobileNav } from '../../../../app/shared/animations/slide';

/**
 * Component representing the public navbar
 */
@Component({
  selector: 'ds-themed-navbar',
  styleUrls: ['./navbar.component.scss'],
  // styleUrls: ['../../../../app/navbar/navbar.component.scss'],
  templateUrl: './navbar.component.html',
  // templateUrl: '../../../../app/navbar/navbar.component.html',
  animations: [slideMobileNav],
  standalone: true,
  imports: [NgbDropdownModule, NgClass, NgIf, ThemedUserMenuComponent, ThemedLangSwitchComponent, ContextHelpToggleComponent, ThemedSearchNavbarComponent, ThemedAuthNavMenuComponent, ImpersonateNavbarComponent, ThemedNavbarComponent, NgFor, NgComponentOutlet, AsyncPipe, TranslateModule],
})
export class NavbarComponent extends BaseComponent {
}
