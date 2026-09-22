import { 
  AsyncPipe, 
  NgForOf, 
  NgIf 
} from '@angular/common';
import { 
  ChangeDetectorRef, 
  Component, 
  Inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { 
  BehaviorSubject, 
  Observable, 
  Subscription 
} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
} from 'rxjs/operators';
import { 
  hasValue,
  isNotEmpty 
} from '../../../shared/empty.util';
import { JsonPatchOperationPathCombiner } from 'src/app/core/json-patch/builder/json-patch-operation-path-combiner';
import { JsonPatchOperationsBuilder } from 'src/app/core/json-patch/builder/json-patch-operations-builder';

import { SectionModelComponent } from '../models/section.model';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsService } from '../sections.service';
import { SectionsType } from '../sections-type';
import { SubmissionService } from '../../submission.service';
import { SECTION_ACCESSIBILITY_ATTESTATION_FORM_MODEL } from '../models/section-accessibility-attestation.model';

/**
 * This component represents the accessibility attestation section.
 */
@Component({
  selector: 'ds-section-accessibility-attestation',
  templateUrl: './section-accessibility-attestation.component.html',
  styleUrls: ['./section-accessibility-attestation.component.scss'],
  imports: [
    TranslateModule,
    NgIf,
    NgForOf,
    AsyncPipe,
    FormsModule,
  ],
  standalone: true,
})
export class SubmissionSectionAccessibilityAttestationComponent extends SectionModelComponent {
  /**
   * The form model configuration
   */
  public readonly formConfig = SECTION_ACCESSIBILITY_ATTESTATION_FORM_MODEL;

  /**
   * The list of Subscriptions this component subscribes to
   */
  private subs: Subscription[] = [];

  /**
   * The section status subject.
   */
  private sectionStatus$: BehaviorSubject<boolean>;

  /**
   * The [[JsonPatchOperationPathCombiner]] object
   */
  protected pathCombiner: JsonPatchOperationPathCombiner;

  constructor(
    protected sectionService: SectionsService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected operationsBuilder: JsonPatchOperationsBuilder,
    private submissionService: SubmissionService,
    @Inject('collectionIdProvider') public injectedCollectionId: string,
    @Inject('sectionDataProvider') public injectedSectionData: SectionDataObject,
    @Inject('submissionIdProvider') public injectedSubmissionId: string,
  ) {
    super(
      injectedCollectionId,
      injectedSectionData,
      injectedSubmissionId,
    );
  }

  get selectedValue(): string {
    const sectionData = this.sectionData.data;
    if (sectionData && typeof (sectionData as any).attested === 'string') {
      return (sectionData as any).attested;
    }
    return null;
  }

  set selectedValue(value: string) {
    if (value !== this.selectedValue) {
      this.updateSectionData(value);
    }
  }

  /**
   * Determine whether or not a value has been selected. Return true if a value is selected,
   * false otherwise
   */
  getSectionStatus(): Observable<boolean> {
    return this.sectionStatus$.asObservable().pipe(distinctUntilChanged());
  }

  /**
   * Initialize the section.
   */
  onSectionInit(): void {
    this.pathCombiner = new JsonPatchOperationPathCombiner('sections', this.sectionData.id);
    this.sectionStatus$ = new BehaviorSubject<boolean>(isNotEmpty(this.selectedValue));

    this.subs.push(
      this.sectionService.getSectionState(this.submissionId, this.sectionData.id, SectionsType.AccessibilityAttestation).pipe(
        filter((sectionState) => isNotEmpty(sectionState)),
        distinctUntilChanged(),
      ).subscribe((sectionState) => {
        const data = sectionState.data;
        if (data !== this.sectionData.data) {
          this.sectionData.data = data as any;
        }
        if (isNotEmpty(sectionState.errorsToShow)) {
          this.sectionData.errorsToShow = sectionState.errorsToShow;
        } else {
          this.sectionData.errorsToShow = [];
        }
        this.changeDetectorRef.detectChanges();
      }),
    );
  }

  /**
   * Update the section data.
   */
  protected updateSectionData(data: string) {
    this.sectionData.data = data;
    this.sectionStatus$.next(isNotEmpty(data));

    // Update metadata value
    this.operationsBuilder.add(this.pathCombiner.getPath('local.accessibility.attestation'), data, true);

    this.sectionService.dispatchRemoveSectionErrors(this.submissionId, this.sectionData.id);
    this.submissionService.dispatchSaveSection(this.submissionId, this.sectionData.id);
  }

  /**
   * Update selected value on radio button selection change
   */
  onChange(event: any) {
    const value = event.target.value;
    this.updateSectionData(value);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  onSectionDestroy() {
    this.subs
      .filter((subscription) => hasValue(subscription))
      .forEach((subscription) => subscription.unsubscribe());
  }
}
