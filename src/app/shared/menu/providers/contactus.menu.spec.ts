/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { TestBed } from '@angular/core/testing';

import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { ContactUsMenuProvider } from './contactus.menu';

describe('ContactUsMenuProvider', () => {
  const expectedSections: PartialMenuSection[] = [
    {
      visible: true,
      model: {
        type: MenuItemType.LINK,
        text: `menu.section.contactus`,
        link: `/info/contactus`,
      },
    },
  ];

  let provider: ContactUsMenuProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ContactUsMenuProvider,
      ],
    });
    provider = TestBed.inject(ContactUsMenuProvider);
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('getSections should return expected menu sections', (done) => {
    provider.getSections().subscribe((sections) => {
      expect(sections).toEqual(expectedSections);
      done();
    });
  });
});
