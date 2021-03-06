// ==UserScript==
// @name         Twibooru Legacy Image Layout
// @description  Revert styling changes.
// @version      1.1.1
// @author       Marker
// @license      MIT
// @namespace    https://github.com/marktaiwan/
// @homepageURL  https://github.com/marktaiwan/Derpibooru-Legacy-Image-Layout
// @supportURL   https://github.com/marktaiwan/Derpibooru-Legacy-Image-Layout/issues
// @match        https://*.twibooru.org/*
// @grant        none
// @inject-into  content
// @require      https://github.com/marktaiwan/Derpibooru-Unified-Userscript-Ui/raw/master/derpi-four-u.js?v1.2.3
// @noframes
// ==/UserScript==
(function (){
'use strict';

const SCRIPT_ID = 'legacy_layout';
const config = ConfigManager('Twibooru Legacy Image Layout', SCRIPT_ID, 'Revert styling changes.');
config.registerSetting({
  title: 'Upload info',
  key: 'metabar',
  description: 'Use the old two-toned metabar for upload info.',
  type: 'checkbox',
  defaultValue: true
});
config.registerSetting({
  title: 'Image description',
  key: 'description',
  description: 'Use the old image description style. Hide empty descriptions.',
  type: 'checkbox',
  defaultValue: true
});
config.registerSetting({
  title: 'Tags block',
  key: 'tag_block',
  description: 'Make the image tags span the entire page width.',
  type: 'checkbox',
  defaultValue: true
});
config.registerSetting({
  title: 'Tags style',
  key: 'tag_style',
  description: 'Use the old tag styling.',
  type: 'checkbox',
  defaultValue: true
});

const METABAR = config.getEntry('metabar');
const DESC = config.getEntry('description');
const TAG_BLOCK = config.getEntry('tag_block');
const TAG_STYLE = config.getEntry('tag_style');

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

function getBackgroundColor() {
  //   Adapt background color to theme, we create an element with the
  //   styles we want, then copy the computed style to the description box
  const ele = document.createElement('div');
  ele.classList.add('input');
  ele.style.padding = '0px';
  ele.style.border = '0px';
  ele.style.margin = '0px';
  document.body.appendChild(ele);
  const backgroundColor = window.getComputedStyle(ele).backgroundColor;
  ele.remove();
  return backgroundColor;
}

function initCSS() {
  let CSS = '/* Generated by Twibooru Legacy Layout */';
  const METABAR_CSS = `
#extrameta {
  padding-top: 4px;
}`;
  const DESC_CSS = `
.image-description {
  background: ${getBackgroundColor()};
  padding: 4px 0px;
}
.image-description > div > p {
  font-size: 18px;
  font-weight: normal;
  margin: 6px;
  margin-bottom: 18px;
}`;
  const TAG_STYLE_CSS = `
.tag__count {
  background: unset !important;
}`;

  if (METABAR) CSS += METABAR_CSS;
  if (DESC) CSS += DESC_CSS;
  if (TAG_STYLE) CSS += TAG_STYLE_CSS;

  if (!document.getElementById(`${SCRIPT_ID}-style`)) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.id = `${SCRIPT_ID}-style`;
    styleElement.innerHTML = CSS;
    document.body.insertAdjacentElement('afterend', styleElement);
  }
}

function revertTagStyle(parent = document) {
  // Revert tag styling of 2020-05-22
  for (const tag of $$('.tag.dropdown', parent)) {
    const span = tag.firstElementChild;
    const name = $('.tag__name', tag);
    const count = $('.tag__count', tag);
    count.innerText = ' (' + count.innerText + ') ';
    name.appendChild(count);
    span.insertAdjacentElement('afterbegin', name);
  }
}

initCSS();
const extrameta = $('#extrameta'),
      imageDescription = $('.image-description'),
      imageDescriptionText = $('.image-description__text'),
      descriptionForm = $('#description-form'),
      content = $('#content'),
      tagBox = $('.js-tagsauce'),
      tagEdit = $('div.js-imageform'),
      adBox = $('#imagespns');

// Revert metadata bar
if (METABAR && extrameta !== null) {
  extrameta.classList.add('block__header--light');
}

// Run if elements exists on page
if ([content, imageDescription, tagBox, imageDescriptionText].every(ele => ele !== null)) {
  // Revert tag width
  if (TAG_BLOCK) {
    const oldDiv = imageDescription.parentElement;
    const newDiv = document.createElement('div');
    newDiv.classList.add('layout--narrow');
    content.insertBefore(newDiv, oldDiv);
    content.insertBefore(tagBox, oldDiv);
    if (tagEdit !== null) tagEdit.classList.add('layout--narrow');

    if (adBox !== null) newDiv.appendChild(adBox);
    newDiv.appendChild(imageDescription);
    if (descriptionForm !== null) newDiv.appendChild(descriptionForm);
  }

  // Hide empty description box
  if (DESC && imageDescriptionText.firstChild === null && $('#edit-description', imageDescription) === null) {
    imageDescription.classList.toggle('hidden');
  }

  // Reapply changes on tag edit
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.matches('.js-tagsauce')) {
          const tagEdit = $('.js-imageform', node);
          if (TAG_BLOCK && tagEdit) tagEdit.classList.add('layout--narrow');
          if (TAG_STYLE) revertTagStyle(node);
        }
      }
    }
  });
  if (TAG_BLOCK || TAG_STYLE) observer.observe(content, {childList: true});
}

if (TAG_STYLE) revertTagStyle();

})();
