export const SECTION_ACCESSIBILITY_ATTESTATION_FORM_MODEL =  {
  id: 'accessibilityAttestation',
  name: 'Accessibility Attestation',
  required: true,
  errorMessages: {
    required: 'submission.sections.accessibility-attestation.required',
  },
  options: [
    {
      label: `<p>I attest that my work is accessible.</p>
              <ul>
                <li>As applicable:
                  <ul>
                  <li>I followed available guidelines for the type of content I am submitting.</li>
                  <li>My content includes accessible images, headings, links, lists, and use of color.</li>
                  <li>I ran accessibility checks and corrected errors.</li>
                  <li>I used proper file format conversion methods.</li>
                  </ul>
                </li>
                <li>I understand that my work will be deposited without further accessibility review.</li>
                <li>I understand that, if requested by a Scholar's Bank user, library employees will alter my work as they deem necessary to provide an accessible copy.</li>
              </ul>`,
      value: 'attest'
    },
    {
      label: `<p>I am not sure if my work is fully accessible. I would like to request a consultation for this deposit.</p>
              <ul>
                <li>I understand that I am still responsible for submitting accessible content and will be expected to make the changes recommended by library accessibility experts. You will be contacted within 5 business days with recommendations. Please click the Save for Later button to alert the Libraries.</li>
              </ul>`,
      value: 'consultation',
    },
  ],
};
