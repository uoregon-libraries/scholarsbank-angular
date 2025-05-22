import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, Inject } from '@angular/core';
import {
  AsyncPipe,
  NgFor,
} from '@angular/common';

import { BehaviorSubject, Observable, combineLatest as observableCombineLatest, of, Subscription } from 'rxjs';

import { SortDirection, SortOptions } from '../../core/cache/models/sort-options.model';
import { CommunityDataService } from '../../core/data/community-data.service';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { Community } from '../../core/shared/community.model';
import { fadeInOut } from '../../shared/animations/fade';
import { PaginationComponentOptions } from '../../shared/pagination/pagination-component-options.model';
import { hasValue } from '../../shared/empty.util';
import { switchMap } from 'rxjs/operators';
import { PaginationService } from '../../core/pagination/pagination.service';
import { AppConfig, APP_CONFIG } from 'src/config/app-config.interface';

interface Item {
  icon: string;
  label: string;
  uuid: string;
}

/**
 * this component renders the Top-Level Community list
 */
@Component({
  selector: 'ds-top-level-community-group',
  styleUrls: ['./top-level-community-group.component.scss'],
  templateUrl: './top-level-community-group.component.html',
  standalone: true,
  imports: [AsyncPipe, NgFor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut],
  
})

export class TopLevelCommunityGroupComponent implements OnInit, OnDestroy {
  /**
   * A list of remote data objects of all top communities
   */
  communitiesRD$: BehaviorSubject<RemoteData<PaginatedList<Community>>> = new BehaviorSubject<RemoteData<PaginatedList<Community>>>({} as any);

  /**
   * The pagination configuration
   */
  config: PaginationComponentOptions;

  /**
   * The pagination id
   */
  pageId = 'tl';

  /**
   * The sorting configuration
   */
  sortConfig: SortOptions;

  /**
   * The subscription to the observable for the current page.
   */
  currentPageSubscription: Subscription;

  items$: Observable<Item[]>;

  constructor(
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
    private cds: CommunityDataService,
    private paginationService: PaginationService
  ) {
    this.config = new PaginationComponentOptions();
    this.config.id = this.pageId;
    this.config.pageSize = appConfig.homePage.topLevelCommunityList.pageSize;
    this.config.currentPage = 1;
    this.sortConfig = new SortOptions('dc.title', SortDirection.ASC);
  }

  ngOnInit() {
    this.initPage();
    
    /**
   * Initialize all community groups
   */
    const items: Item[] = [
      { icon: 'Grad-Cap-01-UO-Green.png', label: 'Student Research', uuid: 'communities/dd3eace9-08b2-4493-8b6a-20cd0d508692' },
      { icon: 'Briefcase-01-UO-Green.png', label: 'University Scholarship', uuid: 'communities/2319638a-59a1-4449-81aa-1965eed0d3ac' },
      { icon: 'Globe-01-UO-Green.png', label: 'Open Publications', uuid: 'communities/ec3e0190-8af8-4a20-8ce8-868795af8c0e' },
      { icon: 'Newspaper-02-UO-Green.png', label: 'Archival Materials', uuid: 'communities/65590c43-5461-41b4-87c3-ad58db202a07' }
    ];

    this.items$ = of(items);
    console.log(items);
  }


  /**
   * Update the list of top communities
   */
  initPage() {
    const pagination$ = this.paginationService.getCurrentPagination(this.config.id, this.config);
    const sort$ = this.paginationService.getCurrentSort(this.config.id, this.sortConfig);

    this.currentPageSubscription = observableCombineLatest([pagination$, sort$]).pipe(
      switchMap(([currentPagination, currentSort]) => {
        return this.cds.findTop({
          currentPage: currentPagination.currentPage,
          elementsPerPage: currentPagination.pageSize,
          sort: {field: currentSort.field, direction: currentSort.direction}
        });
      })
    ).subscribe((results) => {
      this.communitiesRD$.next(results);
    });
  }

  /**
   * Unsubscribe the top list subscription if it exists
   */
  private unsubscribe() {
    if (hasValue(this.currentPageSubscription)) {
      this.currentPageSubscription.unsubscribe();
    }
  }

  /**
   * Clean up subscriptions when the component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe();
    this.paginationService.clearPagination(this.config.id);
  }

}
