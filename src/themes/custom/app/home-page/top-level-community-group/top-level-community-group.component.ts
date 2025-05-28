import { Component } from '@angular/core';
import {
  AsyncPipe,
  NgFor,
} from '@angular/common';
import { TopLevelCommunityGroupComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-group/top-level-community-group.component';

@Component({
  selector: 'ds-top-level-community-group',
  // styleUrls: ['./top-level-community-group.component.scss'],
  styleUrls: ['../../../../../app/home-page/top-level-community-group/top-level-community-group.component.scss'],
  // templateUrl: './top-level-community-group.component.html'
  templateUrl: '../../../../../app/home-page/top-level-community-group/top-level-community-group.component.html',
  standalone: true,
  imports: [AsyncPipe, NgFor],
})

export class TopLevelCommunityGroupComponent extends BaseComponent {}
