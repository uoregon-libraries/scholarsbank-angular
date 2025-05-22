import { Component } from '@angular/core';
import { TopLevelCommunityGroupComponent } from './top-level-community-group.component';
import { ThemedComponent } from '../../shared/theme-support/themed.component';

@Component({
  selector: 'ds-themed-top-level-community-group',
  styleUrls: [],
  templateUrl: '../../shared/theme-support/themed.component.html',
  standalone: true,
})
export class ThemedTopLevelCommunityGroupComponent extends ThemedComponent<TopLevelCommunityGroupComponent> {
  protected inAndOutputNames: (keyof TopLevelCommunityGroupComponent & keyof this)[];

  protected getComponentName(): string {
    return 'TopLevelCommunityGroupComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../../themes/${themeName}/app/home-page/top-level-community-group/top-level-community-group.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import(`./top-level-community-group.component`);
  }

}
