import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of as observableOf } from 'rxjs';

import { JsonPatchOperationsBuilder } from '../../../core/json-patch/builder/json-patch-operations-builder';
import { FormService } from '../../../shared/form/form.service';
import { mockSubmissionCollectionId, mockSubmissionId } from '../../../shared/mocks/submission.mock';
import { SubmissionService } from '../../submission.service';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsService } from '../sections.service';
import { SectionsType } from '../sections-type';
import { SubmissionSectionAccessibilityAttestationComponent } from './section-accessibility-attestation.component';
import { SubmissionSectionObject } from '../../objects/submission-section-object.model';
import { SectionScope } from '../../objects/section-visibility.model';

describe('SubmissionSectionAccessibilityAttestationComponent', () => {
  let component: SubmissionSectionAccessibilityAttestationComponent;
  let fixture: ComponentFixture<SubmissionSectionAccessibilityAttestationComponent>;
  let sectionsService: jasmine.SpyObj<SectionsService>;
  let submissionService: jasmine.SpyObj<SubmissionService>;
  let operationsBuilder: jasmine.SpyObj<JsonPatchOperationsBuilder>;
  let formService: jasmine.SpyObj<FormService>;

  const sectionObject: SectionDataObject = {
    config: 'accessibility-attestation',
    mandatory: true,
    data: {
      attested: null,
    },
    errorsToShow: [],
    serverValidationErrors: [],
    header: 'submit.progressbar.accessibilityAttestation',
    id: 'accessibility_attestation',
    sectionType: SectionsType.AccessibilityAttestation,
  };

  beforeEach(waitForAsync(() => {
    sectionsService = jasmine.createSpyObj<SectionsService>('SectionsService', [
      'getSectionState',
      'setSectionStatus',
      'dispatchRemoveSectionErrors',
    ]);
    const sectionState: SubmissionSectionObject = {
      header: sectionObject.header,
      config: sectionObject.config,
      mandatory: sectionObject.mandatory,
      scope: SectionScope.Submission,
      sectionType: sectionObject.sectionType,
      visibility: { main: true, other: true },
      collapsed: false,
      enabled: true,
      metadata: [],
      data: sectionObject.data,
      errorsToShow: [],
      serverValidationErrors: [],
      isLoading: false,
      isValid: true,
      formId: 'accessibility-attestation-form',
    };
    sectionsService.getSectionState.and.returnValue(observableOf(sectionState));
    sectionsService.setSectionStatus.and.stub();
    sectionsService.dispatchRemoveSectionErrors.and.stub();

    submissionService = jasmine.createSpyObj<SubmissionService>('SubmissionService', [
      'dispatchSaveSection',
    ]);

    operationsBuilder = jasmine.createSpyObj<JsonPatchOperationsBuilder>('JsonPatchOperationsBuilder', [
      'add',
    ]);

    formService = jasmine.createSpyObj<FormService>('FormService', [
      'getUniqueId',
    ]);
    formService.getUniqueId.and.returnValue('accessibility-attestation-form');

    void TestBed.configureTestingModule({
      imports: [
        FormsModule,
        TranslateModule.forRoot(),
        SubmissionSectionAccessibilityAttestationComponent,
      ],
      providers: [
        { provide: SectionsService, useValue: sectionsService },
        { provide: SubmissionService, useValue: submissionService },
        { provide: JsonPatchOperationsBuilder, useValue: operationsBuilder },
        { provide: FormService, useValue: formService },
        { provide: 'collectionIdProvider', useValue: mockSubmissionCollectionId },
        { provide: 'sectionDataProvider', useValue: Object.assign({}, sectionObject) },
        { provide: 'submissionIdProvider', useValue: mockSubmissionId },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionSectionAccessibilityAttestationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the required validation message when no selection has been made', () => {
    const sectionState: SubmissionSectionObject = {
      header: sectionObject.header,
      config: sectionObject.config,
      mandatory: sectionObject.mandatory,
      scope: SectionScope.Submission,
      sectionType: sectionObject.sectionType,
      visibility: { main: true, other: true },
      collapsed: false,
      enabled: true,
      metadata: [],
      data: { attested: null },
      errorsToShow: [
        {
          path: '/sections/accessibility_attestation',
          message: 'error.validation.accessibility-attestation.required',
        } as any,
      ],
      serverValidationErrors: [],
      isLoading: false,
      isValid: true,
      formId: 'accessibility-attestation-form',
    };
    sectionsService.getSectionState.and.returnValue(observableOf(sectionState));

    fixture = TestBed.createComponent(SubmissionSectionAccessibilityAttestationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedValue).toBeNull();
    expect(component.sectionData.errorsToShow.length).toBe(1);
    expect(component.sectionData.errorsToShow[0].message).toBe('error.validation.accessibility-attestation.required');
  });

  it('stores the selected attestation value in the patch operation metadata', () => {
    component.selectedValue = 'attest';

    expect(component.sectionData.data).toBe('attest');
    expect(component.sectionData.errorsToShow.length).toBe(0);
    expect(operationsBuilder.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ path: '/sections/accessibility_attestation/local.accessibility-attestation' }),
      'attest',
      true,
    );
    expect(submissionService.dispatchSaveSection).toHaveBeenCalledWith(mockSubmissionId, sectionObject.id);
  });
});
